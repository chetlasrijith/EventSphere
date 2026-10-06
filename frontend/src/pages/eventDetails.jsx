import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getEvent, registerForEvent } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { formatDate, formatDateTime, formatPrice } from '../utils/format';
import { hasRole } from '../utils/auth';
import Button from '../components/ui/Button';
import {
  Tag,
  StatusTag,
  Notice,
  DataList,
  PageLoading,
  PageError,
  SectionLabel,
} from '../components/ui/Surface';

const HIGHLIGHTS = [
  ['speakers', 'Speakers'],
  ['services', 'Services'],
  ['sponsors', 'Sponsors'],
];

/** Chip list used for speakers / services / sponsors. */
function Chips({ label, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="tag-list" style={{ marginTop: 'var(--spacing-12)' }}>
        {items.map((item) => (
          <Tag key={item} plain>
            {item}
          </Tag>
        ))}
      </div>
    </div>
  );
}

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getEvent(eventId)
      .then((data) => !cancelled && setEvent(data))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load the event')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const handleRegister = async () => {
    if (!hasRole('Attendee')) {
      toast.warning('Sign in as an attendee to register');
      navigate('/attendee/login', { state: { from: `/eventDetails/${eventId}` } });
      return;
    }

    setRegistering(true);
    try {
      const result = await registerForEvent(eventId);
      setEvent((prev) => ({ ...prev, isRegistered: true }));
      toast.success('You are registered');
      // The ticket page asks the server for a ticket rather than minting its
      // own booking id in the browser.
      navigate('/attendee/events/register/ticket', { state: { event: result.event } });
    } catch (err) {
      toast.error(errorMessage(err, 'Registration failed'));
      setRegistering(false);
    }
  };

  if (loading) return <PageLoading label="Loading event" />;
  if (error)
    return (
      <PageError
        message={error}
        action={
          <Button to="/search" variant="outline">
            Back to search
          </Button>
        }
      />
    );
  if (!event) return <PageError message="That event no longer exists." />;

  const soldOut = event.ticketsRequired && event.currentAttendees >= event.maxAttendees;
  const open = event.status === 'approved';
  const canRegister = open && !soldOut && !event.isRegistered;
  const hasHighlights = HIGHLIGHTS.some(([key]) => event[key]?.length > 0);

  return (
    <div className="app-page">
      <div className="container">
        {/* Editorial masthead: headline left, practical facts in a column. */}
        <div className="split" style={{ alignItems: 'start' }}>
          <div>
            <Link to="/search" className="eyebrow">
              ← All events
            </Link>

            <div className="tag-list" style={{ marginTop: 'var(--spacing-16)' }}>
              <Tag>{event.category}</Tag>
              <StatusTag status={event.status} />
            </div>

            <h1 className="t-display-lg" style={{ marginTop: 'var(--spacing-20)' }}>
              {event.eventName}
            </h1>

            {event.description ? (
              <p className="t-serif u-iron measure" style={{ marginTop: 'var(--spacing-24)' }}>
                {event.description}
              </p>
            ) : (
              <p className="t-serif u-graphite measure" style={{ marginTop: 'var(--spacing-24)' }}>
                No description has been published for this event yet.
              </p>
            )}

            {event.roar && event.roar !== 'Event not started yet' && (
              <Notice tone="violet">{event.roar}</Notice>
            )}
          </div>

          {/* The ticket panel: a white plate, the only place a CTA lives. */}
          <div className="card card--pad-lg">
            <SectionLabel>Attendance</SectionLabel>

            <div className="stack" style={{ marginTop: 'var(--spacing-20)' }}>
              <DataList
                rows={[
                  { key: 'Starts', value: formatDate(event.startDate) },
                  { key: 'Ends', value: formatDate(event.endDate) },
                  { key: 'Venue', value: event.venue },
                  {
                    key: 'Address',
                    value:
                      [event.street, event.city, event.state, event.postalCode, event.country]
                        .filter(Boolean)
                        .join(', ') || '—',
                  },
                  {
                    key: 'Capacity',
                    value: `${event.currentAttendees ?? 0} / ${event.maxAttendees ?? '—'}`,
                  },
                  { key: 'Organizer', value: event.organizerUsername },
                ]}
              />
            </div>

            <div style={{ marginTop: 'var(--spacing-24)' }}>
              <SectionLabel>Entry</SectionLabel>
              <p className="t-heading-sm" style={{ marginTop: 'var(--spacing-8)' }}>
                {event.ticketsRequired ? formatPrice(event.price) : 'Free'}
              </p>
            </div>

            {soldOut && (
              <Notice tone="alert">This event is fully booked.</Notice>
            )}

            {event.isRegistered ? (
              <Button to="/attendee/myevent-list" variant="outline" block>
                You are registered — view your events
              </Button>
            ) : (
              <Button
                variant="primary"
                block
                disabled={!canRegister || registering}
                onClick={handleRegister}
              >
                {registering
                  ? 'Registering…'
                  : !open
                    ? 'Registration closed'
                    : soldOut
                      ? 'Sold out'
                      : event.ticketsRequired
                        ? 'Buy ticket'
                        : 'Register'}
              </Button>
            )}

            {!hasRole('Attendee') && open && (
              <p className="field__hint" style={{ marginTop: 'var(--spacing-12)' }}>
                You will be asked to sign in as an attendee first.
              </p>
            )}
          </div>
        </div>

        {/* Highlights sit in a linen band — a tone shift, not a divider line. */}
        {hasHighlights && (
          <section className="band band--tight" style={{ marginTop: 'var(--spacing-80)' }}>
            <div className="container">
              <SectionLabel>What to expect</SectionLabel>
              <div
                className="grid grid--3"
                style={{ marginTop: 'var(--spacing-24)' }}
              >
                {HIGHLIGHTS.filter(([key]) => event[key]?.length > 0).map(([key, label]) => (
                  <Chips key={key} label={label} items={event[key]} />
                ))}
              </div>
            </div>
          </section>
        )}

        <p className="t-mono u-smoke" style={{ marginTop: 'var(--spacing-64)' }}>
          Last updated {formatDateTime(event.updatedAt || event.createdAt)}
        </p>
      </div>
    </div>
  );
}