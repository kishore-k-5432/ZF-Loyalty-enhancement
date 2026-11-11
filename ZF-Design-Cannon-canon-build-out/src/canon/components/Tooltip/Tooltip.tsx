import { useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { Text } from '../../primitives';

/**
 * A short explanation shown on hover — most often *why* a control is disabled.
 *
 * Drawn from the disabled-option reference: a `surface/inverse` bubble with
 * `text/inverse` body text, radius `lg`, the popover shadow, and a nose
 * pointing back at the pointer.
 *
 * **It follows the pointer, not the trigger's box.** The trigger it was made
 * for is a Checkbox whose box is as wide as its description, so a bubble
 * anchored to that box lands hundreds of pixels from the label being read.
 * Placed beside the pointer, it is always beside what the user is looking at.
 * It sits to the pointer's right (nose on its left) and flips to the left when
 * there is no room.
 *
 * **Rendered in a portal**, so a scrolling or clipped ancestor — the settings
 * body is both — cannot cut it off.
 *
 * **A disabled control is not focusable**, so a hover-only bubble would leave
 * keyboard and screen-reader users without the reason. The same text is
 * therefore also in the trigger as visually hidden text, read with it.
 */
export interface TooltipProps {
  /** The explanation. One or two short sentences. */
  content: string;
  /** False renders the children alone, with no tooltip and no hidden text. */
  enabled?: boolean;
  children: ReactNode;
  className?: string;
}

/*  Gap between the pointer and the bubble's nose. Spacing step 6 is 12px.  */
const OFFSET = 12;

export function Tooltip({ content, enabled = true, children, className }: TooltipProps) {
  const [at, setAt] = useState<{ x: number; y: number; flip: boolean } | null>(null);

  if (!enabled) return <>{children}</>;

  const move = (e: MouseEvent) => {
    //  Flip to the pointer's left when the bubble would leave the viewport.
    //  The bubble is at most `chrome/tooltip` (240) wide; read it rather than
    //  hard-coding it, so a token change carries through.
    const max = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zf-chrome-tooltip')) || 240;
    setAt({ x: e.clientX, y: e.clientY, flip: e.clientX + OFFSET + max > window.innerWidth });
  };

  return (
    <div
      className={className}
      onMouseEnter={move}
      onMouseMove={move}
      onMouseLeave={() => setAt(null)}
    >
      {children}
      <span className="sr-only">{content}</span>
      {at
        ? createPortal(
          <span
            aria-hidden
            className={cn(
              'pointer-events-none fixed z-50 -translate-y-1/2',
              at.flip ? '-translate-x-full' : '',
            )}
            //  Positions come from the pointer, so they are the one inline style
            //  here — a measured coordinate, not a design value.
            style={{ left: at.flip ? at.x - OFFSET : at.x + OFFSET, top: at.y }}
          >
            <span className="relative block max-w-tooltip w-max rounded-lg bg-surface-inverse px-6 py-5 shadow-popover">
              <span
                aria-hidden
                className={cn(
                  'absolute top-1/2 size-4 -translate-y-1/2 rotate-45 bg-surface-inverse',
                  at.flip ? '-end-2' : '-start-2',
                )}
              />
              <Text as="span" size="body" tone="inverse" className="relative block">{content}</Text>
            </span>
          </span>,
          document.body,
        )
        : null}
    </div>
  );
}
