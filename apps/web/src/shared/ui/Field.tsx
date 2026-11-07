import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Field as FieldRoot, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

/** Rótulo + campo + ayuda + error (Field de shadcn), todo conectado para lectores de pantalla. */
export function Field({ label, hint, error, id, ...props }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <FieldRoot data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input id={inputId} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />
      {hint && <FieldDescription id={hintId}>{hint}</FieldDescription>}
      {/* Sin role="alert": el error del formulario ya se anuncia arriba; acá solo se describe el campo. */}
      {error && (
        <FieldError id={errorId} role={undefined}>
          {error}
        </FieldError>
      )}
    </FieldRoot>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string };

/** Igual que Field, para textos largos (notas, voluntades anticipadas). */
export function TextareaField({ label, hint, error, id, ...props }: TextareaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <FieldRoot data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Textarea id={inputId} rows={3} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />
      {hint && <FieldDescription id={hintId}>{hint}</FieldDescription>}
      {error && (
        <FieldError id={errorId} role={undefined}>
          {error}
        </FieldError>
      )}
    </FieldRoot>
  );
}
