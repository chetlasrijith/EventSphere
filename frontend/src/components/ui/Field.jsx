/**
 * Form field primitives.
 *
 * Labels are set in the monospace labelling system at 12px — the theme treats
 * form labels as print captions, not as headings. Everything is uncontrolled-
 * friendly: pass `value` + `onChange` and the invalid state is derived from the
 * `error` prop rather than tracked separately.
 */
import { useId } from 'react';

export function Field({ label, error, hint, htmlFor, children, className = '' }) {
  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="field__hint">{hint}</p>}
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}

export function Input({ label, error, hint, className = '', id, ...rest }) {
  const generated = useId();
  const inputId = id || generated;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId} className={className}>
      <input
        id={inputId}
        className="input"
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />
    </Field>
  );
}

export function Textarea({ label, error, hint, className = '', id, rows = 4, ...rest }) {
  const generated = useId();
  const inputId = id || generated;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId} className={className}>
      <textarea
        id={inputId}
        rows={rows}
        className="textarea"
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />
    </Field>
  );
}

export function Select({ label, error, hint, className = '', id, children, ...rest }) {
  const generated = useId();
  const inputId = id || generated;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId} className={className}>
      <select
        id={inputId}
        className="select"
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
}

/** Square checkbox / radio in the theme's 4px language. */
export function Check({ type = 'checkbox', label, checked, onChange, disabled, name, value }) {
  return (
    <label
      className={[
        'check',
        type === 'radio' ? 'check--radio' : '',
        checked ? 'check--checked' : '',
        disabled ? 'check--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={!!checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="check__box" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

/** Search input with an attached action button. */
export function SearchBar({ value, onChange, onSubmit, placeholder, actionLabel = 'Search' }) {
  return (
    <form
      className="searchbar"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
    >
      <input
        className="input"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <button className="btn btn--primary" type="submit">
        {actionLabel}
      </button>
    </form>
  );
}