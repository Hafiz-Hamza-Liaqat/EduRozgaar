import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, collectionPageSchema, combineSchemas } from '../../seo/schemas';
import { DEFAULT_KEYWORDS } from '../../seo/config';
import { ROUTES } from '../../constants';
import { webinarsApi } from '../../services/listingsService';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatDate';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';

export default function Webinars() {
  const { t } = useTranslation(['dashboard', 'seo', 'common']);
  const { isAuthenticated } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [recorded, setRecorded] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(null);

  useEffect(() => {
    Promise.all([webinarsApi.upcoming().then((r) => r.data?.data || []), webinarsApi.recorded({ limit: 20 }).then((r) => r.data?.data || [])])
      .then(([u, r]) => {
        setUpcoming(u);
        setRecorded(r);
      })
      .catch((e) => setError(e.response?.data?.error || t('dashboard:webinarsFailedLoad')))
      .finally(() => setLoading(false));
  }, [t]);

  const handleRegister = async (id) => {
    setRegistering(id);
    try {
      await webinarsApi.register(id);
      setUpcoming((prev) => prev.map((w) => (w._id === id ? { ...w, registered: true } : w)));
    } catch (e) {
      if (e.response?.status === 400 && e.response?.data?.error?.includes('Already registered')) {
        setUpcoming((prev) => prev.map((w) => (w._id === id ? { ...w, registered: true } : w)));
      } else window.alert(e.response?.data?.error || t('dashboard:webinarsRegistrationFailed'));
    } finally {
      setRegistering(null);
    }
  };

  return (
    <>
      <SeoHead
        title={t('seo:webinarsTitle')}
        description={t('seo:webinarsDescription')}
        canonical={ROUTES.WEBINARS}
        keywords={`webinars, workshops, career guidance, ${DEFAULT_KEYWORDS}`}
        ogType="website"
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: t('seo:breadcrumbHome'), url: ROUTES.HOME },
            { name: t('dashboard:webinars'), url: ROUTES.WEBINARS },
          ]),
          collectionPageSchema({
            name: t('seo:webinarsTitle'),
            description: t('seo:webinarsDescription'),
            url: ROUTES.WEBINARS,
          })
        )}
      />
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('dashboard:webinarsPageTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t('dashboard:webinarsPageSubtitle')}</p>

        {error && <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>}

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard:webinarsUpcoming')}</h2>
          {loading ? (
            <div className="space-y-4"><ListingCardSkeleton /><ListingCardSkeleton /></div>
          ) : upcoming.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard:webinarsNoUpcoming')}</p>
          ) : (
            <ul className="space-y-4">
              {upcoming.map((w) => (
                <li key={w._id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{w.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(w.scheduledAt)} · {t('dashboard:webinarsDurationMin', { count: w.durationMinutes || 60 })}
                  </p>
                  {w.description && <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">{w.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {w.meetingUrl && (
                      <a href={w.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary dark:text-mint hover:underline">
                        {t('dashboard:webinarsJoinLink')}
                      </a>
                    )}
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => handleRegister(w._id)}
                        disabled={registering === w._id || w.registered}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover btn-theme disabled:opacity-50"
                      >
                        {w.registered ? t('dashboard:webinarsRegistered') : registering === w._id ? t('dashboard:webinarsRegistering') : t('dashboard:webinarsRegister')}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard:webinarsRecorded')}</h2>
          {loading ? (
            <div className="space-y-4"><ListingCardSkeleton /><ListingCardSkeleton /></div>
          ) : recorded.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard:webinarsNoRecorded')}</p>
          ) : (
            <ul className="space-y-4">
              {recorded.map((w) => (
                <li key={w._id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{w.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(w.scheduledAt)} · {t('dashboard:webinarsDurationMin', { count: w.durationMinutes || 60 })}</p>
                  {w.recordingUrl && (
                    <a href={w.recordingUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm text-primary dark:text-mint hover:underline">
                      {t('dashboard:webinarsWatchRecording')}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
