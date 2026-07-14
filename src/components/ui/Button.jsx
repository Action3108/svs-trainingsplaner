export default function Button({
  variant = 'primary',
  block = false,
  type = 'button',
  children,
  className = '',
  ...rest
}) {
  const classes = [
    'svs-btn',
    `svs-btn--${variant}`,
    block ? 'svs-btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
