import { Link, useLocation, Outlet } from 'react-router-dom';
import { useEmployerAuth } from '../../context/EmployerAuthContext';
import { ROUTES } from '../../constants';

const MENU = [
  { path: ROUTES.EMPLOYER_DASHBOARD, label: 'Dashboard' },
  { path: ROUTES.EMPLOYER_JOBS, label: 'My Job Posts' },
  { path: ROUTES.EMPLOYER_POST_JOB, label: 'Post New Job' },
  { path: ROUTES.EMPLOYER_APPLICATIONS, label: 'Applications' },
  { path: ROUTES.EMPLOYER_ANALYTICS, label: 'Analytics' },
  { path: ROUTES.EMPLOYER_SETTINGS, label: 'Settings' },
];

export default function EmployerLayout() {
  const location = useLocation();
  const { employer, logout } = useEmployerAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
        <aside className="w-56 bg-white border-r border-[#E5E7EB] flex flex-col">
          <div className="p-4 border-b border-[#E5E7EB]">
            <Link to={ROUTES.HOME} className="text-[#0F172A] font-semibold tracking-tight">
              EduRozgaar
            </Link>
            <p className="text-xs text-slate-500 mt-1">Employer</p>
          </div>
          <nav className="p-2 flex-1">
            {MENU.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === path
                    ? 'bg-[#E0E7FF] text-[#635BFF]'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-[#E5E7EB]">
            <p className="text-xs text-slate-500 truncate px-2">{employer?.companyName}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-2 w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Log out
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">
            <Outlet />
          </div>
        </main>
    </div>
  );
}
