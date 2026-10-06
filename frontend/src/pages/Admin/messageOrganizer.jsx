import React, { useEffect, useState } from 'react';
import { listEvents, listOrganizers, messageOrganizer } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import Button from '../../components/ui/Button';
import { Input, Textarea, Select, Check } from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import { Notice, SectionLabel, StatusTag, EmptyState } from '../../components/ui/Surface';

/**
 * Admin message composer.
 *
 * Targets one organizer or a whole review queue. The old app sent a bare
 * `username`, which broke silently for any organizer whose name contained a
 * space — the id is used instead.
 */
export default function MessageOrganizer() {
  const [mode, setMode] = useState('single');
  const [organizers, setOrganizers] = useState([]);
  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState({ subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    listOrganizers({ page_size: 100 })
      .then((data) => setOrganizers(data.items || []))
      .catch(() => {});
    listEvents({ status: 'pending', page_size: 100 })
      .then((data) => setPending(data.items || []))
      .catch(() => {});
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const next = {};
    if (!form.subject.trim()) next.subject = 'Subject is required.';
    if (!form.message.trim()) next.message = 'Message is required.';
    if (mode === 'single' && !selected) next.recipient = 'Choose an organizer.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    try {
      const result = await messageOrganizer(selected, {
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setFeedback({ tone: '', text: `Message delivered to ${result.recipient}.` });
      setForm({ subject: '', message: '' });
    } catch (err) {
      setFeedback({ tone: 'alert', text: errorMessage(err, 'Could not send the message') });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="app-page">
      <div className="container">
        <PageHeader eyebrow="Admin" title="Message an organizer">
          Reach a single organizer directly, or review what is waiting in the
          queue before you decide.
        </PageHeader>

        <div className="split" style={{ alignItems: 'start' }}>
          <form className="card card--pad-lg" onSubmit={handleSend} noValidate>
            <SectionLabel>Recipient</SectionLabel>

            <div className="stack-sm" style={{ marginTop: 'var(--spacing-16)' }}>
              <Check
                type="radio"
                name="mode"
                label="One organizer"
                checked={mode === 'single'}
                onChange={() => setMode('single')}
              />
              <Check
                type="radio"
                name="mode"
                label="Review the pending queue instead"
                checked={mode === 'review'}
                onChange={() => setMode('review')}
              />
            </div>

            {mode === 'single' ? (
              <div style={{ marginTop: 'var(--spacing-24)' }}>
                <Select
                  label="Organizer"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  error={errors.recipient}
                >
                  <option value="">Select an organizer</option>
                  {organizers.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.username} — {org.email}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <Notice tone="plain">
                <span className="t-body-sm u-iron">
                  To message organizers about a specific submission, use the cancel
                  action on that event in the review queue — the reason is recorded
                  and the organizer is notified.
                </span>
              </Notice>
            )}

            <SectionLabel className="u-mt-24" />

            <div style={{ marginTop: 'var(--spacing-20)' }}>
              <Input
                label="Subject"
                maxLength={200}
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                error={errors.subject}
              />
              <Textarea
                label="Message"
                rows={6}
                maxLength={5000}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                error={errors.message}
              />
            </div>

            {feedback && (
              <div style={{ marginTop: 'var(--spacing-20)' }}>
                <Notice tone={feedback.tone}>{feedback.text}</Notice>
              </div>
            )}

            <div
              className="btn-row"
              style={{ marginTop: 'var(--spacing-24)', justifyContent: 'flex-end' }}
            >
              <Button
                variant="ghost"
                onClick={() => {
                  setForm({ subject: '', message: '' });
                  setErrors({});
                  setFeedback(null);
                }}
                disabled={sending}
              >
                Clear
              </Button>
              <Button type="submit" disabled={sending || mode !== 'single'}>
                {sending ? 'Sending…' : 'Send message'}
              </Button>
            </div>
          </form>

          {/* The pending queue, as a quiet list beside the composer. */}
          <div className="card">
            <SectionLabel>Awaiting review</SectionLabel>

            {!pending.length ? (
              <div style={{ marginTop: 'var(--spacing-16)' }}>
                <EmptyState eyebrow="Clear" title="Nothing awaiting review.">
                  New organizer submissions will appear here.
                </EmptyState>
              </div>
            ) : (
              <ul className="stack" style={{ marginTop: 'var(--spacing-20)' }}>
                {pending.map((event) => (
                  <li
                    key={event.id}
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
                      <span className="t-body u-ink">{event.eventName}</span>
                      <StatusTag status={event.status} />
                    </div>
                    <p className="t-body-sm u-smoke" style={{ marginTop: 4 }}>
                      {[event.city, event.venue].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {pending.length > 0 && (
              <div style={{ marginTop: 'var(--spacing-20)' }}>
                <Button to="/admin/approve-pending-events" variant="hairline" size="sm" arrow>
                  Open the review queue
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}