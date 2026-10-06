import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { myRegistrations, cancelRegistration } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { Tag, StatusTag, EmptyState, PageLoading, PageError } from '../../components/ui/Surface';

/**
 * The attendee's registrations.
 *
 * Withdrawing is destructive, so it is the only place in the app that opens a
 * `confirm()` — cancelling a registration cannot be undone from anywhere else.
 */
export default function MyEventList() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    myRegistrations()
      .then((data) => !cancelled && setRegistrations(data || []))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load your events')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleWithdraw = async (registrationId, eventName) => {
    if (!window.confirm(`Cancel your registration for “${eventName}”? This cannot be undone.`)) {
      return;
    }

    setPendingId(registrationId);
    try {
      await cancelRegistration(registrationId);
      setRegistrations((prev) => prev.filter((r) => r.registrationId !== registrationId));
      toast.success('Registration cancelled');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not cancel the registration'));
    } finally {
      setPendingId(null);
    }
  };

  if (loading) return <PageLoading label="Loading your events" />;
  if (error) return <PageError message={error} />;

  return (
    <div className="app-page">
      <div className="container">
        <PageHeader
          eyebrow="Attendee"
          title="My events"
          actions={
            <Button to="/attendee/search-events" variant="outline">
              Find more events
            </Button>
          }
        >
          Every event you are registered for, with the option to withdraw before
          it takes place.
        </PageHeader>

        {!registrations.length ? (
          <EmptyState
            eyebrow="Nothing booked"
            title="You have not registered for any events yet."
            action={
              <Button to="/attendee/search-events" variant="primary">
                Browse events
              </Button>
            }
          >
            Once you register, the event and its ticket stay listed here.
          </EmptyState>
        ) : (
          <div className="grid grid--3">
            {registrations.map(({ registrationId, event }) => {
              const past = event.status === 'completed';

              return (
                <article className="card" key={registrationId}>
                  <div className="card__body" style={{ padding: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--spacing-8)',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Tag>{event.category}</Tag>
                      <StatusTag status={event.status} />
                    </div>

                    <h2 className="card__title" style={{ marginTop: 'var(--spacing-16)' }}>
                      {event.eventName}
                    </h2>

                    <p className="t-body-sm u-iron" style={{ marginTop: 'var(--spacing-8)' }}>
                      {formatDate(event.startDate)}
                    </p>
                    <p className="t-body-sm u-graphite">
                      {event.venue}
                      {event.city ? `, ${event.city}` : ''}
                    </p>

                    <div
                      className="btn-row"
                      style={{
                        marginTop: 'var(--spacing-24)',
                        paddingTop: 'var(--spacing-16)',
                        borderTop: '1px solid var(--color-hairline)',
                        justifyContent: 'space-between',
                      }}
                    >
                      {past ? (
                        <span className="eyebrow">Event has taken place</span>
                      ) : (
                        <Button
                          variant="hairline"
                          size="sm"
                          disabled={pendingId === registrationId}
                          onClick={() => handleWithdraw(registrationId, event.eventName)}
                        >
                          {pendingId === registrationId ? 'Cancelling…' : 'Cancel registration'}
                        </Button>
                      )}
                      <Button
                        to={`/eventDetails/${event.id}`}
                        variant="ghost"
                        size="sm"
                        arrow
                      >
                        Details
                      </Button>
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