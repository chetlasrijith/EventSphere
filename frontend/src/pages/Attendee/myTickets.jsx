import React, { useEffect, useState } from 'react';
import { myRegistrations, myTickets } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import PageHeader, { Tabs } from '../../components/ui/PageHeader';
import {
  Tag,
  StatusTag,
  EmptyState,
  PageLoading,
  PageError,
  SectionLabel,
} from '../../components/ui/Surface';

const FILTERS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
];

const isPast = (event) =>
  event.status === 'completed' || (event.endDate && new Date(event.endDate) < new Date());

/**
 * Every event the attendee has registered for, with the ticket code inline.
 *
 * The old app had no way to reach a ticket again — it was only shown on the
 * confirmation screen immediately after registering. Tickets are re-fetchable
 * here from the server, so a lost confirmation is recoverable.
 */
export default function MyTickets() {
  const [registrations, setRegistrations] = useState([]);
  const [tickets, setTickets] = useState({});
  const [filter, setFilter] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [registrations_, tickets_] = await Promise.all([
          myRegistrations(),
          // A failure here should not blank the whole page — the registration
          // list is still useful without codes.
          myTickets().catch(() => []),
        ]);
        if (cancelled) return;

        setRegistrations(registrations_ || []);

        const list = Array.isArray(tickets_) ? tickets_ : tickets_?.tickets || [];
        setTickets(
          Object.fromEntries(
            list
              .filter((ticket) => ticket.eventId || ticket.event_id)
              .map((ticket) => [String(ticket.eventId ?? ticket.event_id), ticket])
          )
        );
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load your tickets'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageLoading label="Loading your tickets" />;
  if (error) return <PageError message={error} />;

  const visible = registrations.filter(({ event }) => {
    if (filter === 'upcoming') return !isPast(event);
    if (filter === 'past') return isPast(event);
    return true;
  });

  return (
    <div className="app-page">
      <div className="container">
        <PageHeader eyebrow="Attendee" title="My tickets">
          Your booking codes for every event you are registered for. Screenshot or
          print the code — it is checked at the door.
        </PageHeader>

        {registrations.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-32)' }}>
            <Tabs items={FILTERS} value={filter} onChange={setFilter} />
          </div>
        )}

        {!registrations.length ? (
          <EmptyState
            eyebrow="No tickets"
            title="You have no tickets yet."
            action={
              <Button to="/attendee/search-events" variant="primary">
                Browse events
              </Button>
            }
          >
            Register for an event and the ticket appears here.
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState eyebrow="Empty" title={`No ${filter} events.`}>
            Switch the filter above to see your other registrations.
          </EmptyState>
        ) : (
          <div className="stack">
            {visible.map(({ registrationId, event }) => {
              const ticket = tickets[String(event?.id)];

              return (
                <article className="card" key={registrationId}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--spacing-24)',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ minWidth: 240 }}>
                      <div className="tag-list">
                        <Tag>{event.category}</Tag>
                        <StatusTag status={event.status} />
                      </div>
                      <h2 className="card__title" style={{ marginTop: 'var(--spacing-12)' }}>
                        {event.eventName}
                      </h2>
                      <p className="t-body-sm u-iron" style={{ marginTop: 'var(--spacing-8)' }}>
                        {formatDate(event.startDate)}
                        {event.venue ? ` · ${event.venue}` : ''}
                      </p>
                    </div>

                    <div style={{ minWidth: 200 }}>
                      <SectionLabel>Booking code</SectionLabel>
                      {ticket ? (
                        <>
                          <p className="t-mono-sm u-ink" style={{ marginTop: 'var(--spacing-8)' }}>
                            {ticket.bookingId || ticket.booking_id}
                          </p>
                          <p className="t-body-sm u-graphite">
                            Secret:{' '}
                            <span className="t-mono-sm">
                              {ticket.secretCode || ticket.secret_code}
                            </span>
                          </p>
                        </>
                      ) : (
                        <p className="t-body-sm u-smoke" style={{ marginTop: 'var(--spacing-8)' }}>
                          {isPast(event)
                            ? 'This event has already taken place.'
                            : 'No ticket issued yet.'}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}