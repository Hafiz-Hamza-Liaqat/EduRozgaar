import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants';
import { validateEmail, validatePassword } from '../../utils/validation';
import { Button } from '../../components/common/Button';
import { SocialAuthButton } from '../../components/auth/SocialAuthButton';
import { FormField } from '../../components/common/FormField';
import { Alert } from '../../components/ui/Alerts';
import { SeoHead } from '../../components/seo';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || ROUTES.HOME;
  const isFromAdmin = from === ROUTES.ADMIN;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password, false);
    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error || 'Login failed. Please try again.';
      const details = data?.details || {};
      setError(msg);
      setErrors({ email: details.email || null, password: details.password || null });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    // Placeholder: redirect to backend OAuth or open Google popup
    setError('Google sign-in will be available in a future update.');
  };

  return (
    <>
      <SeoHead title="Login" description="Login to EduRozgaar account." noindex />
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Login</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isFromAdmin
            ? 'Sign in with an admin account to access the admin panel.'
            : 'Sign in to access your profile and saved items.'}
        </p>

        {error && (
          <Alert variant="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email" id="login-email" error={errors.email}>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow duration-200"
              placeholder="you@example.com"
            />
          </FormField>
          <FormField label="Password" id="login-password" error={errors.password}>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow duration-200"
              placeholder="••••••••"
            />
          </FormField>
          <div className="flex justify-end">
            <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm text-primary dark:text-mint hover:underline link-hover">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 animate-fade-in">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">Or continue with</p>
          <SocialAuthButton provider="Google" onClick={handleGoogleLogin} comingSoon />
        </div>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link to={ROUTES.REGISTER} className="text-primary dark:text-mint font-medium hover:underline link-hover">
            Register
          </Link>
        </p>
      </div>
    </>
  );
}
