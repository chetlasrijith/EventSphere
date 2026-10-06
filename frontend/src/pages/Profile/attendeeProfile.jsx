import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { getMyProfile, updateMyProfile, uploadProfileImage } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { formatDateTime } from '../../utils/format';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import {
  DataList,
  Notice,
  PageLoading,
  PageError,
  SectionLabel,
} from '../../components/ui/Surface';

/**
 * Attendee profile.
 *
 * Read-only until "Edit" is pressed — a profile is mostly confirmation, not a
 * form. The photo is uploadable at any time since it is a separate endpoint.
 */
export default function AttendeeProfile() {
  const [user, setUser] = useState(null);
  const [draft, setDraft] = useState({ username: '', email: '', mobileNumber: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    let cancelled = false;

    getMyProfile()
      .then((data) => {
        if (cancelled) return;
        setUser(data);
        setDraft({
          username: data.username || '',
          email: data.email || '',
          mobileNumber: data.mobileNumber || '',
        });
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load your profile')))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    const next = {};
    if (!draft.username.trim()) next.username = 'Username is required.';
    if (!draft.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email))
      next.email = 'Enter a valid email address.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setError('');
    try {
      const updated = await updateMyProfile({
        username: draft.username.trim(),
        email: draft.email.trim(),
        mobile_number: draft.mobileNumber.trim() || undefined,
      });
      setUser(updated);
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      setError(errorMessage(err, 'Could not save your profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const updated = await uploadProfileImage(file);
      setUser((prev) => ({ ...prev, profileImg: updated.profileImg }));
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not upload the image'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <PageLoading label="Loading profile" />;
  if (error && !user) return <PageError message={error} />;

  return (
    <div className="app-page">
      <div className="container">
        <PageHeader
          eyebrow="Attendee"
          title="Your profile"
          actions={
            editing ? null : (
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit profile
              </Button>
            )
          }
        >
          Your account details. Your ticket history lives under “My tickets”.
        </PageHeader>

        {error && <Notice tone="alert">{error}</Notice>}

        <div className="split" style={{ alignItems: 'start' }}>
          {/* Photo and account facts. */}
          <div>
            <label className="avatar-upload" htmlFor="imageUpload">
              <img
                className="avatar avatar--xl"
                src={user.profileImg || '/images/sampleProfile.webp'}
                alt=""
                style={{ cursor: uploading ? 'progress' : 'pointer' }}
              />
              <span className="avatar-upload__badge">
                {uploading ? 'Uploading' : 'Change photo'}
              </span>
            </label>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              className="visually-hidden"
              disabled={uploading}
              onChange={handleImageChange}
            />

            <div style={{ marginTop: 'var(--spacing-32)' }}>
              <SectionLabel>Account</SectionLabel>
              <div style={{ marginTop: 'var(--spacing-16)' }}>
                <DataList
                  rows={[
                    { key: 'Username', value: user.username },
                    { key: 'Email', value: user.email },
                    { key: 'Mobile', value: user.mobileNumber || '—' },
                    { key: 'Member since', value: formatDateTime(user.createdAt) },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Edit form, or a quiet prompt when not editing. */}
          <div>
            {editing ? (
              <form className="card card--pad-lg" onSubmit={handleSave} noValidate>
                <SectionLabel>Edit details</SectionLabel>

                <div className="stack" style={{ marginTop: 'var(--spacing-20)' }}>
                  <Input
                    label="Username"
                    value={draft.username}
                    onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
                    error={errors.username}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                    error={errors.email}
                  />
                  <Input
                    label="Mobile"
                    type="tel"
                    value={draft.mobileNumber}
                    onChange={(e) => setDraft((d) => ({ ...d, mobileNumber: e.target.value }))}
                    hint="Optional."
                  />
                </div>

                <div
                  className="btn-row"
                  style={{
                    marginTop: 'var(--spacing-32)',
                    paddingTop: 'var(--spacing-24)',
                    borderTop: '1px solid var(--color-hairline)',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditing(false);
                      setErrors({});
                      setDraft({
                        username: user.username || '',
                        email: user.email || '',
                        mobileNumber: user.mobileNumber || '',
                      });
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="card card--warm">
                <SectionLabel>Tickets</SectionLabel>
                <p className="t-heading-sm" style={{ marginTop: 'var(--spacing-16)' }}>
                  Every ticket you have held, in one list.
                </p>
                <p className="t-body-sm u-iron" style={{ marginTop: 'var(--spacing-12)' }}>
                  Booking codes are re-issued from the server, so a lost
                  confirmation is recoverable rather than a dead end.
                </p>
                <div className="btn-row" style={{ marginTop: 'var(--spacing-24)' }}>
                  <Button to="/attendee/my-tickets" variant="outline" arrow>
                    View my tickets
                  </Button>
                  <Button to="/attendee/myevent-list" variant="ghost">
                    My events
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}