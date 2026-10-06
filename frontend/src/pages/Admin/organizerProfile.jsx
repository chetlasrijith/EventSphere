import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrganizer, listEvents } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import {
  DataList,
  EmptyState,
  Notice,
  PageLoading,
  SectionLabel,
  Tag,
} from '../../components/ui/Surface';

/**
 * Read-only organizer profile, viewed by an admin.
 *
 * The event list is fetched from the public listing and filtered client-side,
 * because the admin detail endpoint returns the organizer but not their events.
 */
export default function OrganizerProfile() {
  const { organizerId } = useParams();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getOrganizer(organizerId);
        if (!cancelled) setOrganizer(data);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load the organizer'));
      } finally {
        if (!cancelled) setLoading(false);
      }

      try {
        const data = await listEvents({ page_size: 100 });
        if (cancelled) return;
        setEvents(
          (data.items || []).filter((e) => String(e.organizerId) === String(organizerId))
        );
      } catch {
        // The profile still renders without the event list.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizerId]);

  if (loading) return <PageLoading label="Loading organizer" />;

  if (error || !organizer) {
    return (
      <div className="app-page">
        <div className="container container--narrow">
          <Notice tone="alert">{error || 'Organizer not found.'}</Notice>
          <div style={{ marginTop: 'var(--spacing-16)' }}>
            <Button to="/admin/list-organizers" variant="outline">
              Back to organizers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="container">
        <Link to="/admin/list-organizers" className="eyebrow">
          ← All organizers
        </Link>

        <PageHeader
          eyebrow="Organizer"
          title={organizer.username}
          actions={
            <Button to="/admin/messageOrganizer" variant="outline">
              Send a message
            </Button>
          }
        />

        <div className="split" style={{ alignItems: 'start' }}>
          {/* Editorial left plate: cover, avatar, and the story in serif. */}
          <div>
            <img
              className="card__media"
              src={organizer.coverImage || '/images/banner.webp'}
              alt=""
              style={{ borderRadius: 'var(--radius)' }}
            />

            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-24)',
                alignItems: 'center',
                marginTop: 'var(--spacing-24)',
              }}
            >
              <img
                className="avatar avatar--lg"
                src={organizer.profileImg || '/images/sampleProfile.webp'}
                alt=""
              />
              <div>
                <div className="tag-list">
                  <Tag>{organizer.eventCount ?? 0} events</Tag>
                  <Tag plain>Rating {organizer.rating || '—'}</Tag>
                </div>
                <p className="t-body-sm u-graphite" style={{ marginTop: 'var(--spacing-8)' }}>
                  {organizer.email}
                </p>
              </div>
            </div>

            {organizer.about ? (
              <p className="t-serif u-iron" style={{ marginTop: 'var(--spacing-24)' }}>
                {organizer.about}
              </p>
            ) : (
              <p className="t-body-sm u-smoke" style={{ marginTop: 'var(--spacing-24)' }}>
                This organizer has not written an “about” yet.
              </p>
            )}
          </div>

          {/* Practical right column. */}
          <div className="stack">
            <div className="card">
              <SectionLabel>Contact</SectionLabel>
              <div style={{ marginTop: 'var(--spacing-16)' }}>
                <DataList
                  rows={[
                    { key: 'Phone', value: organizer.mobileNumber || '—' },
                    {
                      key: 'Address',
                      value:
                        [
                          organizer.street,
                          organizer.city,
                          organizer.state,
                          organizer.postalCode,
                          organizer.country,
                        ]
                          .filter(Boolean)
                          .join(', ') || '—',
                    },
                    { key: 'Events', value: organizer.eventCount ?? 0 },
                  ]}
                />
              </div>
            </div>

            <div className="card">
              <SectionLabel>Experience</SectionLabel>
              {!organizer.experiences?.length ? (
                <p className="t-body-sm u-smoke" style={{ marginTop: 'var(--spacing-12)' }}>
                  None listed.
                </p>
              ) : (
                <div className="stack" style={{ marginTop: 'var(--spacing-16)' }}>
                  {organizer.experiences.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        paddingBottom: 'var(--spacing-12)',
                        borderBottom: '1px solid var(--color-hairline)',
                      }}
                    >
                      <p className="t-body u-ink">{item.organization}</p>
                      <p className="eyebrow">
                        {item.years}y {item.months}m
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <SectionLabel>Achievements</SectionLabel>
              {!organizer.achievements?.length ? (
                <p className="t-body-sm u-smoke" style={{ marginTop: 'var(--spacing-12)' }}>
                  None listed.
                </p>
              ) : (
                <ul className="stack-sm" style={{ marginTop: 'var(--spacing-16)' }}>
                  {organizer.achievements.map((item, index) => (
                    <li className="t-body-sm u-iron" key={index}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <section className="band band--tight" style={{ marginTop: 'var(--spacing-80)' }}>
          <div className="container">
            <SectionLabel>Published events</SectionLabel>

            {!events.length ? (
              <div style={{ marginTop: 'var(--spacing-24)' }}>
                <EmptyState eyebrow="None" title="No published events.">
                  This organizer has not published anything yet.
                </EmptyState>
              </div>
            ) : (
              <ul className="table-wrap" style={{ marginTop: 'var(--spacing-24)' }}>
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="inbox-item"
                    style={{ cursor: 'default' }}
                  >
                    <span className="inbox-item__head">
                      <span>
                        <span className="inbox-item__subject t-body u-ink">
                          <Link to={`/eventDetails/${event.id}`} className="link">
                            {event.eventName}
                          </Link>
                        </span>
                        <span
                          className="t-body-sm u-smoke"
                          style={{ display: 'block', marginTop: 4 }}
                        >
                          {event.category} · {formatDate(event.startDate)} · {event.city}
                        </span>
                      </span>
                      <Tag>{event.status}</Tag>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}