import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';

/**
 * Hero-zone quick links widget.
 */
export function QuickLinksWidget() {
  const { t } = useTranslation(['dashboard']);

  const links = [
    { to: ROUTES.APPLICATIONS, label: t('dashboard:myApplications'), primary: true },
    { to: ROUTES.RESUME_BUILDER, label: t('dashboard:resumeBuilder'), outline: true },
    { to: ROUTES.TALENT_PROFILE, label: t('dashboard:editProfile'), outline: true },
    { to: ROUTES.CAREER_GUIDANCE, label: t('dashboard:careerGuidance') },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {links.map(({ to, label, primary, outline }) => (
        <Link
          key={to}
          to={to}
          className={
            primary
              ? 'inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover btn-theme text-sm font-medium'
              : outline
                ? 'inline-flex items-center px-4 py-2 rounded-lg border-2 border-primary text-primary dark:text-mint hover:bg-mint/20 btn-theme text-sm font-medium'
                : 'inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium'
          }
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
