import { Link } from 'react-router-dom';

/**
 * Buttons.
 *
 * Three voices, per the design system:
 *   primary  — solid black block, the anchor action
 *   outline  — white plate with a 1px ink border, high-emphasis secondary
 *   ghost    — text only, never filled
 *
 * `destructive` swaps ink for the warm oxide used by validation errors, so
 * confirmations still read without a second saturated colour entering the
 * system.
 */
const VARIANT_CLASS = {
  primary: 'btn--primary',
  outline: 'btn--outline',
  ghost: 'btn--ghost',
  hairline: 'btn--ghost-hairline',
  destructive: 'btn--danger',
};

const SIZE_CLASS = {
  sm: 'btn--sm',
  md: '',
  lg: 'btn--lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  arrow = false,
  block = false,
  className = '',
  to,
  href,
  type = 'button',
  disabled = false,
  ...rest
}) {
  const classes = [
    'btn',
    VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    SIZE_CLASS[size] || '',
    arrow ? 'btn-arrow' : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={disabled || undefined} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}