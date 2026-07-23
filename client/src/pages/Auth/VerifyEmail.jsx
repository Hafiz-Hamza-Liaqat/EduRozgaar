import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { ROUTES } from '../../constants';
import { authApi } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/ui/Alerts';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { t } = useTranslation(['forms', 'common']);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('forms:verifyEmail.missingToken', { defaultValue: 'Verification link is invalid or missing.' }));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await authApi.verifyEmail({ token });
        if (cancelled) return;
        setStatus('success');
        setMessage(res.data?.message || t('forms:verifyEmail.success', { defaultValue: 'Email verified successfully.' }));
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage(err.response?.data?.error || t('forms:verifyEmail.failed', { defaultValue: 'Verification failed. The link may have expired.' }));
      }
    })();
    return () => { cancelled = true; };
  }, [token, t]);

  return (
    <>
      <SeoHead title={t('forms:verifyEmail.title', { defaultValue: 'Verify email' })} noindex />
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 md:py-12 text-center">
        {status === 'loading' && (
          <p className="text-gray-600 dark:text-gray-300">{t('common:loading', { defaultValue: 'Loading…' })}</p>
        )}
        {status === 'success' && (
          <>
            <Alert variant="success" title={t('forms:verifyEmail.successTitle', { defaultValue: 'Email verified' })} className="mb-6">
              {message}
            </Alert>
            <Button as={Link} to={ROUTES.LOGIN}>{t('common:signIn', { defaultValue: 'Sign in' })}</Button>
          </>
        )}
        {status === 'error' && (
          <>
            <Alert variant="error" title={t('forms:verifyEmail.errorTitle', { defaultValue: 'Verification failed' })} className="mb-6">
              {message}
            </Alert>
            <Button as={Link} to={ROUTES.LOGIN}>{t('common:signIn', { defaultValue: 'Sign in' })}</Button>
          </>
        )}
      </div>
    </>
  );
}
