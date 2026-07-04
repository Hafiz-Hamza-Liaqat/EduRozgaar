import { useState, useEffect } from 'react';
import { SeoHead } from '../../components/seo';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, applicationsApi, referralsApi, resumesApi } from '../../services/listingsService';
import { ROUTES } from '../../constants';
import { formatDate } from '../../utils/formatDate';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';
import { Chatbot } from '../../components/chatbot/Chatbot';

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [applications, setApplications] = useState([]);
  const [referralData, setReferralData] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardApi
      .get()
      .then(({ data }) => setDashboard(data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    applicationsApi.getMy().then(({ data }) => setApplications(data.data || [])).catch(() => setApplications([]));
  }, []);
  useEffect(() => {
    referralsApi.getMy().then(({ data }) => setReferralData(data)).catch(() => setReferralData(null));
  }, []);
  useEffect(() => {
    resumesApi.getMy().then(({ data }) => setResumes(data || [])).catch(() => setResumes([]));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <SeoHead title="Dashboard" description="Your EduRozgaar dashboard." noindex />
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid sm:grid-cols-2 gap-4">
            <ListingCardSkeleton />
            <ListingCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <SeoHead title="Dashboard" noindex />
        <p className="text-red-600 dark:text-red-400">{error || 'Could not load dashboard.'}</p>
      </div>
    );
  }

  const { user: profile, saved, recentlyViewed, trending, notifications } = dashboard;
  const savedJobs = saved?.savedJobs || [];
  const savedScholarships = saved?.savedScholarships || [];
  const savedAdmissions = saved?.savedAdmissions || [];
  const savedInternships = saved?.savedInternships || [];
  const savedIntlScholarships = saved?.savedIntlScholarships || [];
  const recentJobs = recentlyViewed?.jobs || [];
  const recentScholarships = recentlyViewed?.scholarships || [];
  const recentAdmissions = recentlyViewed?.admissions || [];
  const trendingJobs = trending?.jobs || [];
  const trendingScholarships = trending?.scholarships || [];
  const trendingAdmissions = trending?.admissions || [];
  const notifList = notifications || [];

  return (
    <>
      <SeoHead title="Dashboard" description="Your EduRozgaar dashboard: saved listings, alerts, and recommendations." noindex />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Welcome back, {profile?.name || profile?.email}.</p>

        <div className="flex flex-wrap gap-3 mb-8">
          <Link to={ROUTES.RESUME_BUILDER} className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover btn-theme text-sm font-medium">
            Resume Builder
          </Link>
          <Link to={ROUTES.RESUME_ANALYZER} className="inline-flex items-center px-4 py-2 rounded-lg border-2 border-primary text-primary dark:text-mint hover:bg-mint/20 btn-theme text-sm font-medium">
            Resume Scanner
          </Link>
          <Link to={ROUTES.CAREER_GUIDANCE} className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium">
            Career Guidance
          </Link>
          <Link to={ROUTES.EXAM_PREP} className="inline-flex items-center px-4 py-2 rounded-lg border-2 border-primary text-primary dark:text-mint hover:bg-mint/20 dark:hover:bg-mint/10 btn-theme text-sm font-medium">
            Exam Preparation
          </Link>
          <Link to={ROUTES.INTERNSHIPS} className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium">
            Internships & Trainings
          </Link>
          <Link to={ROUTES.WEBINARS} className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium">
            Webinars
          </Link>
          <Link to={ROUTES.INTL_SCHOLARSHIPS} className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium">
            International Scholarships
          </Link>
          <Link to={ROUTES.BADGES_LEADERBOARD} className="inline-flex items-center px-4 py-2 rounded-lg border border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-sm font-medium">
            Badges & Leaderboard
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {notifList.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Alerts & Notifications</h2>
                <ul className="space-y-2">
                  {notifList.slice(0, 5).map((n) => (
                    <li key={n._id}>
                      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <p className="font-medium text-gray-900 dark:text-white">{n.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
                        {n.link && (
                          <a href={n.link} className="text-sm text-primary dark:text-mint mt-2 inline-block hover:underline">
                            Learn more →
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {resumes.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Resumes</h2>
                  <Link to={ROUTES.RESUME_BUILDER} className="text-sm text-primary dark:text-mint hover:underline">
                    Create New
                  </Link>
                </div>
                <ul className="space-y-2 mb-6">
                  {resumes.slice(0, 5).map((r) => (
                    <li key={r._id}>
                      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <span className="font-medium text-gray-900 dark:text-white">{r.title || 'My Resume'}</span>
                        <Link to={`${ROUTES.RESUME_BUILDER}?edit=${r._id}`} className="text-sm text-primary dark:text-mint hover:underline">
                          Edit
                        </Link>
                        <Link to={`${ROUTES.RESUME_BUILDER}?edit=${r._id}`} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                          Download (open → PDF)
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Saved listings</h2>
                <Link to={ROUTES.SAVED_JOBS} className="text-sm text-primary dark:text-mint hover:underline">
                  View all →
                </Link>
              </div>
              {savedJobs.length + savedScholarships.length + savedAdmissions.length + (savedInternships?.length || 0) + (savedIntlScholarships?.length || 0) === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No saved listings. Browse jobs and scholarships to save.</p>
              ) : (
                <ul className="space-y-2">
                  {savedJobs.slice(0, 3).map((j) => (
                    <li key={j._id}>
                      <Link to={`${ROUTES.JOBS}/${j.slug || j._id}`} className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{j.title}</span>
                        <span className="text-gray-500 dark:text-gray-400"> · {j.organization || j.company}</span>
                      </Link>
                    </li>
                  ))}
                  {savedScholarships.slice(0, 2).map((s) => (
                    <li key={s._id}>
                      <Link to={`${ROUTES.SCHOLARSHIPS}/${s.slug || s._id}`} className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{s.title}</span>
                        <span className="text-gray-500 dark:text-gray-400"> · {s.provider}</span>
                      </Link>
                    </li>
                  ))}
                  {savedAdmissions.slice(0, 2).map((a) => (
                    <li key={a._id}>
                      <Link to={`${ROUTES.ADMISSIONS}/${a.slug || a._id}`} className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{a.program}</span>
                        <span className="text-gray-500 dark:text-gray-400"> · {a.institution}</span>
                      </Link>
                    </li>
                  ))}
                  {(savedInternships || []).slice(0, 2).map((i) => (
                    <li key={i._id}>
                      <Link to={`${ROUTES.INTERNSHIPS}/${i.slug || i._id}`} className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{i.title}</span>
                        <span className="text-gray-500 dark:text-gray-400"> · {i.organization}</span>
                      </Link>
                    </li>
                  ))}
                  {(savedIntlScholarships || []).slice(0, 2).map((s) => (
                    <li key={s._id}>
                      <Link to={`${ROUTES.INTL_SCHOLARSHIPS}/${s._id}`} className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{s.title}</span>
                        <span className="text-gray-500 dark:text-gray-400"> · {s.country}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {applications.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Applied Jobs</h2>
                <ul className="space-y-2">
                  {applications.slice(0, 5).map((a) => (
                    <li key={a._id}>
                      <Link to={`${ROUTES.JOBS}/${a.job?.slug || a.job?._id}`} className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{a.job?.title}</span>
                        <span className="text-gray-500 dark:text-gray-400"> · {a.job?.organization}</span>
                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">{a.status}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recently viewed</h2>
              {(recentJobs.length + recentScholarships.length + recentAdmissions.length) === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Your recently viewed jobs and scholarships will appear here.</p>
              ) : (
                <ul className="space-y-2">
                  {recentJobs.slice(0, 2).map((j) => (
                    <li key={j._id}>
                      <Link to={`${ROUTES.JOBS}/${j.slug || j._id}`} className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition text-sm">
                        {j.title} · {j.organization || j.company}
                      </Link>
                    </li>
                  ))}
                  {recentScholarships.slice(0, 2).map((s) => (
                    <li key={s._id}>
                      <Link to={`${ROUTES.SCHOLARSHIPS}/${s.slug || s._id}`} className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition text-sm">
                        {s.title} · {s.provider}
                      </Link>
                    </li>
                  ))}
                  {recentAdmissions.slice(0, 2).map((a) => (
                    <li key={a._id}>
                      <Link to={`${ROUTES.ADMISSIONS}/${a.slug || a._id}`} className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition text-sm">
                        {a.program} · {a.institution}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recommended Opportunities</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[...trendingJobs.slice(0, 2), ...trendingScholarships.slice(0, 2), ...trendingAdmissions.slice(0, 2)].map((item) => {
                  const isAdmission = item.program && item.institution;
                  const isJob = (item.company || item.organization) && !isAdmission;
                  const isScholarship = item.provider && item.title && !isAdmission;
                  const slug = item.slug || item._id;
                  const to = isJob ? `${ROUTES.JOBS}/${slug}` : isScholarship ? `${ROUTES.SCHOLARSHIPS}/${slug}` : `${ROUTES.ADMISSIONS}/${slug}`;
                  const title = isJob ? item.title : isScholarship ? item.title : item.program;
                  const sub = isJob ? (item.organization || item.company) : isScholarship ? item.provider : item.institution;
                  return (
                    <Link key={item._id} to={to} className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{title}</span>
                      <span className="text-gray-500 dark:text-gray-400"> · {sub}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <Chatbot className="mb-6" />
            {referralData && (
              <section className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Referral Stats</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Invite friends: share your link to earn points.</p>
                <p className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded break-all text-gray-800 dark:text-gray-200">{referralData.referralLink}</p>
                <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">Referred: <strong>{referralData.referralCount || 0}</strong> · Points: <strong>{referralData.totalPoints || 0}</strong></p>
              </section>
            )}
            <section className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Leaderboard &amp; Achievements</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Compete by points, applications, and referrals.</p>
              <Link to={ROUTES.BADGES_LEADERBOARD} className="inline-block text-sm text-primary dark:text-mint hover:underline font-medium">View Leaderboard →</Link>
            </section>
            <section className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Profile overview</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Province</dt>
                  <dd className="text-gray-900 dark:text-white">{profile?.province || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Interests</dt>
                  <dd className="text-gray-900 dark:text-white">{(profile?.interests || []).length ? profile.interests.join(', ') : '—'}</dd>
                </div>
              </dl>
              <Link to={ROUTES.PROFILE} className="mt-3 inline-block text-sm text-primary dark:text-mint hover:underline">
                Edit profile →
              </Link>
            </section>

            <section className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Notification settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Choose how you want to receive alerts (managed in Profile).</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${profile?.notifications?.email ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`} aria-hidden />
                  Email alerts {profile?.notifications?.email ? 'On' : 'Off'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden />
                  Push (placeholder)
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden />
                  WhatsApp (placeholder)
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden />
                  Telegram (Phase-6)
                </li>
              </ul>
              <Link to={ROUTES.PROFILE} className="mt-3 inline-block text-sm text-primary dark:text-mint hover:underline">
                Update in Profile →
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
