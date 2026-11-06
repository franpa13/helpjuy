'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from './Field';

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
  const ok = minLength ? length >= minLength : false;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className="pr-14"
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
          className="absolute top-1/2 right-1.5 grid h-10 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted-foreground hover:text-ink"
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
        </button>
      </div>
      {minLength && (
        <span
          id={hintId}
          data-ok={ok ? 'true' : 'false'}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground before:size-2.5 before:rounded-full before:border-2 before:border-current before:content-[''] data-[ok=true]:font-bold data-[ok=true]:text-green data-[ok=true]:before:bg-current"
        >
          Al menos {minLength} caracteres
        </span>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
