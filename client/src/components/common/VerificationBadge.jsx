import { useTranslation } from 'react-i18next';

const STYLES = {
  basic: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  trusted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
};

export function VerificationBadge({ level, verified, size = 'sm' }) {
  const { t } = useTranslation('profiles');
  const resolved = level || (verified ? 'verified' : 'basic');
  if (resolved === 'basic') return null;

  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${STYLES[resolved] || STYLES.verified}`}>
      {resolved === 'trusted' ? t('trustedEmployer') : t('verifiedEmployer')}
    </span>
  );
}
