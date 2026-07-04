import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { employerApi } from '../../services/employerService';
import { ROUTES } from '../../constants';

export default function EmployerJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    employerApi
      .getJobs({ status: status || undefined })
      .then(({ data }) => setJobs(data.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <>
      <SeoHead title="My Job Posts" description="View and manage your employer job posts." noindex />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">My Job Posts</h1>
        <Link
          to={ROUTES.EMPLOYER_POST_JOB}
          className="px-4 py-2 bg-[#635BFF] hover:bg-[#4F46E5] text-white text-sm font-medium rounded-lg"
        >
          Post New Job
        </Link>
      </div>
      <div className="mb-4 flex gap-2">
        {['', 'draft', 'active', 'closed'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              status === s ? 'bg-[#635BFF] text-white' : 'bg-white border border-[#E5E7EB] text-slate-600'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-600">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            No jobs found.{' '}
            <Link to={ROUTES.EMPLOYER_POST_JOB} className="text-[#635BFF] font-medium">
              Post a job
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Title</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Views</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Applications</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {jobs.map((j) => (
                <tr key={j._id}>
                  <td className="py-3 px-4">
                    <Link to={`/jobs/${j.slug}`} className="font-medium text-[#0F172A] hover:text-[#635BFF]" target="_blank" rel="noopener noreferrer">
                      {j.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded ${
                        j.status === 'active' ? 'bg-green-100 text-green-800' : j.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{j.views ?? 0}</td>
                  <td className="py-3 px-4 text-slate-600">{j.applicationsCount ?? 0}</td>
                  <td className="py-3 px-4">
                    <Link
                      to={`${ROUTES.EMPLOYER_APPLICATIONS}?jobId=${j._id}`}
                      className="text-sm text-[#635BFF] hover:underline"
                    >
                      View applications
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
