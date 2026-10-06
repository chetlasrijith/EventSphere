import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthShell, { RoleSwitch } from '../../components/layout/AuthShell';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Surface';
import { login } from '../../api/endpoints';
import { errorMessage } from '../../api/client';

const COPY = {
  attendee: {
    eyebrow: 'Attendee access',
    headline: 'Your tickets, in one place.',
    lede: 'Hold a place at any event on the platform, keep the ticket on your phone, and find it again the moment you need it.',
    title: 'Welcome back',
    action: 'Sign in',
  },
  organizer: {
    eyebrow: 'Organizer access',
    headline: 'Publish an event without the paperwork.',
    lede: 'Draft a listing, submit it for review, and manage capacity, venue and attendee communication from a single console.',
    title: 'Welcome back',
    action: 'Sign in',
  },
  admin: {
    eyebrow: 'Admin access',
    headline: 'Keep the platform orderly.',
    lede: 'Review submitted events, manage organizer accounts, and keep the archive honest.',
    title: 'Administrator sign in',
    action: 'Sign in',
  },
};

/**
 * Shared login form for all three roles.
 *
 * There is deliberately no role selector. The previous admin form asked the
 * user to pick Admin or SuperAdmin and the server signed the token with
 * whatever they chose, which meant any approved admin could mint a SuperAdmin
 * token at will. The role is now derived server-side from the account.
 */
export default function LoginForm({ role }) {
  const navigate = useNavigate();
  const copy = COPY[role];
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!formData.identifier.trim()) next.identifier = 'Enter your username or email.';
    if (!formData.password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const session = await login(role, formData.identifier.trim(), formData.password);
      toast.success(`Welcome, ${session.username}`);
      navigate(`/${role}`);
      // Full reload so the shell re-reads the new role from the cookie.
      window.location.reload();
    } catch (error) {
      setServerError(errorMessage(error, 'Invalid credentials'));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell eyebrow={copy.eyebrow} headline={copy.headline} lede={copy.lede}>
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <span className="eyebrow">{copy.title}</span>
        <h2 className="t-heading-sm" style={{ marginTop: 'var(--spacing-12)' }}>
          Sign in to EventSphere
        </h2>

        {serverError && (
          <Notice tone="alert" className="u-full" >
            {serverError}
          </Notice>
        )}

        <div style={{ marginTop: 'var(--spacing-24)' }}>
          <Input
            label="Username or email"
            name="identifier"
            type="text"
            autoComplete="username"
            value={formData.identifier}
            onChange={handleChange}
            error={errors.identifier}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />
        </div>

        <Button type="submit" block disabled={submitting} style={{ marginTop: 'var(--spacing-24)' }}>
          {submitting ? 'Signing in…' : copy.action}
        </Button>

        {role !== 'admin' && (
          <p className="t-body-sm u-iron" style={{ marginTop: 'var(--spacing-20)' }}>
            No account yet?{' '}
            <Link to={`/${role}/signup`} className="link">
              Create one
            </Link>
          </p>
        )}
      </form>

      <RoleSwitch current={role} heading="Sign in as" />
    </AuthShell>
  );
}