import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../constants';

/** Shared apply-kit banner for external scholarship/admission flows (C.8.0.2B.2). */
export function ApplyKitBanner({ kit }) {
  const { t } = useTranslation(['talent', 'common']);
  if (!kit?.candidate) return null;

  return (
    <section className="mt-4 p-4 rounded-xl border border-primary/20 bg-mint/10 dark:bg-mint/5">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {t('talent:applyKitTitle', { defaultValue: 'Your career profile' })}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {kit.candidate.displayName}
        {kit.candidate.headline ? ` — ${kit.candidate.headline}` : ''}
      </p>
      {kit.documents?.length > 0 && (
        <ul className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
          {kit.documents.filter((d) => d.url).slice(0, 3).map((d) => (
            <li key={d._id}>
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-mint hover:underline">
                {d.label || d.documentType}
              </a>
            </li>
          ))}
        </ul>
      )}
      <Link to={ROUTES.TALENT_PROFILE} className="text-sm text-primary dark:text-mint hover:underline mt-2 inline-block">
        {t('talent:editProfile', { defaultValue: 'Edit talent profile' })}
      </Link>
    </section>
  );
}
