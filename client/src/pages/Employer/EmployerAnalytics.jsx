import { useState, useEffect } from 'react';
import { SeoHead } from '../../components/seo';
import { employerApi } from '../../services/employerService';

export default function EmployerAnalytics() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    employerApi.getJobs({}).then(({ data }) => setJobs(data.data || [])).catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setAnalytics(null);
      return;
    }
    employerApi
      .jobAnalytics(selectedJobId)
      .then(({ data }) => setAnalytics(data))
      .catch(() => setAnalytics(null));
  }, [selectedJobId]);

  return (
    <>
      <SeoHead title="Job Analytics" description="View analytics for your job posts." noindex />
      <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] mb-6">Job Analytics</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-2">Select job</label>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
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
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <p className="text-sm text-slate-600">Views</p>
            <p className="text-2xl font-semibold text-[#0F172A]">{analytics.views}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <p className="text-sm text-slate-600">Applications</p>
            <p className="text-2xl font-semibold text-[#0F172A]">{analytics.applications}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <p className="text-sm text-slate-600">Conversion Rate</p>
            <p className="text-2xl font-semibold text-[#0F172A]">{analytics.conversionRate}</p>
          </div>
        </div>
      )}
    </>
  );
}
