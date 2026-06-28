import { useEffect, useId, useRef, useState } from "react";
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
// <select> popups are OS-rendered and can't be themed). Keyboard-operable:
// arrows move the active option, Enter selects, Esc/Tab close.
function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  // Index of the keyboard-highlighted option while open (-1 when closed).
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const menuId = `${baseId}-menu`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  function openMenu() {
    const selected = options.findIndex((o) => o.value === value);
    setActiveIndex(selected >= 0 ? selected : 0);
    setOpen(true);
  }
  function closeMenu() {
    setOpen(false);
    setActiveIndex(-1);
  }
  function select(v: T) {
    onChange(v);
    closeMenu();
  }

  // Close on outside click or Escape while open.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeMenu();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Keep the highlighted option scrolled into view as it changes.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document
      .getElementById(`${baseId}-opt-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, baseId]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const opt = options[activeIndex];
        if (opt) select(opt.value);
        break;
      }
      case "Escape":
        e.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu();
        break;
    }
  }

  const current = options.find((o) => o.value === value);

  return (
    <div className="select" ref={ref}>
      <button
        type="button"
        id={triggerId}
        className="select-trigger"
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
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
        <ul
          className="select-menu"
          id={menuId}
          role="listbox"
          aria-labelledby={triggerId}
        >
          {options.map((option, i) => {
            const selected = option.value === value;
            return (
              <li
                key={String(option.value)}
                id={optionId(i)}
                role="option"
                aria-selected={selected}
                className={`select-option ${selected ? "is-selected" : ""} ${
                  i === activeIndex ? "is-active" : ""
                }`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => select(option.value)}
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
