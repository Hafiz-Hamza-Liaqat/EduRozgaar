import { SeoHead } from '../../components/seo';
import { useEmployerAuth } from '../../context/EmployerAuthContext';

export default function EmployerSettings() {
  const { employer } = useEmployerAuth();

  return (
    <>
      <SeoHead title="Employer Settings" description="Manage your employer account settings." noindex />
      <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] mb-6">Settings</h1>
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 max-w-xl">
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-slate-600">Company</dt>
            <dd className="font-medium text-[#0F172A]">{employer?.companyName}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-600">Email</dt>
            <dd className="text-[#0F172A]">{employer?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-600">Phone</dt>
            <dd className="text-[#0F172A]">{employer?.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-600">Website</dt>
            <dd className="text-[#0F172A]">
              {employer?.website ? (
                <a href={employer.website} target="_blank" rel="noopener noreferrer" className="text-[#635BFF] hover:underline">
                  {employer.website}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-slate-500">Profile update and billing will be available in a future release.</p>
      </div>
    </>
  );
}
