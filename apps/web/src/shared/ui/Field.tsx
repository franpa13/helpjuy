import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

/** Rótulo + campo + ayuda + error, todo conectado para lectores de pantalla. */
export function Field({ label, hint, error, id, ...props }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />
      {hint && (
        <span id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </span>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <span id={id} className="text-[15px] font-bold text-red">
      {children}
    </span>
  );
}
