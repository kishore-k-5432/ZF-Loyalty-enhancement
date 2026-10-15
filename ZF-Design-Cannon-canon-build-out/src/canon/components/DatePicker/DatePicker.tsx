import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Icon } from '../../icons';
import { Text } from '../../primitives';
import { cn } from '../../utils/cn';
import { MENU_SURFACE } from '../Menu/Menu';

/**
 * DATE PICKER — pick one calendar day from a month grid.
 *
 * ── WHY NOT `InputField format="date"` ───────────────────────────────────────
 * That field masks typed digits, which is right for a date the user already
 * knows. A program window or an expiry cutoff is chosen by LOOKING at a
 * calendar — which weekday, how far from today — so this is a separate control.
 * It stays the same 34 box as `InputField` and `Select`, so all three sit on
 * one form row as one kit.
 *
 * ── WHY NOT A NATIVE `<input type="date">` ──────────────────────────────────
 * The OS paints the popup, so it cannot match the field beside it, and its
 * display format follows the browser locale rather than the product's
 * `27 Aug 2024`. The same reason `Select` is not a native `<select>`.
 *
 * ── THE PATTERN ─────────────────────────────────────────────────────────────
 * ARIA APG "Date Picker Dialog": a button opens a `dialog` holding a `grid`.
 * One day is tabbable at a time (roving tabindex). Arrows move a day or a week,
 * Home/End go to the start or end of the week, PageUp/PageDown change the month
 * (with Shift, the year), Enter/Space choose, and Escape closes and returns
 * focus to the trigger without changing the value.
 *
 * ── THE VALUE IS AN ISO DATE STRING ─────────────────────────────────────────
 * `YYYY-MM-DD`, or `''` for none. A `Date` carries a time and a timezone, and a
 * calendar day has neither — midnight UTC is the previous day in the Americas.
 *
 * ── NO CALENDAR GLYPH, ON PURPOSE ───────────────────────────────────────────
 * `calendar` is in `RETIRED_ICON_NAMES`: no glyph exists in the roster. The
 * trigger uses `caret-down`, the same affordance as `Select`, until one lands.
 */
export interface DatePickerProps {
  /** `YYYY-MM-DD`, or `''` for no date. Controlled. */
  value: string;
  onChange: (next: string) => void;
  /** Shown when there is no value, in `text/tertiary` like every other field. */
  placeholder?: string;
  /** Earliest choosable day, `YYYY-MM-DD`. Days before it are disabled. */
  min?: string;
  /** Latest choosable day, `YYYY-MM-DD`. */
  max?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  /** Only when no visible `<label for>` points at the trigger. */
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Ymd = { y: number; m: number; d: number };

function parse(iso: string): Ymd | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!r) return null;
  return { y: Number(r[1]), m: Number(r[2]) - 1, d: Number(r[3]) };
}
const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (t: Ymd) => `${t.y}-${pad(t.m + 1)}-${pad(t.d)}`;
//  Local-time arithmetic only, so a day never slips across a timezone.
const fromDate = (dt: Date): Ymd => ({ y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() });
const addDays = (t: Ymd, n: number) => fromDate(new Date(t.y, t.m, t.d + n));
const addMonths = (t: Ymd, n: number) => {
  //  31 Jan + 1 month is 28/29 Feb, not 3 Mar — clamp to the target month.
  const last = new Date(t.y, t.m + n + 1, 0).getDate();
  return fromDate(new Date(t.y, t.m + n, Math.min(t.d, last)));
};
const today = () => fromDate(new Date());

/** `27 Aug 2024` — the product's display format. */
export function formatDisplayDate(iso: string): string {
  const t = parse(iso);
  return t ? `${t.d} ${MONTHS[t.m].slice(0, 3)} ${t.y}` : '';
}

export function DatePicker({
  value, onChange, placeholder = 'dd MMM yyyy', min, max, id, required, disabled,
  error, ariaLabel, ariaDescribedBy, className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parse(value);
  const [focus, setFocus] = useState<Ymd>(selected ?? today());
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const dialogId = useId();

  const isoFocus = toIso(focus);
  const outOfRange = (iso: string) => Boolean((min && iso < min) || (max && iso > max));

  const openPanel = () => {
    if (disabled) return;
    setFocus(selected ?? today());
    setOpen(true);
  };

  const close = useCallback(() => {
    setOpen(false);
    btnRef.current?.focus();
  }, []);

  //  Placement, as `Select` does it: a layout effect so the panel never paints
  //  at 0,0, flipped above when there is no room below, and repositioned on a
  //  capture-phase scroll because the settings body is a scroller and the
  //  panel is `fixed`.
  useLayoutEffect(() => {
    if (!open) { setPos(null); return undefined; }
    const place = () => {
      const t = btnRef.current?.getBoundingClientRect();
      const h = panelRef.current?.offsetHeight ?? 0;
      if (!t) return;
      const below = t.bottom + 4;
      const flip = below + h > window.innerHeight && t.top - 4 - h > 0;
      setPos({ top: flip ? t.top - 4 - h : below, left: t.left });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  //  A click outside closes WITHOUT returning focus — the user is going
  //  somewhere else, and yanking focus back would fight them.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  //  Roving focus: whenever the focused day changes, the DOM focus follows it.
  useEffect(() => {
    if (!open || !pos) return;
    panelRef.current
      ?.querySelector<HTMLButtonElement>(`[data-iso="${isoFocus}"]`)
      ?.focus();
  }, [open, pos, isoFocus]);

  const choose = (iso: string) => {
    if (outOfRange(iso)) return;
    onChange(iso);
    close();
  };

  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const dow = new Date(focus.y, focus.m, focus.d).getDay();
    const moves: Record<string, () => Ymd> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -dow),
      End: () => addDays(focus, 6 - dow),
      PageUp: () => addMonths(focus, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, e.shiftKey ? 12 : 1),
    };
    if (moves[e.key]) {
      e.preventDefault();
      setFocus(moves[e.key]());
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(isoFocus);
    }
  };

  const onPanelKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      //  Stopped here so the settings bar's document-level Escape does not
      //  also fire and leave the settings surface.
      e.stopPropagation();
      e.preventDefault();
      close();
    }
  };

  //  Six rows, always — a month that needs five would otherwise make the
  //  panel change height as you page through, and the footer would jump.
  const first = new Date(focus.y, focus.m, 1);
  const start = addDays({ y: focus.y, m: focus.m, d: 1 }, -first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));
  const isoToday = toIso(today());

  const navBtn = cn(
    'grid place-items-center size-12 rounded-md border-0 bg-transparent cursor-pointer',
    'text-icon-default hover:bg-surface-hover active:bg-surface-pressed',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
  );

  return (
    <>
      <button
        ref={btnRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        aria-invalid={error || undefined}
        aria-describedby={ariaDescribedBy}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); openPanel(); }
        }}
        className={cn(
          //  The InputField box, to the class — same as `Select`.
          'inline-flex items-center gap-5 h-control px-5 w-full',
          'rounded-md border bg-surface-default transition-colors text-start',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          disabled
            ? 'bg-surface-disabled border-border-disabled cursor-not-allowed'
            : error
              ? 'border-danger-default focus-visible:outline-danger-default'
              : cn('border-border-default not-focus:hover:border-border-hover cursor-pointer',
                'focus:border-focus-ring focus-visible:outline-focus-ring',
                open && 'border-focus-ring'),
          className,
        )}
      >
        <Text
          as="span"
          size="body"
          tone={disabled ? 'disabled' : selected ? 'default' : 'tertiary'}
          truncate
          className="flex-1 min-w-0"
        >
          {selected ? formatDisplayDate(value) : placeholder}
        </Text>
        <Icon name="caret-down" size="md" tone={disabled ? 'disabled' : 'subtle'} />
      </button>

      {open && !disabled ? (
        <div
          ref={panelRef}
          id={dialogId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          onKeyDown={onPanelKey}
          className={cn('fixed z-100', MENU_SURFACE)}
          style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
        >
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                className={navBtn}
                aria-label="Previous month"
                onClick={() => setFocus(addMonths(focus, -1))}
              >
                <Icon name="chevron-left" size="sm" tone="inherit" />
              </button>
              <Text id={titleId} as="h2" size="body" weight="semibold" aria-live="polite">
                {`${MONTHS[focus.m]} ${focus.y}`}
              </Text>
              <button
                type="button"
                className={navBtn}
                aria-label="Next month"
                onClick={() => setFocus(addMonths(focus, 1))}
              >
                <Icon name="chevron-right" size="sm" tone="inherit" />
              </button>
            </div>

            <div role="grid" aria-labelledby={titleId} onKeyDown={onGridKey} className="flex flex-col gap-1">
              <div role="row" className="grid grid-cols-7">
                {WEEKDAYS.map((w) => (
                  <Text
                    key={w}
                    as="span"
                    role="columnheader"
                    size="body-sm"
                    tone="tertiary"
                    className="grid place-items-center size-16"
                  >
                    {w.slice(0, 2)}
                  </Text>
                ))}
              </div>
              {weeks.map((week) => (
                <div key={toIso(week[0])} role="row" className="grid grid-cols-7">
                  {week.map((day) => {
                    const iso = toIso(day);
                    const inMonth = day.m === focus.m;
                    const isSel = iso === value;
                    const isToday = iso === isoToday;
                    const off = outOfRange(iso);
                    return (
                      <span key={iso} role="gridcell" aria-selected={isSel}>
                        <button
                          type="button"
                          data-iso={iso}
                          tabIndex={iso === isoFocus ? 0 : -1}
                          disabled={off}
                          aria-label={`${day.d} ${MONTHS[day.m]} ${day.y}${isToday ? ', today' : ''}`}
                          aria-current={isToday ? 'date' : undefined}
                          onClick={() => choose(iso)}
                          className={cn(
                            'grid place-items-center size-16 rounded-md border text-body',
                            'transition-colors motion-reduce:transition-none',
                            'focus-visible:outline-2 focus-visible:outline-offset-1',
                            //  Each state owns every colour property, so no two
                            //  utilities race for one property — see SettingsNav.
                            isSel
                              //  `/hover`, not `/default`: a fill holding text.
                              ? 'bg-primary-hover text-primary-on-primary font-semibold border-transparent cursor-pointer focus-visible:outline-focus-ring'
                              : off
                                ? 'bg-transparent text-text-disabled border-transparent cursor-not-allowed'
                                : cn(
                                  'bg-transparent cursor-pointer hover:bg-surface-hover active:bg-surface-pressed',
                                  'focus-visible:outline-focus-ring',
                                  inMonth ? 'text-text-default' : 'text-text-tertiary',
                                  isToday ? 'border-primary-border font-semibold' : 'border-transparent',
                                ),
                          )}
                        >
                          {day.d}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border-divider pt-4">
              <button
                type="button"
                disabled={outOfRange(isoToday)}
                onClick={() => choose(isoToday)}
                className={cn(
                  'h-button-sm px-3 rounded-md border-0 bg-transparent text-body cursor-pointer',
                  'text-primary-text hover:underline disabled:text-text-disabled disabled:no-underline disabled:cursor-not-allowed',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                )}
              >
                Today
              </button>
              {value && !required ? (
                <button
                  type="button"
                  onClick={() => { onChange(''); close(); }}
                  className={cn(
                    'h-button-sm px-3 rounded-md border-0 bg-transparent text-body cursor-pointer',
                    'text-text-secondary hover:underline',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                  )}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
