import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { ROUTES } from '../../constants';
import { validatePassword } from '../../utils/validation';
import { authApi } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { Alert } from '../../components/ui/Alerts';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setSubmitError('Invalid reset link. Please use the link from your email or request a new one.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const passwordErr = validatePassword(password, true);
    const confirmErr =
      password !== confirmPassword ? 'Passwords do not match' : null;
    if (passwordErr || confirmErr) {
      setErrors({ password: passwordErr, confirmPassword: confirmErr });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 2000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to reset password. The link may have expired.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <SeoHead title="Password reset" noindex />
        <div className="max-w-md mx-auto px-4 sm:px-6 py-8 md:py-12 text-center">
          <Alert variant="success" title="Password reset" className="mb-6">
            Your password has been reset. Redirecting you to login...
          </Alert>
          <Link to={ROUTES.LOGIN} className="text-primary dark:text-mint font-medium hover:underline">
            Go to login
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead title="Set new password" description="Set a new password for your EduRozgaar account." noindex />
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Set new password</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Enter your new password below. Use at least 8 characters with uppercase, lowercase, and a number.
        </p>

        {submitError && (
          <Alert variant="error" title="Error" className="mb-6">
            {submitError}
          </Alert>
        )}

        {token ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="New password" id="reset-password" error={errors.password}>
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow duration-200"
                placeholder="••••••••"
              />
            </FormField>
            <FormField label="Confirm password" id="reset-confirm" error={errors.confirmPassword}>
              <input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow duration-200"
                placeholder="••••••••"
              />
            </FormField>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            <Link to={ROUTES.FORGOT_PASSWORD} className="text-primary dark:text-mint font-medium hover:underline">
              Request a new reset link
            </Link>
          </p>
        )}

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <Link to={ROUTES.LOGIN} className="text-primary dark:text-mint font-medium hover:underline link-hover">
            ← Back to login
          </Link>
        </p>
      </div>
    </>
  );
}
