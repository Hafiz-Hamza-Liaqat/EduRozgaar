import { Employer } from '../models/Employer.js';
import { signEmployerToken, signRefreshToken, verifyToken } from '../utils/jwt.js';
import {
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAccessToken,
} from '../utils/tokenStore.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit, auditFromRequest } from '../services/auditService.js';

function toSafeEmployer(employer) {
  if (!employer) return null;
  const e = employer.toObject ? employer.toObject() : employer;
  delete e.password;
  return e;
}

async function issueEmployerSession(employer) {
  const employerId = employer._id.toString();
  const accessToken = signEmployerToken(employerId);
  const refreshToken = signRefreshToken({ employerId, role: 'employer' });
  await storeRefreshToken(employerId, refreshToken, 'employer');
  return {
    employer: toSafeEmployer(employer),
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  };
}

export const employerRegister = asyncHandler(async (req, res) => {
  const { companyName, email, phone, website, companyDescription, password } = req.body;
  if (!companyName || !email || !password) {
    return res.status(400).json({ error: 'companyName, email and password are required' });
  }
  const emailNorm = email.trim().toLowerCase();
  const existing = await Employer.findOne({ email: emailNorm });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered as employer' });
  }
  const employer = await Employer.create({
    companyName: (companyName || '').trim(),
    email: emailNorm,
    phone: (phone || '').trim(),
    website: (website || '').trim(),
    companyDescription: (companyDescription || '').trim(),
    password,
  });
  const session = await issueEmployerSession(await Employer.findById(employer._id));
  res.status(201).json(session);
});

export const employerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const emailNorm = email.trim().toLowerCase();
  const employer = await Employer.findOne({ email: emailNorm }).select('+password');
  if (!employer || !(await employer.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const session = await issueEmployerSession(await Employer.findById(employer._id));
  res.json(session);
});

export const employerMe = asyncHandler(async (req, res) => {
  const employer = await Employer.findById(req.employer.employerId);
  if (!employer) return res.status(404).json({ error: 'Employer not found' });
  res.json({ employer: toSafeEmployer(employer) });
});

export const employerLogout = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const employerId = req.employer?.employerId;
  if (employerId) {
    await revokeRefreshToken(employerId, 'employer');
    const employer = await Employer.findById(employerId).select('email companyName');
    if (employer) {
      await logAudit({
        ...auditFromRequest(req),
        actor: { employerId, email: employer.email, role: 'employer' },
        action: 'auth.employer.logout',
        targetType: 'employer',
        targetId: employerId,
        targetLabel: employer.email,
      });
    }
  }
  if (token) {
    await revokeAccessToken(token);
  }
  res.json({ message: 'Logged out' });
});

export const employerRefreshToken = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.headers['x-refresh-token'];
  if (!token) return res.status(401).json({ error: 'Refresh token required' });
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
  if (decoded.type !== 'refresh' || !decoded.employerId || decoded.role !== 'employer') {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  const valid = await validateRefreshToken(decoded.employerId, token, 'employer');
  if (!valid) {
    return res.status(401).json({ error: 'Refresh token revoked or expired' });
  }
  const employer = await Employer.findById(decoded.employerId);
  if (!employer) return res.status(401).json({ error: 'Employer not found' });
  const accessToken = signEmployerToken(employer._id);
  const newRefreshToken = signRefreshToken({ employerId: employer._id.toString(), role: 'employer' });
  await storeRefreshToken(employer._id.toString(), newRefreshToken, 'employer');
  res.json({
    employer: toSafeEmployer(employer),
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
});
