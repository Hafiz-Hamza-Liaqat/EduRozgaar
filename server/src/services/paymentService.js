import Stripe from 'stripe';
import { Payment } from '../models/Payment.js';
import { Job } from '../models/Job.js';
import { JobPlan } from '../models/JobPlan.js';

let stripe = null;

function getStripe() {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  return stripe;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Create Stripe Checkout session for employer job plan.
 */
export async function createCheckoutSession({ employerId, jobId, planId, successUrl, cancelUrl }) {
  const stripeClient = getStripe();
  if (!stripeClient) {
    throw new Error('Payment gateway not configured. Set STRIPE_SECRET_KEY.');
  }

  const [job, plan] = await Promise.all([
    Job.findOne({ _id: jobId, employerId }),
    JobPlan.findById(planId),
  ]);
  if (!job) throw new Error('Job not found');
  if (!plan || !plan.isActive) throw new Error('Invalid plan');
  if (plan.price <= 0) throw new Error('Use free activation for this plan');

  const payment = await Payment.create({
    employerId,
    jobId: job._id,
    planId: plan._id,
    amount: plan.price,
    currency: 'usd',
    provider: 'stripe',
    status: 'pending',
  });

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(plan.price * 100),
          product_data: {
            name: `EduRozgaar Job Post — ${plan.name}`,
            description: job.title,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentId: payment._id.toString(),
      employerId: employerId.toString(),
      jobId: job._id.toString(),
      planId: plan._id.toString(),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  payment.providerSessionId = session.id;
  await payment.save();

  return { sessionId: session.id, url: session.url, paymentId: payment._id.toString() };
}

/**
 * Verify payment is completed for job activation.
 */
export async function verifyPaymentForActivation({ paymentId, employerId, jobId, planId }) {
  if (!paymentId) return { ok: false, error: 'paymentId is required for paid plans' };

  const payment = await Payment.findOne({
    _id: paymentId,
    employerId,
    jobId,
    status: 'completed',
  });
  if (!payment) return { ok: false, error: 'Payment not found or not completed' };
  if (planId && payment.planId?.toString() !== planId.toString()) {
    return { ok: false, error: 'Payment does not match selected plan' };
  }
  return { ok: true, payment };
}

/**
 * Handle Stripe webhook — mark payment complete and optionally activate job.
 */
export async function handleStripeWebhook(rawBody, signature) {
  const stripeClient = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeClient || !secret) throw new Error('Stripe webhook not configured');

  const event = stripeClient.webhooks.constructEvent(rawBody, signature, secret);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;
    if (!paymentId) return { handled: false };

    const payment = await Payment.findById(paymentId);
    if (!payment) return { handled: false };

    payment.status = 'completed';
    payment.providerPaymentId = session.payment_intent || session.id;
    payment.metadata = { ...payment.metadata, sessionId: session.id };
    await payment.save();

    const job = await Job.findById(payment.jobId);
    const plan = payment.planId ? await JobPlan.findById(payment.planId) : null;
    if (job && job.status !== 'active') {
      let expiresAt = null;
      if (plan?.durationDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.durationDays);
      }
      job.status = 'active';
      job.planId = plan?._id || job.planId;
      job.planType = plan?.slug || job.planType || 'standard';
      job.expiresAt = expiresAt;
      job.paidUntil = expiresAt;
      job.approvalStatus = 'pending';
      await job.save();
    }

    if (payment.employerId) {
      const { onPaymentSuccess } = await import('./automationService.js');
      onPaymentSuccess({
        paymentId: payment._id,
        employerId: payment.employerId,
        jobId: payment.jobId,
        amount: payment.amount,
      }).catch(() => {});
    }

    return { handled: true, paymentId: payment._id.toString(), jobId: payment.jobId?.toString() };
  }

  return { handled: false, type: event.type };
}
