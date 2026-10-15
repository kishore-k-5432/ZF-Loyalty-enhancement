import { useId } from 'react';
import type { ReactNode } from 'react';
import { Radio } from '../Radio/Radio';
import { Inline, Stack, Text } from '../../primitives';
import { cn } from '../../utils/cn';

/**
 * RADIO GROUP — one choice from a few, all of them visible.
 *
 * `Radio` is the control alone: a bare `<input type="radio">` with the drawn
 * states and nothing else. That is correct for it and useless on its own — a
 * radio with no `<label>` is a dot nobody can click and a screen reader
 * announces as "radio button, unlabelled".
 *
 * ── WHY IT IS A FIELDSET ────────────────────────────────────────────────────
 * The `<legend>` is the QUESTION and each label is an ANSWER, and only a
 * fieldset expresses that. Without it a screen reader announces "Yes, radio
 * button, 1 of 2" and never says what Yes is answering — which for
 * "Installation Required" is the entire content of the question.
 *
 * ── AND WHY NOT A `Select` ──────────────────────────────────────────────────
 * Two or three options that the user should be able to compare at a glance are
 * radios; a list they have to open is a `Select`. The line is roughly five: past
 * that the row stops fitting and the options stop being comparable anyway.
 */
export interface RadioGroupOption {
  value: string;
  label: string;
  /** A line under the label, aligned to the label's edge — what choosing this means. */
  description?: string;
  /**
   * Content that belongs to this answer — a follow-up field. Rendered under the
   * option at the label's edge. The caller decides when it shows, usually only
   * while the option is selected.
   */
  detail?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** The question. Rendered as the `<legend>`. */
  label: string;
  options: RadioGroupOption[];
  value: string;
  onChange: (next: string) => void;
  /** `inline` (default) for two or three short answers; `stacked` otherwise. */
  layout?: 'inline' | 'stacked';
  /**
   * `plain` (default) is a dot and a label. `tile` draws each answer as a
   * bordered tile — for two or three answers that each carry a description and
   * a follow-up field, where a bare column of dots stops reading as one choice.
   * The selected tile takes the primary border and tint, so the answer is
   * visible from across the form, not only at the 12px dot.
   */
  variant?: 'plain' | 'tile';
  /** Hide the legend visually — only when a label beside the group already asks it. */
  hideLabel?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  name?: string;
  className?: string;
}

export function RadioGroup({
  label, options, value, onChange, layout = 'inline', variant = 'plain', hideLabel,
  required, disabled, error, name, className,
}: RadioGroupProps) {
  const uid = useId();
  const groupName = name ?? uid;
  const Row = layout === 'inline' ? Inline : Stack;

  return (
    //  `border-0 p-0 m-0`: a UA fieldset draws a groove and carries padding, and
    //  every one of those has to be cancelled before it can sit in a form row.
    <fieldset
      className={cn('border-0 p-0 m-0 min-w-0', className)}
      aria-required={required || undefined}
      aria-invalid={error || undefined}
      disabled={disabled}
    >
      <legend className={cn('p-0', hideLabel && 'sr-only')}>
        <Text as="span" size="body" weight="medium" tone={disabled ? 'disabled' : 'default'}>
          {label}
        </Text>
        {required ? <Text as="span" size="body" tone="danger" aria-hidden>{' *'}</Text> : null}
      </legend>

      {variant === 'tile' ? (
        <div
          className={cn(
            layout === 'inline' ? 'grid grid-flow-col auto-cols-fr items-stretch gap-6' : 'flex flex-col gap-6',
            !hideLabel && 'mt-4',
          )}
        >
          {options.map((o) => {
            const id = `${uid}-${o.value}`;
            const off = disabled || o.disabled;
            const on = value === o.value;
            const descId = o.description ? `${id}-desc` : undefined;
            return (
              <div
                key={o.value}
                className={cn(
                  'box-border flex flex-col gap-6 min-w-0 p-8 rounded-lg border',
                  'transition-colors motion-reduce:transition-none',
                  //  Each state owns its border AND fill, so the two never race.
                  off
                    ? 'border-border-disabled bg-surface-disabled'
                    : on
                      ? 'border-primary-default bg-primary-subtle'
                      : 'border-border-default bg-surface-default hover:border-border-hover',
                )}
              >
                <label
                  htmlFor={id}
                  className={cn('flex items-start gap-4 min-w-0', off ? 'cursor-not-allowed' : 'cursor-pointer')}
                >
                  {/*  A 20-tall line centres the dot on the label's first line. */}
                  <span className="flex h-10 shrink-0 items-center">
                    <Radio
                      id={id}
                      name={groupName}
                      value={o.value}
                      checked={on}
                      disabled={off}
                      error={error}
                      aria-describedby={descId}
                      onChange={() => onChange(o.value)}
                    />
                  </span>
                  <Stack gap={2} className="min-w-0">
                    <Text as="span" size="body" weight={on ? 'semibold' : 'regular'} tone={off ? 'disabled' : 'default'}>
                      {o.label}
                    </Text>
                    {o.description ? (
                      <Text id={descId} as="span" size="body-sm" tone={off ? 'disabled' : 'secondary'}>
                        {o.description}
                      </Text>
                    ) : null}
                  </Stack>
                </label>
                {/*  Outside the <label>, so clicking into a follow-up field never
                     re-targets the radio. Indented to the label's edge: the
                     dot's 12 plus the row's gap of 8. */}
                {o.detail ? <div className="ps-10 min-w-0">{o.detail}</div> : null}
              </div>
            );
          })}
        </div>
      ) : (
      <Row gap={8} align={layout === 'inline' ? 'center' : 'start'} className={cn(!hideLabel && 'mt-4')}>
        {options.map((o) => {
          const id = `${uid}-${o.value}`;
          const off = disabled || o.disabled;
          const on = value === o.value;
          const descId = o.description ? `${id}-desc` : undefined;
          const row = (
            //  The whole label is the target, not just the 12px dot — 2.5.8, and
            //  the reason a bare `Radio` is unusable without this.
            <label
              key={o.value}
              htmlFor={id}
              className={cn(
                'inline-flex items-center gap-4 min-w-0',
                off ? 'cursor-not-allowed' : 'cursor-pointer',
              )}
            >
              <Radio
                id={id}
                name={groupName}
                value={o.value}
                checked={on}
                disabled={off}
                error={error}
                aria-describedby={descId}
                onChange={() => onChange(o.value)}
              />
              <Text
                as="span"
                size="body"
                //  The chosen answer reads one weight heavier, so the choice is
                //  carried by the label as well as by the 12px dot.
                weight={on ? 'medium' : 'regular'}
                tone={off ? 'disabled' : 'default'}
                truncate
                className="min-w-0"
              >
                {o.label}
              </Text>
            </label>
          );
          if (!o.description && !o.detail) return row;
          return (
            <Stack key={o.value} gap={4} className="min-w-0">
              {row}
              {/*  A spacer the radio's width in a row with the label's gap, so
                   the text column lines up with the label above it — the same
                   two tokens doing the same sum, as Checkbox does. */}
              <Inline gap={4} align="start" className="flex-nowrap">
                <span aria-hidden className="w-6 shrink-0" />
                <Stack gap={6} className="min-w-0">
                  {o.description ? (
                    <Text id={descId} as="span" size="body" tone={off ? 'disabled' : 'secondary'}>
                      {o.description}
                    </Text>
                  ) : null}
                  {o.detail}
                </Stack>
              </Inline>
            </Stack>
          );
        })}
      </Row>
      )}
    </fieldset>
  );
}
