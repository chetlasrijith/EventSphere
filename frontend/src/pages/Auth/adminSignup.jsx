import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthShell, { RoleSwitch } from '../../components/layout/AuthShell';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Surface';
import { signupAdmin } from '../../api/endpoints';
import { errorMessage } from '../../api/client';

/**
 * Admin signup.
 *
 * There is no role checkbox. The previous form let the requester tick
 * "SuperAdmin" and the server signed them a SuperAdmin token, so anyone could
 * self-register with full admin rights. Signup now always produces a *pending*
 * Admin that a SuperAdmin must approve, and the API rejects a `role` field
 * outright.
 */
export default function AdminSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobileNumber: '',
    password: '',
  });
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
    if (formData.mobileNumber && !/^\d{10}$/.test(formData.mobileNumber.trim()))
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
      await signupAdmin({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        mobile_number: formData.mobileNumber.trim() || undefined,
      });
      toast.success('Request submitted. A SuperAdmin must approve your account.');
      navigate('/admin/login');
    } catch (error) {
      setServerError(errorMessage(error, 'Could not submit the request'));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Admin access"
      headline="Access is granted, not self-assigned."
      lede="Administrator accounts are reviewed by a SuperAdmin. Submit the request below and you will be able to sign in once it is approved."
    >
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <span className="eyebrow">Request admin access</span>
        <h2 className="t-heading-sm" style={{ marginTop: 'var(--spacing-12)' }}>
          Submit a request
        </h2>

        <Notice tone="violet">
          New admin accounts start as <strong>pending</strong> and cannot sign in
          until a SuperAdmin approves them.
        </Notice>

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
            hint="Optional."
            value={formData.mobileNumber}
            onChange={handleChange}
            error={errors.mobileNumber}
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
          {submitting ? 'Submitting…' : 'Request admin access'}
        </Button>

        <p className="t-body-sm u-iron" style={{ marginTop: 'var(--spacing-20)' }}>
          Already approved?{' '}
          <Link to="/admin/login" className="link">
            Sign in
          </Link>
        </p>
      </form>

      <RoleSwitch current="admin" heading="Signing up as" />
    </AuthShell>
  );
}