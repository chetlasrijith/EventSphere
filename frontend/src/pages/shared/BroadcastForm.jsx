import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  broadcastToAttendees,
  broadcastToAttendeesAsAdmin,
} from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import Button from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import { SectionLabel } from '../../components/ui/Surface';

const SENDERS = {
  admin: broadcastToAttendeesAsAdmin,
  organizer: broadcastToAttendees,
};

const COPY = {
  admin: {
    eyebrow: 'Broadcast',
    headline: 'Notify every attendee.',
    body: 'Creates an in-app notification for every registered attendee. Use it for platform-wide notices — maintenance windows, policy changes, new features.',
  },
  organizer: {
    eyebrow: 'Attendee messaging',
    headline: 'Tell your attendees something.',
    body: 'Creates an in-app notification for every attendee who registered for one of your events.',
  },
};

/** Broadcast a notification to every attendee, as admin or organizer. */
export default function BroadcastForm({ role = 'admin' }) {
  const copy = COPY[role];
  const [form, setForm] = useState({ subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.subject.trim()) next.subject = 'Give the message a subject.';
    if (!form.message.trim()) next.message = 'The message cannot be empty.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);
    try {
      const result = await SENDERS[role]({
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      toast.success(`Sent to ${result.recipients} attendees`);
      setForm({ subject: '', message: '' });
    } catch (err) {
      toast.error(errorMessage(err, 'Could not send the broadcast'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="app-page">
      <div className="container container--narrow">
        <PageHeader eyebrow={copy.eyebrow} title={copy.headline}>
          {copy.body}
        </PageHeader>

        <form className="card card--pad-lg" onSubmit={handleSubmit} noValidate>
          <SectionLabel>Message</SectionLabel>

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
              rows={7}
              maxLength={5000}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              error={errors.message}
            />
          </div>

          <div
            className="btn-row"
            style={{ marginTop: 'var(--spacing-24)', justifyContent: 'flex-end' }}
          >
            <Button
              variant="ghost"
              onClick={() => {
                setForm({ subject: '', message: '' });
                setErrors({});
              }}
              disabled={sending}
            >
              Clear
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send to everyone'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}