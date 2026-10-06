/**
 * Page header.
 *
 * Every route opens with a mono eyebrow, a 300-weight headline and an optional
 * serif sub-line — the same shape on every screen so the app reads as one
 * publication rather than a pile of pages.
 */
export default function PageHeader({ eyebrow, title, children, actions, align = 'start' }) {
  const centered = align === 'center';

  return (
    <header
      className="page-head"
      style={centered ? { textAlign: 'center' } : undefined}
    >
      {eyebrow && <span className="eyebrow page-head__eyebrow">{eyebrow}</span>}
      <div className="page-head__row">
        <div style={centered ? { marginInline: 'auto' } : undefined}>
          <h1 className="t-heading-lg">{title}</h1>
          {children && <div className="page-head__sub t-body">{children}</div>}
        </div>
        {actions && <div className="page-head__actions">{actions}</div>}
      </div>
    </header>
  );
}

/** Compact page header for dense screens that only need a label + action. */
export function SectionHead({ eyebrow, title, children, action }) {
  return (
    <div className="page-head__row" style={{ marginBottom: 'var(--spacing-32)' }}>
      <div>
        {eyebrow && <span className="eyebrow page-head__eyebrow">{eyebrow}</span>}
        <h2 className="t-heading-sm">{title}</h2>
        {children && <p className="t-body-sm u-graphite" style={{ marginTop: 'var(--spacing-8)' }}>{children}</p>}
      </div>
      {action && <div className="page-head__actions">{action}</div>}
    </div>
  );
}

/** Filter tabs. The 2px ink underline is the only state indicator. */
export function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          className={`tab ${value === item.value ? 'tab--active' : ''}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** Segmented control — hairline box, ink fill on the active segment. */
export function Segmented({ items, value, onChange, ariaLabel }) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={`segmented__item ${value === item.value ? 'segmented__item--active' : ''}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}