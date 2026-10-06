import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { issueTicket } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, PageError, SectionLabel } from '../../components/ui/Surface';

/**
 * Ticket view, shown straight after registering.
 *
 * The booking id and secret code come from the server. Previously both were
 * generated in the browser and POSTed, which meant the client chose its own
 * booking id.
 */
export default function Ticket() {
  const { state } = useLocation();
  const event = state?.event;
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!event?.id && !event?._id) return undefined;

    const eventId = event.id ?? event._id;
    let cancelled = false;

    issueTicket(eventId)
      .then((data) => !cancelled && setTicket(data))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load your ticket')))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [event]);

  if (!event) {
    return (
      <div className="app-page">
        <div className="container">
          <EmptyState
            eyebrow="No ticket"
            title="There is no ticket to show."
            action={
              <Button to="/attendee/search-events" variant="primary">
                Browse events
              </Button>
            }
          >
            Register for an event first — the ticket is issued at that point.
          </EmptyState>
        </div>
      </div>
    );
  }

  if (error) return <PageError message={error} />;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-page">
      <div className="container">
        <PageHeader eyebrow="Confirmed" title="Your ticket" align="center">
          Present this code at the entrance. A copy also lives in My tickets.
        </PageHeader>

        <div className="ticket" id="ticket-section">
          <div className="ticket__media">
            <img src={event.banner || '/images/banner.webp'} alt="" />
            <span className="ticket__scrim" aria-hidden="true" />
            <h2 className="ticket__title">{event.eventName}</h2>
          </div>

          <div className="ticket__main">
            <div>
              <SectionLabel>When</SectionLabel>
              <p className="t-body u-ink" style={{ marginTop: 'var(--spacing-8)' }}>
                {formatDate(event.startDate)}
              </p>

              <p className="t-body-sm u-graphite" style={{ marginTop: 'var(--spacing-8)' }}>
                {event.venue}
                {event.city ? `, ${event.city}` : ''}
              </p>
            </div>

            <div className="ticket__qr">
              {ticket ? (
                <QRCodeCanvas
                  value={ticket.qrCodeValue || `${ticket.bookingId}:${ticket.secretCode}`}
                  size={132}
                  bgColor="#ffffff"
                  fgColor="#111111"
                />
              ) : (
                <div style={{ width: 132, height: 132 }} className="loading">
                  <span className="loading__text">{loading ? 'Issuing' : 'Ready'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="ticket__stub">
            <div>
              <SectionLabel>Booking id</SectionLabel>
              <span className="ticket__code">{ticket?.bookingId || '—'}</span>
            </div>
            <div>
              <SectionLabel>Secret code</SectionLabel>
              <span className="ticket__code">{ticket?.secretCode || '—'}</span>
            </div>
            <img src="/images/logo.jpg" alt="EventSphere" style={{ width: 56, opacity: 0.8 }} />
          </div>
        </div>

        <div className="btn-row no-print" style={{ marginTop: 'var(--spacing-32)', justifyContent: 'center' }}>
          <Button variant="primary" onClick={handlePrint} disabled={!ticket}>
            Print ticket
          </Button>
          <Button to="/attendee/myevent-list" variant="outline">
            Back to my events
          </Button>
        </div>
      </div>
    </div>
  );
}