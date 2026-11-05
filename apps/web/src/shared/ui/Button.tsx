import type { ButtonHTMLAttributes } from 'react';
import styles from './ui.module.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'secondary' };

export function Button({ variant = 'primary', className, ...props }: Props) {
  const variantClass = variant === 'primary' ? '' : styles[variant];
  return <button className={[styles.button, variantClass, className].filter(Boolean).join(' ')} {...props} />;
}

export const buttonClass = (variant: 'primary' | 'danger' | 'secondary' = 'primary') =>
  [styles.button, variant === 'primary' ? '' : styles[variant]].filter(Boolean).join(' ');
