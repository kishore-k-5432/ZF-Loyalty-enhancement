import type { ReactNode } from 'react';
import {
  Button, Divider, Field, Inline, InputField, Stack, Surface, Text,
} from '@canon';
import { V3TriggerSection } from './v3TriggerSection';
import { V3SchedulePanel } from './V3SchedulePanel';
import { V3UsageCard } from './V3UsageCard';
import {
  V3InfoTip, V3OptionCard, V3PreviewRow, V3RuleRow, clampDay, nextRun, orderedDays, v3Fmt as fmt,
  v3Period as period,
} from './v3Shared';
import { dateBounds } from './v3ProgramModel';
import type { ScheduledForm } from './v3ProgramModel';

/*  VERSION 3 — the body of a SCHEDULED POINTS program.

    A standalone program. Its cards, in order:
      · Points Rewarding Rules — WHEN points are awarded (the trigger), HOW
        MANY, and what a point is worth. The date-based counterpart of a sale's
        "spend X, earn Y".
      · Points Usage Configuration — minimum points to redeem, and Expiry.
        No pending period and no Redemption Window.
    Conditions (who gets the points) are left out for now; the model keeps
    the fields so they can come back.  */

export interface V3ScheduledBodyProps {
  general: ReactNode;
  form: ScheduledForm;
  onChange: (patch: Partial<ScheduledForm>) => void;
  /** Save was attempted: show every error, not only the live ones. */
  tried: boolean;
  /** Live preview show / hide, owned by App so it survives a version switch. */
  previewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
}

const AMOUNT_PER_POINT_TIP = 'The monetary value of one loyalty point when redeemed. For example, if set to 10, then 100 points = INR 1,000 off.';
const BASE_AUDIENCE = 1240;

function joinWords(xs: string[]): string {
  return xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : (xs[0] ?? '—');
}

/*  Save is blocked on these. Exported so the screen can check before saving.  */
export function scheduledErrors(f: ScheduledForm): { points: boolean; amount: boolean } {
  return { points: !(Number(f.points) > 0), amount: !(Number(f.amountPerPoint) > 0) };
}

export function V3ScheduledBody({ general, form: f, onChange: set, tried, previewOpen, onPreviewOpenChange }: V3ScheduledBodyProps) {
  /* ── Errors ─────────────────────────────────────────────────────────────── */
  const errors = scheduledErrors(f);
  const pointsError = tried && errors.points;
  const amountError = tried && errors.amount;

  /* ── Live preview ───────────────────────────────────────────────────────── */
  const lead = f.trigger === 'birthday' ? 'On their birthday'
    : f.trigger === 'anniversary' ? 'On their membership anniversary'
      : f.frequency === 'daily' ? 'Every day'
        : f.frequency === 'weekly' ? `Every week on ${joinWords(orderedDays(f.weekdays))}`
          : `Every month on day ${clampDay(f.monthDay)}`;

  const pts = Number(f.points) || 0;
  const ptsWord = `${pts.toLocaleString('en-IN')} ${pts === 1 ? 'point' : 'points'}`;
  const summary = `${lead}, all customers get ${ptsWord}.`;

  const own = dateBounds(f);
  const next = nextRun(f, own.start ?? '', own.end ?? '');
    const worth = `${ptsWord} = INR ${(pts * (Number(f.amountPerPoint) || 0)).toLocaleString('en-IN')}`;

  const rules = [
    {
      icon: 'lock' as const,
      label: 'Minimum to redeem',
      on: f.minPoints,
      value: f.minPoints && Number(f.minPointValue) > 0 ? `${Number(f.minPointValue).toLocaleString('en-IN')} points` : 'No minimum',
    },
    {
      icon: 'alert-circle' as const,
      label: 'Points expire',
      on: f.pointsExpiration,
      value: !f.pointsExpiration ? 'Never'
        : f.expirationMode === 'earning' ? `${period(f.expiryCount, f.expiryUnit)} after they are awarded`
          : `All on ${fmt(f.expiryDate)}`,
    },
  ];

  return (
    <Inline gap={16} align="start" className="flex-nowrap pe-10 pb-20">
      <Stack gap={0} className="flex-1 min-w-0 max-w-settings-form">
        {general}

        <Stack gap={16} className="pt-15 max-w-settings-form">
          {/*  1. POINTS REWARDING RULES — when, how many, and the point value.  */}
          <V3OptionCard title="Points Rewarding Rules" icon="gift">
            <V3TriggerSection value={f} onChange={set} />

            <Inline gap={16} align="start" className="flex-nowrap">
              <Stack gap={0} className="w-field-md shrink-0">
                <Field label="Points to award" required error={pointsError} message={pointsError ? 'Enter the points to award.' : undefined}>
                  {({ id, required, error, describedBy }) => (
                    <InputField id={id} required={required} error={error} aria-describedby={describedBy} format="numeric" prefix="Points" align="end" value={f.points} onChange={(e) => set({ points: e.target.value })} />
                  )}
                </Field>
              </Stack>

              <Inline gap={6} align="end" className="flex-nowrap">
                <Stack gap={0} className="w-field-md shrink-0">
                  <Field label="Amount per Point" required error={amountError} message={amountError ? 'Enter the value of one point.' : undefined}>
                    {({ id, required, error, describedBy }) => (
                      <InputField id={id} required={required} error={error} aria-describedby={describedBy} format="numeric" prefix="INR" align="end" value={f.amountPerPoint} onChange={(e) => set({ amountPerPoint: e.target.value })} />
                    )}
                  </Field>
                </Stack>
                <V3InfoTip tip={AMOUNT_PER_POINT_TIP} />
              </Inline>
            </Inline>
          </V3OptionCard>

          {/*  2. POINTS USAGE CONFIGURATION — minimum points and Expiry.  */}
          <V3UsageCard form={f} onChange={set} variant="scheduled" />
        </Stack>
      </Stack>

      {/*  RIGHT COLUMN — Schedule Program, then the sticky live preview.  */}
      <Stack gap={8} className="self-stretch w-settings-aside shrink-0">
        <V3SchedulePanel value={f} onChange={set} />

        <Stack gap={0} className="sticky top-10 max-h-settings-sticky-max overflow-y-auto overscroll-contain">
          <Surface tone="sunken" radius="xl" pad={12}>
            <Stack gap={10}>
              {/*  Show / hide: the heading stays, the body collapses.  */}
              <Inline gap={4} justify="between" align="start" className="flex-nowrap">
                <Stack gap={2} className="min-w-0">
                  <Text as="h2" size="subheading" weight="regular">Live preview</Text>
                  <Text size="body" tone="secondary">What this program will do.</Text>
                </Stack>
                <Button type="button" emphasis="tertiary" size="sm" iconRight={previewOpen ? 'chevron-up' : 'chevron-down'} aria-expanded={previewOpen} onClick={() => onPreviewOpenChange(!previewOpen)}>
                  {previewOpen ? 'Hide' : 'Show'}
                </Button>
              </Inline>

              {previewOpen ? (
                <>
                  <Surface tone="default" radius="lg" border="divider" pad={8}>
                    <Stack gap={2}>
                      <Text size="overline" tone="tertiary">Summary</Text>
                      <Text size="body" weight="medium">{summary}</Text>
                    </Stack>
                  </Surface>

                  <Surface tone="default" radius="lg" border="divider" pad={0}>
                    <Stack gap={0}>
                      <V3PreviewRow icon="refresh" label="Next run" value={next} />
                      <Divider gap="none" />
                      <V3PreviewRow icon="users" label="Customers matching today" value={`~${BASE_AUDIENCE.toLocaleString('en-IN')} customers match today`} />
                      <Divider gap="none" />
                      <V3PreviewRow icon="gift" label="Worth" value={worth} />
                    </Stack>
                  </Surface>

                  <Surface tone="default" radius="lg" border="divider" pad={0}>
                    <Stack gap={0}>
                      {rules.map((r, i) => (
                        <Stack key={r.label} gap={0}>
                          {i > 0 ? <Divider gap="none" /> : null}
                          <V3RuleRow icon={r.icon} label={r.label} value={r.value} on={r.on} />
                        </Stack>
                      ))}
                    </Stack>
                  </Surface>
                </>
              ) : null}
            </Stack>
          </Surface>
        </Stack>
      </Stack>
    </Inline>
  );
}
