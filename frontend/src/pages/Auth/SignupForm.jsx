import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthShell, { RoleSwitch } from '../../components/layout/AuthShell';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Surface';
import { signupAttendee, signupOrganizer } from '../../api/endpoints';
import { errorMessage } from '../../api/client';

const EMPTY = { username: '', email: '', mobileNumber: '', password: '' };

const COPY = {
  attendee: {
    eyebrow: 'Attendee account',
    headline: 'One account for every event you attend.',
    lede: 'Register once, keep every ticket you have ever held, and get notified when a listing you care about changes.',
    title: 'Create an attendee account',
    action: 'Create account',
    footer: (
      <>
        Already registered?{' '}
        <Link to="/attendee/login" className="link">
          Sign in
        </Link>
      </>
    ),
  },
  organizer: {
    eyebrow: 'Organizer account',
    headline: 'Put your event in front of the right people.',
    lede: 'Submit a listing, track approvals, adjust capacity and venue, and reach every registered attendee when plans change.',
    title: 'Create an organizer account',
    action: 'Request organizer access',
    footer: (
      <>
        Already registered?{' '}
        <Link to="/organizer/login" className="link">
          Sign in
        </Link>
      </>
    ),
  },
};

/**
 * Shared attendee and organizer signup.
 *
 * Both roles collect the same four fields; only the payload shape and endpoint
 * differ, so they share one component instead of two near-identical copies.
 */
export default function SignupForm({ role }) {
  const navigate = useNavigate();
  const copy = COPY[role];
  const [formData, setFormData] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!formData.username.trim()) next.username = 'Username is required.';
    if (!formData.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      next.email = 'Enter a valid email address.';
    if (!formData.password) next.password = 'Password is required.';
    else if (formData.password.length < 6) next.password = 'Use at least 6 characters.';
    if (!formData.mobileNumber.trim()) next.mobileNumber = 'Mobile number is required.';
    else if (!/^\d{10}$/.test(formData.mobileNumber.trim()))
      next.mobileNumber = 'Enter a 10-digit mobile number.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const shared = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        mobile_number: formData.mobileNumber.trim(),
      };

      if (role === 'organizer') {
        await signupOrganizer({
          ...shared,
          // The address is collected in the profile editor after signup; the
          // API requires the object to be present.
          address: {
            street: 'Not provided',
            city: 'Not provided',
            state: 'Not provided',
            postal_code: '000000',
            country: 'Not provided',
          },
        });
      } else {
        await signupAttendee(shared);
      }

      toast.success('Account created. You can sign in now.');
      navigate(`/${role}/login`);
    } catch (error) {
      setServerError(errorMessage(error, 'Could not create the account'));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell eyebrow={copy.eyebrow} headline={copy.headline} lede={copy.lede}>
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <span className="eyebrow">{copy.title}</span>
        <h2 className="t-heading-sm" style={{ marginTop: 'var(--spacing-12)' }}>
          {copy.action}
        </h2>

        {role === 'organizer' && (
          <Notice tone="violet" className="u-full">
            Organizer listings are reviewed before they go live. Complete your
            profile after signing in so reviewers have context.
          </Notice>
        )}

        {serverError && <Notice tone="alert">{serverError}</Notice>}

        <div style={{ marginTop: 'var(--spacing-24)' }}>
          <Input
            label="Username"
            name="username"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />
          <Input
            label="Mobile number"
            name="mobileNumber"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={formData.mobileNumber}
            onChange={handleChange}
            error={errors.mobileNumber}
            placeholder="10 digits"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            hint="At least 6 characters."
          />
        </div>

        <Button type="submit" block disabled={submitting} style={{ marginTop: 'var(--spacing-24)' }}>
          {submitting ? 'Creating…' : copy.action}
        </Button>

        <p className="t-body-sm u-iron" style={{ marginTop: 'var(--spacing-20)' }}>
          {copy.footer}
        </p>
      </form>

      <RoleSwitch current={role} heading="Signing up as" />
    </AuthShell>
  );
}