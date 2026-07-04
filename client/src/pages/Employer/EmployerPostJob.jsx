import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { employerApi } from '../../services/employerService';
import { ROUTES } from '../../constants';

const defaultForm = {
  jobTitle: '',
  companyName: '',
  location: '',
  jobType: 'Private',
  type: 'full-time',
  salaryRange: '',
  skillsRequired: '',
  jobDescription: '',
  applicationDeadline: '',
  applyLink: '',
  applyEmail: '',
};

export default function EmployerPostJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [plans, setPlans] = useState([]);
  const [step, setStep] = useState('form');
  const [createdJob, setCreatedJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    employerApi.plans().then(({ data }) => setPlans(data.data || [])).catch(() => setPlans([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmitDraft = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        skillsRequired: form.skillsRequired ? form.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
      const { data } = await employerApi.createJob(payload);
      setCreatedJob(data.job);
      setStep('plan');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (planId) => {
    if (!createdJob) return;
    setSubmitting(true);
    setError('');
    try {
      await employerApi.activateJob(createdJob._id, { planId });
      navigate(ROUTES.EMPLOYER_JOBS);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to activate');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'plan' && createdJob) {
    return (
      <>
        <SeoHead title="Choose Plan" description="Select a plan to publish your job post." noindex />
        <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] mb-2">Choose a plan</h1>
        <p className="text-slate-600 mb-6">Job &quot;{createdJob.title}&quot; is saved as draft. Select a plan to publish.</p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        <div className="grid gap-4 max-w-2xl">
          {createdJob.planType === 'free' && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <h3 className="font-semibold text-[#0F172A]">First Job Free</h3>
              <p className="text-sm text-slate-600 mt-1">Your first job post is free. Submit for approval.</p>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleActivate(null)}
                className="mt-4 px-4 py-2 bg-[#635BFF] hover:bg-[#4F46E5] text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                Activate (Free)
              </button>
            </div>
          )}
          {plans.map((plan) => (
            <div key={plan._id} className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <h3 className="font-semibold text-[#0F172A]">{plan.name}</h3>
              <p className="text-2xl font-semibold text-[#635BFF] mt-1">${plan.price}</p>
              <p className="text-sm text-slate-600 mt-1">
                {plan.durationDays ? `${plan.durationDays} days` : 'Until filled'}
              </p>
              <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
                {(plan.features || []).slice(0, 3).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleActivate(plan._id)}
                className="mt-4 px-4 py-2 bg-[#635BFF] hover:bg-[#4F46E5] text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                Pay &amp; Publish
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead title="Post New Job" description="Create and publish a new job listing." noindex />
      <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] mb-6">Post New Job</h1>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmitDraft} className="max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1">Job Title *</label>
          <input
            name="jobTitle"
            value={form.jobTitle}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
            placeholder="e.g. React Developer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1">Company Name *</label>
          <input
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1">Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
            placeholder="e.g. Lahore, Pakistan"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Job Type</label>
            <select
              name="jobType"
              value={form.jobType}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
            >
              <option value="Private">Private</option>
              <option value="Government">Government</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Work Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1">Salary Range</label>
          <input
            name="salaryRange"
            value={form.salaryRange}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
            placeholder="e.g. 50k - 80k PKR"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1">Skills (comma-separated)</label>
          <input
            name="skillsRequired"
            value={form.skillsRequired}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
            placeholder="React, Node.js, MongoDB"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1">Description *</label>
          <textarea
            name="jobDescription"
            value={form.jobDescription}
            onChange={handleChange}
            required
            rows={5}
            className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1">Application Deadline</label>
          <input
            name="applicationDeadline"
            type="date"
            value={form.applicationDeadline}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1">Apply Link</label>
          <input
            name="applyLink"
            type="url"
            value={form.applyLink}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1">Or Apply Email</label>
          <input
            name="applyEmail"
            type="email"
            value={form.applyEmail}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-[#635BFF] hover:bg-[#4F46E5] text-white font-medium rounded-lg disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save draft & choose plan'}
        </button>
      </form>
    </>
  );
}
