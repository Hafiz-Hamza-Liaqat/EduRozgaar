import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { badgesApi } from '../../services/listingsService';
import { ROUTES } from '../../constants';
import { Link } from 'react-router-dom';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';

export default function Badges() {
  const { t } = useTranslation(['dashboard', 'seo', 'common']);
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardBy, setLeaderboardBy] = useState('points');
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = (by = 'points') => {
    badgesApi.leaderboard({ limit: 20, by }).then((r) => setLeaderboard(r.data?.data || [])).catch(() => setLeaderboard([]));
  };

  useEffect(() => {
    Promise.all([
      badgesApi.myBadges().then((r) => r.data?.data || []),
      badgesApi.leaderboard({ limit: 20, by: leaderboardBy }).then((r) => r.data?.data || []),
      badgesApi.myRank().then((r) => r.data).catch(() => null),
    ])
      .then(([b, l, rData]) => {
        setBadges(b);
        setLeaderboard(l);
        setRank(rData);
      })
      .catch((e) => setError(e.response?.data?.error || t('dashboard:badgesFailedLoad')))
      .finally(() => setLoading(false));
  }, [t]);

  const leaderboardValue = (u) => {
    if (leaderboardBy === 'applications') return t('dashboard:badgesApplicationsCount', { count: u.applicationCount ?? 0 });
    if (leaderboardBy === 'referrals') return t('dashboard:badgesReferralsCount', { count: u.referralCount ?? 0 });
    return t('dashboard:badgesPts', { count: u.totalPoints || 0 });
  };

  return (
    <>
      <SeoHead title={t('seo:badgesTitle')} description={t('seo:badgesDescription')} noindex />
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('dashboard:badgesPageTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t('dashboard:badgesPageSubtitle')}</p>

        {error && <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>}

        {rank && (
          <section className="mb-8 p-4 rounded-xl border border-primary/30 dark:border-mint/30 bg-mint/20 dark:bg-mint/10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard:badgesYourRank')}</h2>
            <p className="text-2xl font-bold text-primary dark:text-mint">#{rank.rank}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard:badgesPoints', { count: rank.totalPoints || 0 })}</p>
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard:badgesYourBadges')}</h2>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ListingCardSkeleton />
              <ListingCardSkeleton />
              <ListingCardSkeleton />
            </div>
          ) : badges.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard:badgesNoneYet')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map((b) => (
                <div key={b._id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl mb-2" title={b.name}>
                    🏅
                  </div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{b.name || b.badgeType}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard:badgesPointsShort', { count: b.points ?? 10 })}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('dashboard:badgesLeaderboardTitle')}</h2>
            <select value={leaderboardBy} onChange={(e) => { const v = e.target.value; setLeaderboardBy(v); fetchLeaderboard(v); }} className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 text-sm">
              <option value="points">{t('dashboard:badgesByPoints')}</option>
              <option value="applications">{t('dashboard:badgesByApplications')}</option>
              <option value="referrals">{t('dashboard:badgesByReferrals')}</option>
            </select>
          </div>
          {loading ? (
            <div className="space-y-2"><ListingCardSkeleton /><ListingCardSkeleton /><ListingCardSkeleton /></div>
          ) : leaderboard.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard:badgesNoLeaderboard')}</p>
          ) : (
            <ol className="space-y-2">
              {leaderboard.map((u) => (
                <li key={u.userId} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <span className="font-bold text-gray-500 dark:text-gray-400 w-8">#{u.rank}</span>
                  <span className="font-medium text-gray-900 dark:text-white flex-1">{u.name || t('dashboard:badgesAnonymous')}</span>
                  <span className="text-primary dark:text-mint font-semibold">{leaderboardValue(u)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <Link to={ROUTES.DASHBOARD} className="text-primary dark:text-mint hover:underline">← {t('common:dashboard')}</Link>
        </p>
      </div>
    </>
  );
}
