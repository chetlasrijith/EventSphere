import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHomeStats, getFeaturedEvents } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { formatDate } from '../utils/format';
import Button from '../components/ui/Button';
import { SectionLabel, ImageStrip, Notice, Tag } from '../components/ui/Surface';
import { Tabs } from '../components/ui/PageHeader';
import EventCard from '../components/ui/EventCard';

const STRIP = [
  '/images/banner.webp',
  '/images/banner2.webp',
  '/images/banner3.jpeg',
  '/images/banner.webp',
  '/images/banner2.webp',
  '/images/banner3.jpeg',
];

const ROLES = [
  {
    value: 'attendee',
    label: 'Attendees',
    headline: 'Find the room, keep the ticket.',
    body: 'Search by name, category or speaker. Register once and every ticket you have held stays in one list, scannable straight from your phone at the door.',
    points: ['Search across every approved listing', 'Tickets issued server-side, never in the browser', 'Withdraw from an event before it starts'],
    cta: { label: 'Create an attendee account', to: '/attendee/signup' },
  },
  {
    value: 'organizer',
    label: 'Organizers',
    headline: 'Publish once, then run it.',
    body: 'Draft a listing with venue, capacity, speakers and sponsors. Submit it for review, then adjust capacity and venue without touching a support ticket.',
    points: ['Submissions queue for admin approval', 'Capacity changes notify every attendee', 'Broadcast to your attendees in one send'],
    cta: { label: 'Start organizing', to: '/organizer/signup' },
  },
  {
    value: 'admin',
    label: 'Admins',
    headline: 'Review the queue, keep it honest.',
    body: 'One filterable queue for pending, approved, cancelled and completed events. Approve, cancel with a stated reason, and message the organizer from the same screen.',
    points: ['Approve or cancel with a recorded reason', 'Organizer directory with full profiles', 'Approve or decline pending admin requests'],
    cta: { label: 'Admin sign in', to: '/admin/login' },
  },
];

/** Latest events, paged client-side so the DOM stays bounded. */
function LatestEvents() {
  const [events, setEvents] = useState([]);
  const [visible, setVisible] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    getFeaturedEvents({ limit: 50 })
      .then((data) => !cancelled && setEvents(data || []))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load events')))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="u-smoke t-body-sm">Loading upcoming events…</p>;
  if (error) return <Notice tone="alert">{error}</Notice>;
  if (!events.length)
    return (
      <Notice>
        No approved events are published yet. Organizers can submit the first
        one — <Link to="/organizer/signup" className="link">create an account</Link> to
        get started.
      </Notice>
    );

  return (
    <>
      <div className="grid grid--3">
        {events.slice(0, visible).map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {visible < events.length && (
        <div className="btn-row" style={{ marginTop: 'var(--spacing-32)', justifyContent: 'center' }}>
          <Button variant="hairline" onClick={() => setVisible((v) => v + 6)}>
            Show more
          </Button>
        </div>
      )}
    </>
  );
}

/** Preview of a listing, rendered inside a warm screenshot panel. */
function ListingPreview({ event }) {
  if (!event) {
    return (
      <div className="screenshot">
        <SectionLabel>Latest listing</SectionLabel>
        <div className="screenshot__frame">
          <div className="screenshot__bar" aria-hidden="true">
            <span className="screenshot__dot" />
            <span className="screenshot__dot" />
            <span className="screenshot__dot" />
          </div>
          <div style={{ padding: 'var(--spacing-24)' }}>
            <span className="eyebrow">Awaiting review</span>
            <p className="t-heading-sm" style={{ marginTop: 'var(--spacing-12)' }}>
              Publish something
            </p>
            <p className="t-body-sm u-iron" style={{ marginTop: 'var(--spacing-8)' }}>
              New organizer listings enter the admin queue before they appear in
              search.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screenshot">
      <SectionLabel>Latest approved listing</SectionLabel>
      <div className="screenshot__frame">
        <div className="screenshot__bar" aria-hidden="true">
          <span className="screenshot__dot" />
          <span className="screenshot__dot" />
          <span className="screenshot__dot" />
        </div>
        <div style={{ padding: 'var(--spacing-24)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Tag>{event.category || 'Event'}</Tag>
            <Tag tone="approved">Open</Tag>
          </div>
          <p className="t-heading-sm" style={{ marginTop: 'var(--spacing-16)' }}>
            {event.eventName}
          </p>
          <p className="t-body-sm u-iron" style={{ marginTop: 'var(--spacing-8)' }}>
            {formatDate(event.startDate)} · {event.venue}, {event.city}
          </p>
          {event.description && (
            <p
              className="t-serif u-iron"
              style={{ marginTop: 'var(--spacing-16)', maxWidth: 360 }}
            >
              {event.description}
            </p>
          )}
          <div className="btn-row" style={{ marginTop: 'var(--spacing-24)' }}>
            <Button variant="primary" size="sm">
              Register
            </Button>
            <Button variant="ghost" size="sm">
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [role, setRole] = useState('attendee');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getHomeStats()
      .then((data) => !cancelled && setStats(data))
      .catch((err) => console.error(errorMessage(err)));

    getFeaturedEvents({ limit: 1 })
      .then((data) => !cancelled && setPreview(data?.[0] || null))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const active = ROLES.find((item) => item.value === role);

  return (
    <>
      {/* ---------------------------------------------------------------
          Hero — 80px whisper-weight display, subtext in a narrow column.
       * -------------------------------------------------------------- */}
      <section className="band band--canvas home-hero" style={{ paddingTop: 'var(--spacing-96)' }}>
        <div className="container">
          <div className="split" style={{ alignItems: 'end' }}>
            <div>
              <span className="eyebrow eyebrow--violet">Event management platform</span>
              <h1 className="t-display-lg" style={{ marginTop: 'var(--spacing-24)' }}>
                Events,
                <br />
                arranged calmly.
              </h1>
            </div>

            <div>
              <p className="t-body u-iron measure--wide">
                EventSphere is where organizers publish, reviewers approve, and
                attendees keep their tickets. One record per event, from the
                first draft to the last scan at the door.
              </p>
              <div className="btn-row" style={{ marginTop: 'var(--spacing-24)' }}>
                <Button to="/search" variant="primary">
                  Browse events
                </Button>
                <Button to="/organizer/signup" variant="outline">
                  Become an organizer
                </Button>
              </div>
            </div>
          </div>

          {stats && (
            <div className="row" style={{ marginTop: 'var(--spacing-64)', gap: 64 }}>
              <div>
                <span className="stat__value">{stats.upcomingEvents}</span>
                <span className="stat__label">Upcoming events</span>
              </div>
              <div>
                <span className="stat__value">{stats.totalEvents}</span>
                <span className="stat__label">Total listings</span>
              </div>
              <div className="measure--wide">
                <p className="t-serif u-iron">
                  Listings are reviewed before they appear in search, so what an
                  attendee sees has already been read by a person.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Decorative texture band — imagery as punctuation, not the hero. */}
      <section className="band band--tight band--stone home-gallery" style={{ paddingBottom: 0 }}>
        <div className="container">
          <ImageStrip images={STRIP} />
        </div>
      </section>

      {/* ---------------------------------------------------------------
          Role spread — tab navigation with the underline as the only state.
       * -------------------------------------------------------------- */}
      <section className="band">
        <div className="container">
          <div className="split" style={{ alignItems: 'start' }}>
            <div>
              <SectionLabel>Who it is for</SectionLabel>
              <h2 className="t-heading-lg" style={{ marginTop: 'var(--spacing-16)' }}>
                Three roles, one record of the event.
              </h2>
              <p className="t-body u-iron" style={{ marginTop: 'var(--spacing-16)' }}>
                Everyone sees the same listing. What changes is what you are
                allowed to do to it.
              </p>
            </div>

            <ListingPreview event={preview} />
          </div>

          <div style={{ marginTop: 'var(--spacing-48)' }}>
            <Tabs
              items={ROLES.map((item) => ({ value: item.value, label: item.label || item.value }))}
              value={role}
              onChange={setRole}
            />

            <div className="split" style={{ paddingTop: 'var(--spacing-40)' }}>
              <div>
                <h3 className="t-heading">{active.headline}</h3>
                <p className="t-serif u-iron" style={{ marginTop: 'var(--spacing-16)' }}>
                  {active.body}
                </p>
                <ul className="numbered" style={{ marginTop: 'var(--spacing-32)' }}>
                  {active.points.map((point) => (
                    <li className="numbered__item" key={point}>
                      <span>
                        <span className="numbered__title u-ink" style={{ fontSize: 'var(--text-body)' }}>
                          {point}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="btn-row" style={{ marginTop: 'var(--spacing-32)' }}>
                  <Button to={active.cta.to} variant="outline" arrow>
                    {active.cta.label}
                  </Button>
                </div>
              </div>

              <div className="stack">
                <div className="card card--warm">
                  <SectionLabel>Review states</SectionLabel>
                  <div className="tag-list" style={{ marginTop: 'var(--spacing-16)' }}>
                    <Tag tone="pending">Pending review</Tag>
                    <Tag tone="approved">Approved</Tag>
                    <Tag tone="cancelled">Cancelled</Tag>
                    <Tag tone="completed">Completed</Tag>
                  </div>
                </div>
                <blockquote className="pull-quote t-serif">
                  “The whole platform is four surfaces — canvas, linen, stone and
                  white. Depth comes from tone, never from shadow.”
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          Latest events — the practical half of the page.
       * -------------------------------------------------------------- */}
      <section className="app-page">
        <div className="container">
          <div className="page-head__row" style={{ marginBottom: 'var(--spacing-40)' }}>
            <div>
              <SectionLabel>Latest listings</SectionLabel>
              <h2 className="t-heading-lg" style={{ marginTop: 'var(--spacing-16)' }}>
                Upcoming, in order.
              </h2>
            </div>
            <Button to="/search" variant="hairline" arrow>
              Search everything
            </Button>
          </div>

          <LatestEvents />
        </div>
      </section>
    </>
  );
}