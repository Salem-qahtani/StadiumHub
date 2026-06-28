import { useId } from "react";
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import "./Field.css";

type BaseProps = {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

function Label({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="field-label" htmlFor={htmlFor}>
      {label}
      {required && <span className="field-required"> *</span>}
    </label>
  );
}

function Helper({ error, hint, id }: { error?: string; hint?: string; id: string }) {
  if (error) {
    return (
      <span className="field-error" id={id} role="alert">
        {error}
      </span>
    );
  }
  if (hint) {
    return (
      <span className="field-hint" id={id}>
        {hint}
      </span>
    );
  }
  return null;
}

type TextFieldProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

export function TextField({
  label,
  error,
  hint,
  required,
  className = "",
  ...rest
}: TextFieldProps) {
  const id = useId();
  const helperId = `${id}-help`;
  return (
    <div className="field">
      <Label htmlFor={id} label={label} required={required} />
      <input
        id={id}
        className={`field-input ${error ? "has-error" : ""} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error || hint ? helperId : undefined}
        {...rest}
      />
      <Helper error={error} hint={hint} id={helperId} />
    </div>
  );
}

type TextAreaProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export function TextArea({
  label,
  error,
  hint,
  required,
  className = "",
  ...rest
}: TextAreaProps) {
  const id = useId();
  const helperId = `${id}-help`;
  return (
    <div className="field">
      <Label htmlFor={id} label={label} required={required} />
      <textarea
        id={id}
        className={`field-input field-textarea ${error ? "has-error" : ""} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error || hint ? helperId : undefined}
        {...rest}
      />
      <Helper error={error} hint={hint} id={helperId} />
    </div>
  );
}

// Generic wrapper for non-input controls (e.g. a custom date row) that still
// want a label + error in the same visual rhythm.
export function FieldGroup({
  label,
  error,
  hint,
  required,
  children,
}: BaseProps & { children: ReactNode }) {
  const id = useId();
  return (
    <div className="field">
      <span className="field-label">
        {label}
        {required && <span className="field-required"> *</span>}
      </span>
      {children}
      <Helper error={error} hint={hint} id={`${id}-help`} />
    </div>
  );
}
