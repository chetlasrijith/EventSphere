import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { messageAdmins } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import Button from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import { SectionLabel, Notice } from '../../components/ui/Surface';

/** Contact the admin team. Replies arrive as in-app notifications. */
export default function MessageAdmin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.subject.trim()) next.subject = 'Subject is required.';
    if (!form.message.trim()) next.message = 'Message is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);
    try {
      await messageAdmins({
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      toast.success('Message sent to the admin team');
      navigate('/organizer/events');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not send the message'));
      setSending(false);
    }
  };

  return (
    <div className="app-page">
      <div className="container container--narrow">
        <PageHeader eyebrow="Organizer" title="Contact the admin team">
          Reaches every admin account. Replies arrive in your notifications.
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
              rows={8}
              maxLength={5000}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              error={errors.message}
              hint="Include the event name if this is about a specific submission."
            />
          </div>

          <div
            className="btn-row"
            style={{ marginTop: 'var(--spacing-24)', justifyContent: 'flex-end' }}
          >
            <Button variant="ghost" to="/organizer/events" disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send message'}
            </Button>
          </div>
        </form>

        <Notice tone="plain">
          <span className="t-body-sm u-smoke">
            Cancelling an event uses the review queue instead — the reason is
            recorded against the event and you are notified directly.
          </span>
        </Notice>
      </div>
    </div>
  );
}