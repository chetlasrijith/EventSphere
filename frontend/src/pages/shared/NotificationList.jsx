import React, { useEffect, useState } from 'react';
import { listNotifications } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { timeAgo } from '../../utils/format';
import PageHeader, { Segmented } from '../../components/ui/PageHeader';
import {
  Tag,
  EmptyState,
  PageLoading,
  PageError,
  Notice,
} from '../../components/ui/Surface';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
];

/**
 * Notification inbox, shared by all three roles.
 *
 * Entries expand in place rather than linking out to a separate detail route,
 * so there is no second page to keep in sync.
 *
 * The API scopes each inbox to its owner. The old organizer handler queried the
 * whole collection with no filter, so any organizer saw every notification.
 */
export default function NotificationList({ role }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    listNotifications(role, { page_size: 50 })
      .then((data) => !cancelled && setNotifications(data.items || []))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load notifications')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [role]);

  if (loading) return <PageLoading label="Loading notifications" />;
  if (error) return <PageError message={error} />;

  const visible =
    filter === 'unread' ? notifications.filter((item) => !item.read) : notifications;
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="app-page">
      <div className="container container--reading">
        <PageHeader eyebrow="Inbox" title="Notifications">
          {unreadCount > 0
            ? `${unreadCount} unread ${unreadCount === 1 ? 'message' : 'messages'}.`
            : 'You are all caught up.'}
        </PageHeader>

        {notifications.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-24)' }}>
            <Segmented
              items={FILTERS}
              value={filter}
              onChange={setFilter}
              ariaLabel="Filter notifications"
            />
          </div>
        )}

        {notifications.length === 0 ? (
          <EmptyState eyebrow="Quiet" title="No notifications yet.">
            Messages about your events, registrations and account will appear
            here.
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState eyebrow="Caught up" title="Nothing unread.">
            Switch back to “All” to read your earlier messages.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            {visible.map((item) => {
              const open = openId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`inbox-item ${item.read ? '' : 'inbox-item--unread'}`}
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : item.id)}
                >
                  <span className="inbox-item__head">
                    <span>
                      <span className="inbox-item__subject t-body u-ink">
                        {item.subject || 'Notification'}
                      </span>
                      <span
                        className="t-body-sm u-smoke"
                        style={{ display: 'block', marginTop: 4 }}
                      >
                        {item.senderName ? `From ${item.senderName} · ` : ''}
                        {timeAgo(item.createdAt)}
                      </span>
                    </span>
                    {!item.read && <Tag tone="unread">New</Tag>}
                  </span>

                  {open && <span className="inbox-item__body u-pre-wrap">{item.message}</span>}
                </button>
              );
            })}
          </div>
        )}

        {!error && role === 'organizer' && (
          <Notice tone="plain">
            <span className="t-body-sm u-smoke">
              Only notifications addressed to you appear in this inbox.
            </span>
          </Notice>
        )}
      </div>
    </div>
  );
}