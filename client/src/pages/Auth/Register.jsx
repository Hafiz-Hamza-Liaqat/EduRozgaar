import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants';
import { validateEmail, validatePassword, validateName } from '../../utils/validation';
import { Button } from '../../components/common/Button';
import { SocialAuthButton } from '../../components/auth/SocialAuthButton';
import { FormField } from '../../components/common/FormField';
import { Alert } from '../../components/ui/Alerts';
import { SeoHead } from '../../components/seo';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const { register, error, setError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password, true);
    const confirmErr =
      password !== confirmPassword ? 'Passwords do not match' : null;
    if (nameErr || emailErr || passwordErr || confirmErr) {
      setErrors({ name: nameErr, email: emailErr, password: passwordErr, confirmPassword: confirmErr });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password, referralCode: refCode || undefined });
      navigate(ROUTES.PROFILE, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error || 'Registration failed.';
      const details = data?.details || {};
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setErrors({
        name: details.name || null,
        email: details.email || null,
        password: details.password || null,
        confirmPassword: details.confirmPassword || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = () => {
    setError('Google sign-up will be available in a future update.');
  };

  return (
    <>
      <SeoHead title="Create account" description="Create your EduRozgaar account." noindex />
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Create account</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Register to save jobs, scholarships, and get alerts.</p>

        {error && (
          <Alert variant="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" id="reg-name" error={errors.name}>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow duration-200"
              placeholder="Your name"
            />
          </FormField>
          <FormField label="Email" id="reg-email" error={errors.email}>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow duration-200"
              placeholder="you@example.com"
            />
          </FormField>
          <FormField label="Password" id="reg-password" error={errors.password}>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow duration-200"
              placeholder="Min 8 chars, upper, lower, number"
            />
          </FormField>
          <FormField label="Confirm password" id="reg-confirm" error={errors.confirmPassword}>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow duration-200"
              placeholder="Repeat password"
            />
          </FormField>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Creating account...' : 'Register'}
          </Button>
        </form>

        <div className="mt-6 animate-fade-in">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">Or sign up with</p>
          <SocialAuthButton provider="Google" onClick={handleGoogleSignUp} comingSoon />
        </div>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="text-primary dark:text-mint font-medium hover:underline link-hover">
            Login
          </Link>
        </p>
      </div>
    </>
  );
}
