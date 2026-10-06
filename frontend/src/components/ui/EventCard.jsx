import { Link } from 'react-router-dom';
import { formatDate, formatPrice } from '../../utils/format';
import { Tag, StatusTag } from './Surface';

/**
 * Event card — used by the homepage, search results, the organizer's event
 * list and the attendee's registrations.
 *
 * Structure follows the theme's product card: media on top, mono category tag,
 * 300-weight title, hairline meta rows, and a footer split between price and
 * an arrow link. The whole card is the link target so the pointer and the
 * keyboard both land in the same place.
 */
export default function EventCard({ event, to, showStatus = false }) {
  if (!event) return null;

  const href = to || `/eventDetails/${event.id}`;
  const soldOut = event.ticketsRequired && event.currentAttendees >= event.maxAttendees;

  return (
    <article className="event-card">
      <Link to={href} className="event-card__media" aria-hidden="true" tabIndex={-1}>
        <img
          className="card__media"
          src={event.banner || '/images/banner.webp'}
          alt=""
          loading="lazy"
        />
        <span className="event-card__badge">
          {showStatus ? <StatusTag status={event.status} /> : <Tag>{event.category}</Tag>}
        </span>
      </Link>

      <div className="event-card__body">
        <h3 className="event-card__title">
          <Link to={href}>{event.eventName}</Link>
        </h3>

        <p className="event-card__meta u-iron">
          <span>{formatDate(event.startDate)}</span>
          {event.city && (
            <>
              <span className="u-silver" aria-hidden="true">
                /
              </span>
              <span>{event.city}</span>
            </>
          )}
        </p>

        {event.description && (
          <p className="t-body-sm u-graphite u-truncate">{event.description}</p>
        )}

        <div className="event-card__footer">
          <span className="event-card__price">
            {event.ticketsRequired ? (
              <>
                <strong className="u-ink">{formatPrice(event.price)}</strong>
                {soldOut ? (
                  <span className="u-smoke"> · Sold out</span>
                ) : typeof event.currentAttendees === 'number' ? (
                  <span className="u-smoke">
                    {' '}
                    · {event.currentAttendees}/{event.maxAttendees}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="u-smoke">Free entry</span>
            )}
          </span>

          <Link to={href} className="event-card__link">
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}