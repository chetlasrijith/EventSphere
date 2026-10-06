import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createEvent } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import Button from '../../components/ui/Button';
import { Input, Textarea, Select, Check } from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import { SectionLabel, Notice } from '../../components/ui/Surface';

const EMPTY = {
  eventName: '',
  category: '',
  description: '',
  startDate: '',
  endDate: '',
  venue: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  eventType: 'public',
  ticketsRequired: false,
  price: 0,
  maxAttendees: 50,
  speakers: '',
  services: '',
  sponsors: '',
};

const ADDRESS_FIELDS = [
  ['street', 'Street'],
  ['city', 'City'],
  ['state', 'State'],
  ['postalCode', 'Postal code'],
  ['country', 'Country'],
];

const LIST_FIELDS = [
  ['speakers', 'Speakers'],
  ['services', 'Services'],
  ['sponsors', 'Sponsors'],
];

/** Comma- or newline-separated textarea -> string[]. */
const splitList = (value) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Create an event.
 *
 * Submitting creates a *pending* event: it does not appear in search until an
 * admin approves it. The form says so up front rather than letting the organizer
 * discover it after the fact.
 */
export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Validate the date pair on change rather than only on submit, so the error
  // appears while the organizer is still looking at both fields.
  useEffect(() => {
    setErrors((prev) => {
      const invalid = Boolean(
        form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)
      );
      const message = invalid ? 'End must be after the start' : undefined;
      if (prev.endDate === message) return prev;
      return { ...prev, endDate: message };
    });
  }, [form.startDate, form.endDate]);

  const validate = () => {
    const next = {};
    if (!form.eventName.trim()) next.eventName = 'Event name is required.';
    if (!form.category.trim()) next.category = 'Category is required.';
    if (!form.startDate) next.startDate = 'Start date is required.';
    if (!form.endDate) next.endDate = 'End date is required.';
    else if (new Date(form.endDate) <= new Date(form.startDate))
      next.endDate = 'End must be after the start.';
    if (!form.venue.trim()) next.venue = 'Venue is required.';
    ADDRESS_FIELDS.forEach(([key, label]) => {
      if (!form[key].trim()) next[key] = `${label} is required.`;
    });
    if (!form.maxAttendees || Number(form.maxAttendees) < 1)
      next.maxAttendees = 'Enter at least 1 attendee.';
    if (form.ticketsRequired && Number(form.price) < 0)
      next.price = 'Price cannot be negative.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await createEvent({
        event_name: form.eventName.trim(),
        category: form.category.trim(),
        description: form.description.trim() || undefined,
        start_date: new Date(form.startDate).toISOString(),
        end_date: new Date(form.endDate).toISOString(),
        venue: form.venue.trim(),
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postal_code: form.postalCode.trim(),
          country: form.country.trim(),
        },
        event_type: form.eventType,
        tickets_required: form.ticketsRequired,
        price: Number(form.price) || 0,
        max_attendees: Number(form.maxAttendees),
        speakers: splitList(form.speakers),
        services: splitList(form.services),
        sponsors: splitList(form.sponsors),
      });
      toast.success('Event submitted. It is now pending admin approval.');
      navigate('/organizer/events');
    } catch (err) {
      setServerError(errorMessage(err, 'Could not create the event'));
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page">
      <div className="container container--reading">
        <PageHeader eyebrow="Organizer" title="Create an event">
          Submissions go into the admin review queue before they appear in
          search. You can adjust venue and capacity afterwards.
        </PageHeader>

        {serverError && <Notice tone="alert">{serverError}</Notice>}

        <form className="card card--pad-lg" onSubmit={handleSubmit} noValidate>
          {/* The basics */}
          <SectionLabel>Event</SectionLabel>

          <div className="stack" style={{ marginTop: 'var(--spacing-20)' }}>
            <Input
              label="Event name"
              value={form.eventName}
              onChange={update('eventName')}
              error={errors.eventName}
            />

            <div className="grid grid--2">
              <Input
                label="Category"
                value={form.category}
                onChange={update('category')}
                error={errors.category}
                placeholder="Workshop, concert, meetup…"
              />
              <Input
                label="Venue"
                value={form.venue}
                onChange={update('venue')}
                error={errors.venue}
              />
            </div>

            <Textarea
              label="Description"
              rows={3}
              value={form.description}
              onChange={update('description')}
            />

            <div className="grid grid--2">
              <Input
                label="Starts"
                type="datetime-local"
                value={form.startDate}
                onChange={update('startDate')}
                error={errors.startDate}
              />
              <Input
                label="Ends"
                type="datetime-local"
                value={form.endDate}
                onChange={update('endDate')}
                error={errors.endDate}
              />
            </div>
          </div>

          {/* Address */}
          <SectionLabel className="u-mt-48">Location</SectionLabel>

          <div className="stack" style={{ marginTop: 'var(--spacing-20)' }}>
            {ADDRESS_FIELDS.map(([key, label]) => (
              <Input
                key={key}
                label={label}
                value={form[key]}
                onChange={update(key)}
                error={errors[key]}
              />
            ))}
          </div>

          {/* Ticketing */}
          <SectionLabel className="u-mt-48">Entry</SectionLabel>

          <div className="stack" style={{ marginTop: 'var(--spacing-20)' }}>
            <Select label="Visibility" value={form.eventType} onChange={update('eventType')}>
              <option value="public">Public — listed in search</option>
              <option value="private">Private — link only</option>
            </Select>

            <Check
              label="Tickets required for entry"
              checked={form.ticketsRequired}
              onChange={update('ticketsRequired')}
            />

            {form.ticketsRequired && (
              <div className="grid grid--2">
                <Input
                  label="Price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={update('price')}
                  error={errors.price}
                />
                <Input
                  label="Maximum attendees"
                  type="number"
                  min="1"
                  value={form.maxAttendees}
                  onChange={update('maxAttendees')}
                  error={errors.maxAttendees}
                />
              </div>
            )}

            {!form.ticketsRequired && (
              <Input
                label="Maximum attendees"
                type="number"
                min="1"
                value={form.maxAttendees}
                onChange={update('maxAttendees')}
                error={errors.maxAttendees}
                hint="Capacity can be raised later; it cannot drop below who is already registered."
              />
            )}
          </div>

          {/* Extras */}
          <SectionLabel className="u-mt-48">Extra detail</SectionLabel>

          <div className="stack" style={{ marginTop: 'var(--spacing-20)' }}>
            {LIST_FIELDS.map(([key, label]) => (
              <Textarea
                key={key}
                label={label}
                rows={2}
                value={form[key]}
                onChange={update(key)}
                hint="Separate entries with a comma or a new line."
              />
            ))}
          </div>

          <div
            className="btn-row"
            style={{
              marginTop: 'var(--spacing-48)',
              paddingTop: 'var(--spacing-24)',
              borderTop: '1px solid var(--color-hairline)',
              justifyContent: 'flex-end',
            }}
          >
            <Button variant="ghost" to="/organizer/events" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit for review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}