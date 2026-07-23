import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/authService';
import { ROUTES } from '../../constants';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { Alert } from '../../components/ui/Alerts';
import { SeoHead } from '../../components/seo';

export default function AcceptInvitation() {
  const { t } = useTranslation(['forms', 'common']);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(!!token);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t('forms:acceptInvitation.invalidLink', { defaultValue: 'Invalid invitation link' }));
      setLoading(false);
      return;
    }
    authApi.getInvitation(token)
      .then(({ data }) => {
        setInvite(data);
        setName(data.email?.split('@')[0] || '');
      })
      .catch(() => setError(t('forms:acceptInvitation.invalidLink', { defaultValue: 'Invalid or expired invitation' })))
      .finally(() => setLoading(false));
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('forms:acceptInvitation.passwordMismatch', { defaultValue: 'Passwords do not match' }));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authApi.acceptInvitation({ token, name, password });
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 2500);
    } catch (err) {
      setError(err.response?.data?.error || t('forms:acceptInvitation.failed', { defaultValue: 'Could not accept invitation' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead title={t('forms:acceptInvitation.title', { defaultValue: 'Accept invitation' })} noindex />
      <div className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('forms:acceptInvitation.title', { defaultValue: 'Accept staff invitation' })}
        </h1>

        {loading && <p className="text-gray-500 dark:text-gray-400">{t('common:loading')}</p>}

        {error && !loading && !success && (
          <Alert variant="error" className="mb-4">{error}</Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-4">
            {t('forms:acceptInvitation.success', { defaultValue: 'Account created! Redirecting to login…' })}
          </Alert>
        )}

        {invite && !success && (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              {t('forms:acceptInvitation.intro', { defaultValue: 'Create your account for' })}{' '}
              <strong className="text-gray-900 dark:text-white">{invite.email}</strong>{' '}
              ({invite.role})
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label={t('common:name')} id="accept-name" htmlFor="accept-name">
                <input
                  id="accept-name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                />
              </FormField>
              <FormField label={t('forms:register.password', { defaultValue: 'Password' })} id="accept-password">
                <input
                  id="accept-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                />
              </FormField>
              <FormField label={t('forms:acceptInvitation.confirmPassword', { defaultValue: 'Confirm password' })} id="accept-confirm">
                <input
                  id="accept-confirm"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                />
              </FormField>
              <Button type="submit" disabled={submitting}>
                {submitting ? t('common:saving') : t('forms:acceptInvitation.submit', { defaultValue: 'Create account' })}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <Link to={ROUTES.LOGIN} className="text-primary dark:text-mint hover:underline">
            {t('forms:login.title')}
          </Link>
        </p>
      </div>
    </>
  );
}
