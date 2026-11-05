'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes } from 'react';
import styles from './ui.module.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  error?: string;
  /** Si se indica, muestra el requisito y lo marca en vivo cuando se cumple. */
  minLength?: number;
};

export function PasswordField({ label, error, minLength, id, onChange, ...props }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  const [length, setLength] = useState(0);
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [minLength ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      <label className="label" htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.passwordWrap}>
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            setLength(e.target.value.length);
            onChange?.(e);
          }}
          {...props}
        />
        <button
          type="button"
          className={styles.reveal}
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
        </button>
      </div>
      {minLength && (
        <span id={hintId} className={styles.requirement} data-ok={length >= minLength ? 'true' : 'false'}>
          Al menos {minLength} caracteres
        </span>
      )}
      {error && (
        <span id={errorId} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
