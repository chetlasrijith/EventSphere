import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { listEvents, approveEvent, cancelEvent } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import PageHeader, { Tabs } from '../../components/ui/PageHeader';
import {
  Tag,
  StatusTag,
  EmptyState,
  PageLoading,
  Notice,
  Pagination,
  SectionLabel,
  DataList,
} from '../../components/ui/Surface';

/** Each status keeps its own URL so a queue can be deep-linked or shared. */
const STATUSES = [
  { value: 'pending', label: 'Pending', path: '/admin/approve-pending-events' },
  { value: 'approved', label: 'Approved', path: '/admin/approved-events' },
  { value: 'cancelled', label: 'Cancelled', path: '/admin/canceled-events' },
  { value: 'completed', label: 'Completed', path: '/admin/completed-events' },
];

const STATUS_TABS = STATUSES.map(({ value, label }) => ({ value, label }));

/**
 * Admin event queue, filtered by status.
 *
 * The old app had six near-identical pages (approved / pending / cancelled /
 * completed, each with its own detail view). One filterable page replaces all
 * six; the API filters server-side via `?status=`.
 */
export default function AdminEvents({ status }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listEvents({ status, page, page_size: 10 });
        if (cancelled) return;
        setEvents(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load events'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, page]);

  const refresh = async () => {
    try {
      const data = await listEvents({ status, page, page_size: 10 });
      setEvents(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(errorMessage(err, 'Could not refresh'));
    }
  };

  const handleApprove = async (eventId) => {
    setBusyId(eventId);
    try {
      await approveEvent(eventId);
      toast.success('Event approved');
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not approve the event'));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (eventId, eventName) => {
    if (!reason.trim()) {
      toast.warning('Enter a cancellation reason first');
      return;
    }

    setBusyId(eventId);
    try {
      await cancelEvent(eventId, reason.trim());
      toast.success(`“${eventName}” cancelled`);
      setReason('');
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not cancel the event'));
    } finally {
      setBusyId(null);
    }
  };

  const heading = useMemo(() => `${status.charAt(0).toUpperCase()}${status.slice(1)}`, [status]);

  // Each tab keeps its own route, so the admin can link directly to a queue.
  const goToStatus = (next) => {
    const target = STATUSES.find((item) => item.value === next);
    if (target) navigate(target.path);
  };

  return (
    <div className="app-page">
      <div className="container">
        <PageHeader eyebrow="Admin" title={`${heading} events`}>
          {status === 'pending'
            ? 'Submissions from organizers awaiting a decision. Approve to publish, or cancel with a reason the organizer can read.'
            : `Every event currently marked ${status}.`}
        </PageHeader>

        <div style={{ marginBottom: 'var(--spacing-32)' }}>
          <Tabs items={STATUS_TABS} value={status} onChange={goToStatus} />
        </div>

        {status === 'pending' && events.length > 0 && (
          <div className="card card--warm" style={{ marginBottom: 'var(--spacing-24)' }}>
            <SectionLabel>Cancellation reason</SectionLabel>
            <p className="t-body-sm u-iron" style={{ marginTop: 'var(--spacing-8)' }}>
              Recorded on the event and shown to the organizer. Required before
              any cancellation.
            </p>
            <div style={{ marginTop: 'var(--spacing-16)' }}>
              <Input
                value={reason}
                maxLength={200}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Venue unavailable on the requested date"
              />
            </div>
          </div>
        )}

        {error && <Notice tone="alert">{error}</Notice>}

        {loading ? (
          <PageLoading label="Loading queue" />
        ) : events.length === 0 ? (
          <EmptyState eyebrow="Empty" title={`No ${status} events.`}>
            {status === 'pending'
              ? 'Nothing is waiting for review. New organizer submissions land here.'
              : `No events have been marked ${status} yet.`}
          </EmptyState>
        ) : (
          <div className="stack">
            {events.map((event) => {
              const open = expanded === event.id;
              const busy = busyId === event.id;

              return (
                <article className="card" key={event.id}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--spacing-16)',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ minWidth: 260 }}>
                      <div className="tag-list">
                        <Tag>{event.category}</Tag>
                        <StatusTag status={event.status} />
                      </div>

                      <h2 className="card__title" style={{ marginTop: 'var(--spacing-12)' }}>
                        <Link to={`/eventDetails/${event.id}`} className="link">
                          {event.eventName}
                        </Link>
                      </h2>

                      <p className="t-body-sm u-iron" style={{ marginTop: 'var(--spacing-8)' }}>
                        {formatDate(event.startDate)}
                      </p>
                      <p className="t-body-sm u-graphite">
                        {event.venue}
                        {event.city ? `, ${event.city}` : ''}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-expanded={open}
                        onClick={() => setExpanded(open ? null : event.id)}
                      >
                        {open ? 'Hide details' : 'Show details'}
                      </Button>

                      {status === 'pending' && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleApprove(event.id)}
                        >
                          {busy ? 'Working…' : 'Approve'}
                        </Button>
                      )}

                      {(status === 'pending' || status === 'approved') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleCancel(event.id, event.eventName)}
                        >
                          Cancel event
                        </Button>
                      )}
                    </div>
                  </div>

                  {open && (
                    <div style={{ marginTop: 'var(--spacing-24)' }}>
                      <DataList
                        rows={[
                          { key: 'Capacity', value: `${event.currentAttendees ?? 0} / ${event.maxAttendees ?? '—'}` },
                          { key: 'Type', value: event.eventType },
                          {
                            key: 'Speakers',
                            value: event.speakers?.length ? event.speakers.join(', ') : '—',
                          },
                          {
                            key: 'Address',
                            value:
                              [
                                event.street,
                                event.city,
                                event.state,
                                event.postalCode,
                                event.country,
                              ]
                                .filter(Boolean)
                                .join(', ') || '—',
                          },
                          {
                            key: 'Cancellation reason',
                            value: event.cancellationReason || '—',
                          },
                        ]}
                      />

                      {event.description && (
                        <p className="t-serif u-iron" style={{ marginTop: 'var(--spacing-20)' }}>
                          {event.description}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </div>
    </div>
  );
}