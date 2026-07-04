import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { employerApi } from '../../services/employerService';

const STATUS_OPTIONS = ['shortlisted', 'rejected', 'interview', 'hired'];

export default function EmployerApplications() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(jobId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employerApi.getJobs({}).then(({ data }) => setJobs(data.data || [])).catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setApplications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    employerApi
      .getJobApplications(selectedJobId)
      .then(({ data }) => setApplications(data.data || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [selectedJobId]);

  const updateStatus = async (appId, status) => {
    try {
      await employerApi.updateApplicationStatus(appId, status);
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status } : a))
      );
    } catch {
      // ignore
    }
  };

  return (
    <>
      <SeoHead title="Applications" description="Review and manage job applications." noindex />
      <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] mb-6">Applications</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-2">Select job</label>
        <select
          value={selectedJobId || ''}
          onChange={(e) => setSelectedJobId(e.target.value || null)}
          className="w-full max-w-md px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
        >
          <option value="">-- Select a job --</option>
          {jobs.map((j) => (
            <option key={j._id} value={j._id}>
              {j.title}
            </option>
          ))}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-600">Loading...</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-slate-600">No applications for this job.</div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {applications.map((app) => (
              <div key={app._id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-[#0F172A]">{app.userId?.name || 'Applicant'}</p>
                  <p className="text-sm text-slate-600">{app.userId?.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Applied: {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '-'} · Status:{' '}
                    <span className="font-medium">{app.status}</span>
                  </p>
                  {app.resumeURL && (
                    <a
                      href={app.resumeURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#635BFF] hover:underline mt-1 inline-block"
                    >
                      Download resume
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateStatus(app._id, s)}
                      disabled={app.status === s}
                      className={`px-3 py-1 text-xs rounded-lg ${
                        app.status === s
                          ? 'bg-[#635BFF] text-white'
                          : 'border border-[#E5E7EB] text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
