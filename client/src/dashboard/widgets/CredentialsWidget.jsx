import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { formatApplicationDate } from '../../utils/applicationUi';
import { WidgetShell } from '../WidgetShell';

/**
 * @param {{ data?: object }} props
 */
export function CredentialsWidget({ data }) {
  const { t, i18n } = useTranslation(['dashboard', 'documents-platform']);

  if (!data) {
    return (
      <WidgetShell title={t('dashboard:widgets.credentials')}>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.unavailable')}</p>
      </WidgetShell>
    );
  }

  const verifiedSkills = data.verifiedSkills || [];
  const latest = data.latest || [];

  return (
    <WidgetShell title={t('dashboard:widgets.credentials')}>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {t('dashboard:widgets.verifiedCount', { verified: data.verifiedCount || 0, total: data.total || 0 })}
      </p>
      {verifiedSkills.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('dashboard:widgets.verifiedSkills')}</p>
          <div className="flex flex-wrap gap-2">
            {verifiedSkills.map((c) => (
              <span key={c._id} className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary dark:text-mint">
                {c.skillName || c.title}
              </span>
            ))}
          </div>
        </div>
      )}
      {latest.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {latest.map((cred) => (
            <li key={cred._id} className="flex justify-between gap-2">
              <span className="text-gray-900 dark:text-white truncate">{cred.title || cred.skillName}</span>
              {cred.issuedAt ? (
                <time className="text-xs text-gray-500 dark:text-gray-400 shrink-0" dateTime={cred.issuedAt}>
                  {formatApplicationDate(cred.issuedAt, i18n.language)}
                </time>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.noCredentials')}</p>
      )}
      <Link to={ROUTES.TALENT_PROFILE} className="mt-3 inline-block text-sm text-primary dark:text-mint hover:underline">
        {t('dashboard:widgets.viewCredentials')}
      </Link>
    </WidgetShell>
  );
}
