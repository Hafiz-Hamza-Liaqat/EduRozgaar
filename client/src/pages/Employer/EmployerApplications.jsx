import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { employerApi } from '../../services/employerService';

const STATUS_OPTIONS = ['shortlisted', 'rejected', 'interview', 'hired'];

export default function EmployerApplications() {
  const { t } = useTranslation(['employer', 'common']);
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(jobId);
  const [loading, setLoading] = useState(true);

  const statusLabel = (s) => t(`employer:status${s.charAt(0).toUpperCase()}${s.slice(1)}`, { defaultValue: s });

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
      <SeoHead title={t('employer:applications')} description={t('employer:applicationsSeoDesc')} noindex />
      <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] mb-6">{t('employer:applications')}</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-2">{t('employer:selectJob')}</label>
        <select
          value={selectedJobId || ''}
          onChange={(e) => setSelectedJobId(e.target.value || null)}
          className="w-full max-w-md px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A]"
        >
          <option value="">{t('employer:selectJobPlaceholder')}</option>
          {jobs.map((j) => (
            <option key={j._id} value={j._id}>
              {j.title}
            </option>
          ))}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-600">{t('common:loading')}</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-slate-600">{t('employer:noApplications')}</div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {applications.map((app) => (
              <div key={app._id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-[#0F172A]">
                    {app.candidate?.displayName || app.userId?.name || t('employer:applicant')}
                  </p>
                  {app.candidate?.headline && (
                    <p className="text-sm text-slate-500">{app.candidate.headline}</p>
                  )}
                  <p className="text-sm text-slate-600">{app.userId?.email}</p>
                  {app.candidate?.skills?.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">{app.candidate.skills.join(' · ')}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {t('employer:appliedOn', {
                      date: app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '-',
                    })}{' '}
                    · {t('employer:statusLabel', { status: statusLabel(app.status) })}
                  </p>
                  {app.resumeURL && (
                    <a
                      href={app.resumeURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#635BFF] hover:underline mt-1 inline-block"
                    >
                      {t('employer:downloadResume')}
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateStatus(app._id, s)}
                      disabled={app.status === s}
                      className={`px-3 py-2 text-xs rounded-lg min-h-[44px] ${
                        app.status === s
                          ? 'bg-[#635BFF] text-white'
                          : 'border border-[#E5E7EB] text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {statusLabel(s)}
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
