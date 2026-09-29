import type { ReactNode } from 'react';

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: ReactNode;
  disabled?: boolean;
  name?: string;
}

/** Compact switch used for boolean settings. */
export function Toggle({ label, checked, onChange, hint, disabled, name }: ToggleProps) {
  return (
    <label className="flex items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          name={name}
          role="switch"
          aria-checked={checked}
          aria-label={label}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`block h-5 w-9 rounded-full transition-colors ${
            checked ? 'bg-primary' : 'bg-slate-300'
          } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          aria-hidden
        />
        <span
          className={`pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
          aria-hidden
        />
      </span>
    </label>
  );
}

export default Toggle;
