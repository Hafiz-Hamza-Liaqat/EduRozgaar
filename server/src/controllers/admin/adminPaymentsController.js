import { Payment } from '../../models/Payment.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listResponse, paginate } from '../../utils/apiResponse.js';
import { sanitizeString } from '../../utils/sanitize.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function buildQuery(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.provider) filter.provider = q.provider;
  if (q.employerId) filter.employerId = q.employerId;
  if (q.from || q.to) {
    filter.createdAt = {};
    if (q.from) filter.createdAt.$gte = new Date(q.from);
    if (q.to) filter.createdAt.$lte = new Date(q.to);
  }
  return filter;
}

export const listPayments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  const query = buildQuery(req.query);

  const [data, total, stats] = await Promise.all([
    Payment.find(query)
      .populate('employerId', 'companyName email')
      .populate('jobId', 'title slug company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(query),
    Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const summary = {
    revenue: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    completed: 0,
  };
  for (const row of stats) {
    if (row._id === 'completed') {
      summary.completed = row.count;
      summary.revenue = row.total || 0;
    } else if (row._id === 'pending') summary.pending = row.count;
    else if (row._id === 'failed') summary.failed = row.count;
    else if (row._id === 'refunded') summary.refunded = row.count;
  }

  res.json({
    ...listResponse(data, paginate(page, limit, total), req.query),
    summary,
  });
});

export const getPayment = asyncHandler(async (req, res) => {
  const doc = await Payment.findById(req.params.id)
    .populate('employerId', 'companyName email phone')
    .populate('jobId', 'title slug company status')
    .lean();
  if (!doc) return res.status(404).json({ error: 'Payment not found' });
  res.json(doc);
});
