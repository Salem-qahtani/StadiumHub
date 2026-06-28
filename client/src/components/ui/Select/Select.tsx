import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "../icons";
import "./Select.css";

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type SelectProps<T extends string | number> = {
  label?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

// Lightweight custom dropdown so the option list can be styled (native
// <select> popups are OS-rendered and can't be themed).
function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape while open.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div className="select" ref={ref}>
      <button
        type="button"
        className="select-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label && <span className="select-label">{label}</span>}
        <span className="select-value">{current?.label ?? "—"}</span>
        <span className={`select-caret ${open ? "is-open" : ""}`} aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="m6 9 6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <ul className="select-menu" role="listbox">
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li
                key={String(option.value)}
                role="option"
                aria-selected={selected}
                className={`select-option ${selected ? "is-selected" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="select-option-label">{option.label}</span>
                {selected && <CheckIcon size={16} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Select;
