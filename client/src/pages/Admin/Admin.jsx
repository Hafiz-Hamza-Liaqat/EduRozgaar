import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import axiosInstance from '../../services/axiosBase';
import { ROUTES } from '../../constants';

const TABS = [
  { path: ROUTES.ADMIN, label: 'Overview' },
  { path: `${ROUTES.ADMIN}/growth-dashboard`, label: 'Growth' },
  { path: `${ROUTES.ADMIN}/ai-job-generator`, label: 'AI Job Generator' },
  { path: `${ROUTES.ADMIN}/analytics`, label: 'Analytics' },
  { path: `${ROUTES.ADMIN}/alerts`, label: 'Alerts' },
];

export default function Admin() {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axiosInstance
      .get('/admin')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || err.message));
  }, []);

  const isOverview = location.pathname === ROUTES.ADMIN || location.pathname === `${ROUTES.ADMIN}/`;

  return (
    <>
      {isOverview && <SeoHead title="Admin" description="EduRozgaar admin panel." noindex />}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin panel</h1>
        <nav className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          {TABS.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`pb-2 px-1 text-sm font-medium border-b-2 -mb-px ${
                (path === ROUTES.ADMIN ? isOverview : location.pathname === path)
                  ? 'border-primary text-primary dark:text-mint'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 mb-6">
            {error}
          </div>
        )}
        {isOverview && data && (
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <pre className="text-sm text-gray-700 dark:text-gray-300">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
        {!isOverview && <Outlet />}
      </div>
    </>
  );
}
