import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getAdminProfile,
  updateAdminProfile,
  getPendingAdmins,
  approveAdmin,
  rejectAdmin,
} from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { formatDateTime } from '../../utils/format';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import {
  Tag,
  DataList,
  Notice,
  PageLoading,
  PageError,
  EmptyState,
  SectionLabel,
} from '../../components/ui/Surface';

/**
 * Admin profile, plus the pending-access queue for SuperAdmins.
 *
 * The old app had no way to approve a pending admin from the UI, even though
 * the backend had endpoints for it.
 */
export default function AdminProfile() {
  const [admin, setAdmin] = useState(null);
  const [draft, setDraft] = useState({ username: '', password: '' });
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const isSuperAdmin = admin?.role === 'SuperAdmin';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getAdminProfile();
        if (cancelled) return;
        setAdmin(data);
        setDraft({ username: data.username || '', password: '' });

        if (data.role === 'SuperAdmin') {
          const queue = await getPendingAdmins();
          if (!cancelled) setPending(queue.items || []);
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load your account'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    const next = {};
    if (!draft.username.trim()) next.username = 'Username is required.';
    if (draft.password && draft.password.length < 6)
      next.password = 'Use at least 6 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setError('');
    try {
      const payload = { username: draft.username.trim() };
      if (draft.password) payload.password = draft.password;
      const updated = await updateAdminProfile(payload);
      setAdmin((prev) => ({ ...prev, ...updated }));
      setDraft((d) => ({ ...d, password: '' }));
      toast.success('Account updated');
    } catch (err) {
      setError(errorMessage(err, 'Could not save your account'));
    } finally {
      setSaving(false);
    }
  };

  const decide = async (adminId, action, username) => {
    if (
      action === 'reject' &&
      !window.confirm(`Decline ${username}'s request for admin access?`)
    ) {
      return;
    }

    setBusyId(adminId);
    try {
      if (action === 'approve') await approveAdmin(adminId);
      else await rejectAdmin(adminId, 'Declined by SuperAdmin');
      setPending((prev) => prev.filter((a) => a.id !== adminId));
      toast.success(`${username} ${action}d`);
    } catch (err) {
      toast.error(errorMessage(err, 'The action failed'));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoading label="Loading account" />;
  if (error && !admin) return <PageError message={error} />;

  return (
    <div className="app-page">
      <div className="container">
        <PageHeader eyebrow="Administration" title="Your account">
          Your admin credentials and, if you are a SuperAdmin, the queue of
          accounts awaiting approval.
        </PageHeader>

        {error && <Notice tone="alert">{error}</Notice>}

        <div className="split" style={{ alignItems: 'start' }}>
          <form className="card card--pad-lg" onSubmit={handleSave} noValidate>
            <SectionLabel>Account</SectionLabel>

            <div style={{ marginTop: 'var(--spacing-20)' }}>
              <DataList
                rows={[
                  { key: 'Email', value: admin.email },
                  { key: 'Role', value: admin.role },
                  { key: 'Status', value: admin.status },
                  { key: 'Joined', value: formatDateTime(admin.createdAt) },
                ]}
              />
            </div>

            <div className="stack" style={{ marginTop: 'var(--spacing-32)' }}>
              <Input
                label="Username"
                value={draft.username}
                onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
                error={errors.username}
              />
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                value={draft.password}
                onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                error={errors.password}
                hint="Leave blank to keep your current password."
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
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save account'}
              </Button>
            </div>
          </form>

          <div>
            {!isSuperAdmin ? (
              <div className="card card--warm">
                <SectionLabel>Approvals</SectionLabel>
                <p className="t-body-sm u-iron" style={{ marginTop: 'var(--spacing-16)' }}>
                  Only a SuperAdmin can approve or decline new admin requests. Your
                  account is <Tag plain>{admin.role}</Tag>.
                </p>
              </div>
            ) : (
              <div className="card">
                <SectionLabel>Pending admin requests</SectionLabel>

                {!pending.length ? (
                  <div style={{ marginTop: 'var(--spacing-16)' }}>
                    <EmptyState eyebrow="Clear" title="No pending requests.">
                      New admin signup requests appear here for approval.
                    </EmptyState>
                  </div>
                ) : (
                  <ul className="stack" style={{ marginTop: 'var(--spacing-20)' }}>
                    {pending.map((candidate) => (
                      <li
                        key={candidate.id}
                        style={{
                          paddingBottom: 'var(--spacing-16)',
                          borderBottom: '1px solid var(--color-hairline)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: 'var(--spacing-12)',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <p className="t-body u-ink u-truncate">{candidate.username}</p>
                            <p className="t-body-sm u-smoke u-truncate">{candidate.email}</p>
                          </div>
                          <Tag tone="pending">Pending</Tag>
                        </div>

                        <div className="btn-row" style={{ marginTop: 'var(--spacing-12)' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={busyId === candidate.id}
                            onClick={() => decide(candidate.id, 'approve', candidate.username)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={busyId === candidate.id}
                            onClick={() => decide(candidate.id, 'reject', candidate.username)}
                          >
                            Decline
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}