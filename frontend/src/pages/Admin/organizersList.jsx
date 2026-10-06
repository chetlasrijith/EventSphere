import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { listOrganizers, deleteOrganizer } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import {
  EmptyState,
  PageLoading,
  Notice,
  Pagination,
  Tag,
} from '../../components/ui/Surface';

/** Circle avatar with an initials fallback, so a missing photo still reads. */
function Avatar({ src, name = '', size = 48 }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (src) {
    return (
      <img
        className="avatar"
        src={src}
        alt=""
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }

  return (
    <span
      className="avatar avatar--stamp"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initials || '—'}
    </span>
  );
}

export default function OrganizersList() {
  const [organizers, setOrganizers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    listOrganizers({ page, page_size: 9 })
      .then((data) => {
        if (cancelled) return;
        setOrganizers(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load organizers')))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [page]);

  const handleDelete = async (organizerId, username) => {
    if (!window.confirm(`Delete ${username} and all their events? This cannot be undone.`)) {
      return;
    }

    setBusyId(organizerId);
    try {
      await deleteOrganizer(organizerId);
      setOrganizers((prev) => prev.filter((o) => o.id !== organizerId));
      toast.success(`${username} deleted`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the organizer'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="app-page">
      <div className="container">
        <PageHeader eyebrow="Admin" title="Organizers">
          Every organizer account on the platform. Deleting an account also
          removes the events they created.
        </PageHeader>

        {error && <Notice tone="alert">{error}</Notice>}

        {loading ? (
          <PageLoading label="Loading organizers" />
        ) : organizers.length === 0 ? (
          <EmptyState
            eyebrow="Empty"
            title="No organizers registered yet."
            action={
              <Button to="/organizer/signup" variant="outline">
                Share the organizer signup
              </Button>
            }
          >
            Organizer accounts appear here as soon as someone signs up.
          </EmptyState>
        ) : (
          <div className="grid grid--3">
            {organizers.map((organizer) => (
              <article className="card card--flush" key={organizer.id}>
                <img
                  className="card__media-sm"
                  src={organizer.coverImage || '/images/banner.webp'}
                  alt=""
                  loading="lazy"
                />

                <div className="card__body">
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--spacing-16)',
                      alignItems: 'center',
                    }}
                  >
                    <Avatar src={organizer.profileImg} name={organizer.username} size={56} />
                    <div style={{ minWidth: 0 }}>
                      <h2 className="card__title u-truncate">{organizer.username}</h2>
                      <p className="t-body-sm u-smoke u-truncate">{organizer.email}</p>
                    </div>
                  </div>

                  <div style={{ marginTop: 'var(--spacing-16)' }}>
                    <Tag>{organizer.eventCount ?? 0} events</Tag>
                  </div>

                  <p className="t-body-sm u-iron" style={{ marginTop: 'var(--spacing-12)' }}>
                    {[organizer.city, organizer.state, organizer.country].filter(Boolean).join(', ') ||
                      'No location on file'}
                  </p>

                  <div
                    className="btn-row"
                    style={{
                      marginTop: 'var(--spacing-16)',
                      paddingTop: 'var(--spacing-16)',
                      borderTop: '1px solid var(--color-hairline)',
                    }}
                  >
                    <Button
                      to={`/admin/organizerProfile/${organizer.id}`}
                      variant="outline"
                      size="sm"
                    >
                      View profile
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busyId === organizer.id}
                      onClick={() => handleDelete(organizer.id, organizer.username)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </div>
    </div>
  );
}