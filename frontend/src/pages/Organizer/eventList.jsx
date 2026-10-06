import React, { useEffect, useMemo, useState } from 'react';
import { listMyEvents } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import EventCard from '../../components/ui/EventCard';
import Button from '../../components/ui/Button';
import PageHeader, { Tabs } from '../../components/ui/PageHeader';
import { EmptyState, PageLoading, PageError, Notice } from '../../components/ui/Surface';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

const TABS = FILTERS.map(({ value, label }) => ({ value, label }));

/**
 * The organizer's own events.
 *
 * Pending events are listed alongside published ones with their real status, so
 * the organizer can see what is still in review without leaving the page.
 */
export default function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    listMyEvents({ page_size: 100 })
      .then((data) => !cancelled && setEvents(data.items || []))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load your events')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(
    () => (filter === 'all' ? events : events.filter((event) => event.status === filter)),
    [events, filter]
  );

  if (loading) return <PageLoading label="Loading your events" />;
  if (error) return <PageError message={error} />;

  const pendingCount = events.filter((event) => event.status === 'pending').length;

  return (
    <div className="app-page">
      <div className="container">
        <PageHeader
          eyebrow="Organizer"
          title="My events"
          actions={
            <Button to="/organizer/create-event" variant="primary">
              Create event
            </Button>
          }
        >
          {events.length
            ? `${events.length} ${events.length === 1 ? 'event' : 'events'}${
                pendingCount ? `, ${pendingCount} awaiting review` : ''
              }.`
            : 'Everything you publish will be listed here.'}
        </PageHeader>

        {events.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-32)' }}>
            <Tabs items={TABS} value={filter} onChange={setFilter} />
          </div>
        )}

        {pendingCount > 0 && (
          <Notice>
            Submissions stay pending until an admin approves them. Attendees
            cannot see them in search until then.
          </Notice>
        )}

        {events.length === 0 ? (
          <EmptyState
            eyebrow="Nothing yet"
            title="You have not created any events."
            action={
              <Button to="/organizer/create-event" variant="primary">
                Create your first event
              </Button>
            }
          >
            A listing needs a name, a venue, a date range and a capacity. You can
            add speakers and sponsors afterwards.
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState eyebrow="Empty" title={`No ${filter} events.`}>
            Switch the filter above to see your other listings.
          </EmptyState>
        ) : (
          <div className="grid grid--3">
            {visible.map((event) => (
              <EventCard key={event.id} event={event} to={`/organizer/events/${event.id}`} showStatus />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}