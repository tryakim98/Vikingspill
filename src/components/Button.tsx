import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn--${variant}`, className].filter(Boolean).join(' ');
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
