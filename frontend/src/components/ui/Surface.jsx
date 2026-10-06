/**
 * Surface, feedback and chrome primitives.
 *
 * Small enough to live in one module — they share a concern (the quiet
 * furniture every screen needs) and are imported far more often than they are
 * changed.
 */
import Button from './Button';

/** White plate with a hairline border. `warm` steps it to linen. */
export function Card({ children, className = '', ...rest }) {
  return (
    <div className={`card ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function CardFlush({ children, className = '', ...rest }) {
  return (
    <div className={`card card--flush ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

/** The mono badge system. */
export function Tag({ children, tone = '', plain = false, className = '' }) {
  return (
    <span
      className={`tag ${tone ? `tag--${tone}` : ''} ${plain ? 'tag--plain' : ''} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

/** Event status rendered as a tag. Kept here so every screen agrees. */
export function StatusTag({ status }) {
  const label = {
    pending: 'Pending',
    approved: 'Approved',
    cancelled: 'Cancelled',
    completed: 'Completed',
  }[status];
  if (!label) return null;
  return <Tag tone={status}>{label}</Tag>;
}

/** Inline message block. `alert` is the only coloured variant. */
export function Notice({ children, tone = '', className = '' }) {
  if (!children) return null;
  return (
    <p className={`notice ${tone ? `notice--${tone}` : ''} ${className}`.trim()}>{children}</p>
  );
}

export function EmptyState({ eyebrow, title, children, action }) {
  return (
    <div className="empty">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <p className="empty__title">{title}</p>
      {children && <p className="empty__body t-body-sm">{children}</p>}
      {action}
    </div>
  );
}

/** Loading state: an indeterminate hairline bar, never a spinner. */
export function Loading({ label = 'Loading' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="progress progress--indeterminate" />
      <span className="loading__text">{label}</span>
    </div>
  );
}

/** Page-level loading, centred inside the reading column. */
export function PageLoading({ label = 'Loading' }) {
  return (
    <div className="app-page">
      <div className="container">
        <Loading label={label} />
      </div>
    </div>
  );
}

/** Page-level error, same shape as loading so the swap is calm. */
export function PageError({ message, action }) {
  return (
    <div className="app-page">
      <div className="container container--narrow">
        <Notice tone="alert">{message}</Notice>
        {action && <div className="btn-row" style={{ marginTop: 'var(--spacing-16)' }}>{action}</div>}
      </div>
    </div>
  );
}

/** Key/value rows separated by hairlines. */
export function DataList({ rows }) {
  return (
    <div className="data">
      {rows
        .filter((row) => row && row.value !== undefined && row.value !== null && row.value !== '')
        .map((row) => (
          <div className="data__row" key={row.key}>
            <span className="data__key">{row.key}</span>
            <span className="data__value">{row.value}</span>
          </div>
        ))}
    </div>
  );
}

export function Pagination({ page, totalPages, total, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      <Button
        variant="hairline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </Button>
      <span className="pager__status">
        Page {page} of {totalPages}
        {total ? ` · ${total} total` : ''}
      </span>
      <Button
        variant="hairline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}

/** Section label used above panels and forms. */
export function SectionLabel({ children, className = '' }) {
  return <span className={`eyebrow ${className}`.trim()}>{children}</span>;
}

/** Horizontal image strip — decorative texture, never the hero. */
export function ImageStrip({ images }) {
  return (
    <div className="image-strip">
      {images.map((src, index) => (
        <img
          key={src + index}
          className="image-strip__tile"
          src={src}
          alt=""
          loading="lazy"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/** Product-screenshot panel: warm surround, white frame, no shadow. */
export function Screenshot({ label, tone = '', children }) {
  return (
    <figure className={`screenshot ${tone ? `screenshot--${tone}` : ''}`.trim()}>
      {label && (
        <figcaption className="eyebrow" style={{ marginBottom: 'var(--spacing-16)' }}>
          {label}
        </figcaption>
      )}
      <div className="screenshot__frame">
        <div className="screenshot__bar" aria-hidden="true">
          <span className="screenshot__dot" />
          <span className="screenshot__dot" />
          <span className="screenshot__dot" />
        </div>
        {children}
      </div>
    </figure>
  );
}

/** Numeric band. */
export function Stats({ items }) {
  return (
    <div className="stats">
      {items.map((item) => (
        <div key={item.label}>
          <span className="stat__value">{item.value}</span>
          <span className="stat__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}