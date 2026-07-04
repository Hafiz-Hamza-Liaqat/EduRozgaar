import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { employerApi } from '../../services/employerService';
import { ROUTES } from '../../constants';

const Card = ({ title, value, sub }) => (
  <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
    <p className="text-sm text-slate-600 font-medium">{title}</p>
    <p className="text-2xl font-semibold tracking-tight text-[#0F172A] mt-1">{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
);

export default function EmployerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employerApi
      .dashboard()
      .then(({ data: d }) => setData(d))
      .catch(() => setData({ activeJobs: 0, totalApplications: 0, totalViews: 0, shortlistedCandidates: 0, jobs: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl border border-[#E5E7EB] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <SeoHead title="Employer Dashboard" description="Manage your job posts and applications." noindex />
      <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card title="Active Jobs" value={data?.activeJobs ?? 0} />
        <Card title="Total Applications" value={data?.totalApplications ?? 0} />
        <Card title="Total Views" value={data?.totalViews ?? 0} />
        <Card title="Shortlisted" value={data?.shortlistedCandidates ?? 0} />
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <h2 className="font-semibold text-[#0F172A]">Recent Job Posts</h2>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {(data?.jobs || []).length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              No jobs yet.{' '}
              <Link to={ROUTES.EMPLOYER_POST_JOB} className="text-[#635BFF] hover:text-[#4F46E5] font-medium">
                Post your first job
              </Link>
            </div>
          ) : (
            (data?.jobs || []).map((j) => (
              <div key={j._id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <Link
                    to={`${ROUTES.EMPLOYER_JOBS}?id=${j._id}`}
                    className="font-medium text-[#0F172A] hover:text-[#635BFF]"
                  >
                    {j.title}
                  </Link>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Views: {j.views} · Applications: {j.applications} · Shortlisted: {j.shortlisted}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
