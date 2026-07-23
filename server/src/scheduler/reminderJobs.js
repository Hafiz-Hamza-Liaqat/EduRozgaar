import { User } from '../models/User.js';
import { Scholarship } from '../models/Scholarship.js';
import { Admission } from '../models/Admission.js';
import { Job } from '../models/Job.js';
import { queueNotification, onSubscriptionExpiring } from '../services/automationService.js';

function weekKey() {
  const d = new Date();
  return `${d.getFullYear()}-W${Math.ceil((d.getDate() + 6 - d.getDay()) / 7)}`;
}

export async function runScholarshipDeadlineReminders() {
  const in7days = new Date();
  in7days.setDate(in7days.getDate() + 7);
  const now = new Date();
  const scholarships = await Scholarship.find({
    status: 'active',
    deadline: { $gte: now, $lte: in7days },
  }).select('title deadline').lean();

  let queued = 0;
  for (const sch of scholarships) {
    const users = await User.find({ savedScholarships: sch._id }).select('_id').lean();
    for (const u of users) {
      const result = await queueNotification({
        dedupKey: `scholarship_reminder:${sch._id}:${u._id}:${weekKey()}`,
        recipientType: 'user',
        userId: u._id,
        category: 'scholarship',
        type: 'scholarship.deadline_near',
        title: `Scholarship deadline approaching: ${sch.title}`,
        body: `Deadline: ${sch.deadline ? new Date(sch.deadline).toLocaleDateString() : 'soon'}`,
        link: '/scholarships',
        metadata: { scholarshipId: sch._id },
      });
      if (result.enqueued) queued += 1;
    }
  }
  return { scholarships: scholarships.length, notificationsQueued: queued };
}

export async function runAdmissionDeadlineReminders() {
  const in7days = new Date();
  in7days.setDate(in7days.getDate() + 7);
  const now = new Date();
  const admissions = await Admission.find({
    status: 'active',
    deadline: { $gte: now, $lte: in7days },
  }).select('program institution deadline').lean();

  let queued = 0;
  for (const adm of admissions) {
    const users = await User.find({ savedAdmissions: adm._id }).select('_id').lean();
    const label = adm.program || adm.institution || 'Admission';
    for (const u of users) {
      const result = await queueNotification({
        dedupKey: `admission_reminder:${adm._id}:${u._id}:${weekKey()}`,
        recipientType: 'user',
        userId: u._id,
        category: 'admission',
        type: 'admission.deadline_near',
        title: `Admission deadline approaching: ${label}`,
        body: `Deadline: ${adm.deadline ? new Date(adm.deadline).toLocaleDateString() : 'soon'}`,
        link: '/admissions',
        metadata: { admissionId: adm._id },
      });
      if (result.enqueued) queued += 1;
    }
  }
  return { admissions: admissions.length, notificationsQueued: queued };
}

export async function runSubscriptionExpiryReminders() {
  const in7days = new Date();
  in7days.setDate(in7days.getDate() + 7);
  const now = new Date();
  const jobs = await Job.find({
    paidUntil: { $gte: now, $lte: in7days },
    employerId: { $exists: true, $ne: null },
  }).select('title employerId paidUntil').lean();

  for (const job of jobs) {
    await onSubscriptionExpiring({
      jobId: job._id,
      employerId: job.employerId,
      jobTitle: job.title,
      expiresAt: job.paidUntil,
    });
  }
  return { jobs: jobs.length };
}
