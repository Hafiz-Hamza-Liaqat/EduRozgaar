import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { ROUTES } from '../../constants';
import { validateEmail } from '../../utils/validation';
import { authApi } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { Alert } from '../../components/ui/Alerts';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const emailErr = validateEmail(email);
    if (emailErr) {
      setErrors({ email: emailErr });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { data } = await authApi.forgotPassword(email.trim().toLowerCase());
      setSuccess(true);
      if (data?.message) setSubmitError(null);
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setSubmitError(msg);
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead title="Forgot password" description="Reset your EduRozgaar account password." noindex />
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Forgot password</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Enter the email address for your account and we&apos;ll send you a link to reset your password.
        </p>

        {success && (
          <Alert variant="success" title="Check your email" className="mb-6">
            If an account exists with this email, you will receive a password reset link shortly. The link expires in 1 hour.
          </Alert>
        )}

        {submitError && (
          <Alert variant="error" title="Error" className="mb-6">
            {submitError}
          </Alert>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email" id="forgot-email" error={errors.email}>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow duration-200"
                placeholder="you@example.com"
              />
            </FormField>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
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
