import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getEvent,
  updateEvent,
  uploadEventBanner,
  updateEventTags,
  updateEventSchedule,
} from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import {
  Tag,
  StatusTag,
  DataList,
  Notice,
  PageLoading,
  PageError,
  SectionLabel,
} from '../../components/ui/Surface';

const TAG_FIELDS = [
  ['speakers', 'Speakers'],
  ['services', 'Services'],
  ['sponsors', 'Sponsors'],
];

const split = (value) =>
  value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

/**
 * Organizer view of one event: read the listing, adjust it.
 *
 * Each edit is a separate, explicit save. Venue and capacity are split because
 * they behave differently — capacity can only go up, and a venue change
 * notifies every registered attendee.
 */
export default function OrganizerEventDetails() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [banner, setBanner] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [venue, setVenue] = useState('');
  const [savingVenue, setSavingVenue] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState('');
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [tags, setTags] = useState({ speakers: '', services: '', sponsors: '' });
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getEvent(eventId)
      .then((data) => {
        if (cancelled) return;
        setEvent(data);
        setVenue(data.venue || '');
        setMaxAttendees(data.maxAttendees ?? '');
        setTags({
          speakers: (data.speakers || []).join(', '),
          services: (data.services || []).join(', '),
          sponsors: (data.sponsors || []).join(', '),
        });
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load the event')))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const handleBanner = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show the local file immediately; the upload is the slow part.
    setBanner(URL.createObjectURL(file));
    setUploading(true);
    try {
      const updated = await uploadEventBanner(eventId, file);
      setEvent(updated);
      setBanner(null);
      toast.success('Banner updated');
    } catch (err) {
      setBanner(null);
      toast.error(errorMessage(err, 'Could not upload the banner'));
    } finally {
      setUploading(false);
      // Let the same file be selected again after a failure.
      e.target.value = '';
    }
  };

  const handleVenue = async () => {
    if (!venue.trim()) {
      toast.warning('Enter a venue first');
      return;
    }
    setSavingVenue(true);
    try {
      const updated = await updateEventSchedule(eventId, { venue: venue.trim() });
      setEvent(updated);
      toast.success('Venue updated. Registered attendees were notified.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the venue'));
    } finally {
      setSavingVenue(false);
    }
  };

  const handleCapacity = async () => {
    const next = Number(maxAttendees);
    if (!next || next < 1) {
      toast.warning('Capacity must be at least 1');
      return;
    }
    if (next < (event.currentAttendees || 0)) {
      toast.warning(`Capacity cannot drop below the ${event.currentAttendees} already registered`);
      return;
    }

    setSavingCapacity(true);
    try {
      const updated = await updateEvent(eventId, { max_attendees: next });
      setEvent(updated);
      toast.success('Capacity updated');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update capacity'));
    } finally {
      setSavingCapacity(false);
    }
  };

  const handleTags = async () => {
    setSavingTags(true);
    try {
      const updated = await updateEventTags(eventId, {
        speakers: split(tags.speakers),
        services: split(tags.services),
        sponsors: split(tags.sponsors),
      });
      setEvent(updated);
      setTags({
        speakers: (updated.speakers || []).join(', '),
        services: (updated.services || []).join(', '),
        sponsors: (updated.sponsors || []).join(', '),
      });
      toast.success('Details merged');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update details'));
    } finally {
      setSavingTags(false);
    }
  };

  if (loading) return <PageLoading label="Loading event" />;
  if (error || !event) return <PageError message={error || 'Event not found.'} />;

  return (
    <div className="app-page">
      <div className="container">
        <Link to="/organizer/events" className="eyebrow">
          ← My events
        </Link>

        <PageHeader
          eyebrow={`Event · ${event.category}`}
          title={event.eventName}
          actions={
            <>
              <StatusTag status={event.status} />
              <Button to={`/eventDetails/${event.id}`} variant="hairline" size="sm">
                Public view
              </Button>
            </>
          }
        />

        {event.cancellationReason && (
          <Notice tone="alert">
            This event was cancelled: {event.cancellationReason}
          </Notice>
        )}

        <div className="split" style={{ alignItems: 'start' }}>
          {/* Left: the listing as attendees will see it. */}
          <div>
            <div style={{ position: 'relative' }}>
              <img
                className="card__media"
                src={banner || event.banner || '/images/banner.webp'}
                alt=""
                style={{ borderRadius: 'var(--radius)', minHeight: 220 }}
              />
              <label
                htmlFor="bannerUpload"
                className="btn btn--outline btn--sm"
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  cursor: uploading ? 'progress' : 'pointer',
                }}
              >
                {uploading ? 'Uploading…' : 'Change banner'}
              </label>
              <input
                id="bannerUpload"
                type="file"
                accept="image/*"
                className="visually-hidden"
                disabled={uploading}
                onChange={handleBanner}
              />
            </div>

            {event.description && (
              <p className="t-serif u-iron measure" style={{ marginTop: 'var(--spacing-24)' }}>
                {event.description}
              </p>
            )}

            <div style={{ marginTop: 'var(--spacing-32)' }}>
              <SectionLabel>Details</SectionLabel>
              <div style={{ marginTop: 'var(--spacing-16)' }}>
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
                      key: 'Registered',
                      value: `${event.currentAttendees ?? 0} / ${event.maxAttendees ?? '—'}`,
                    },
                    { key: 'Visibility', value: event.eventType },
                    {
                      key: 'Entry',
                      value: event.ticketsRequired ? `Ticketed · ₹${event.price}` : 'Free',
                    },
                  ]}
                />
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-32)' }}>
              <SectionLabel>Included</SectionLabel>
              <div className="tag-list" style={{ marginTop: 'var(--spacing-12)' }}>
                {TAG_FIELDS.flatMap(([key, label]) =>
                  (event[key] || []).map((item) => <Tag key={`${key}-${item}`} plain>{label.slice(0, -1)}: {item}</Tag>)
                )}
                {!TAG_FIELDS.some(([key]) => event[key]?.length > 0) && (
                  <span className="t-body-sm u-smoke">Nothing added yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* Right: three separate, explicitly saved adjustments. */}
          <div className="stack">
            <div className="card">
              <SectionLabel>Change venue</SectionLabel>
              <div style={{ marginTop: 'var(--spacing-16)' }}>
                <Input
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  aria-label="Venue"
                />
              </div>
              <p className="field__hint">
                Changing the venue notifies everyone already registered.
              </p>
              <div style={{ marginTop: 'var(--spacing-16)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={savingVenue || venue === event.venue}
                  onClick={handleVenue}
                >
                  {savingVenue ? 'Saving…' : 'Save venue'}
                </Button>
              </div>
            </div>

            <div className="card">
              <SectionLabel>Raise capacity</SectionLabel>
              <div style={{ marginTop: 'var(--spacing-16)' }}>
                <Input
                  type="number"
                  min="1"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  aria-label="Maximum attendees"
                />
              </div>
              <p className="field__hint">
                You can raise the limit, but not lower it below the{' '}
                {event.currentAttendees || 0} already registered.
              </p>
              <div style={{ marginTop: 'var(--spacing-16)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={savingCapacity || Number(maxAttendees) === event.maxAttendees}
                  onClick={handleCapacity}
                >
                  {savingCapacity ? 'Saving…' : 'Save capacity'}
                </Button>
              </div>
            </div>

            <div className="card">
              <SectionLabel>Merge extra detail</SectionLabel>
              <div className="stack" style={{ marginTop: 'var(--spacing-16)' }}>
                {TAG_FIELDS.map(([key, label]) => (
                  <Textarea
                    key={key}
                    label={label}
                    rows={2}
                    value={tags[key]}
                    onChange={(e) => setTags((t) => ({ ...t, [key]: e.target.value }))}
                  />
                ))}
              </div>
              <p className="field__hint">
                New entries are added to the existing list; nothing is removed.
              </p>
              <div style={{ marginTop: 'var(--spacing-16)' }}>
                <Button variant="primary" size="sm" disabled={savingTags} onClick={handleTags}>
                  {savingTags ? 'Saving…' : 'Merge details'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}