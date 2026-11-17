import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Banner, Button, DatePicker, Divider, Field, Icon, Inline, InputField, Select, Stack, Surface, Text, Tooltip,
} from '@canon';
import { V3SchedulePanel } from './V3SchedulePanel';
import { V3UsageCard } from './V3UsageCard';
import { V3spRateRanges } from './v3spRateRanges';
import { V3OptionCard, V3PreviewRow, V3RuleRow, v3Fmt as fmt, v3Period as period } from './v3Shared';
import { PURCHASE_PERIOD_LABEL } from './v3ProgramModel';
import type { PurchasePeriod, ScheduledForm } from './v3ProgramModel';
import {
  inr, nextAward, periodMismatch, scheduledErrors, summary, tryRate,
} from './v3spModel';

/*  VERSION 3 — the body of a SCHEDULED POINTS program.

    A standalone program. Its cards, in order:
      · Points Rewarding Rules
          How to award  — the purchase period, the ranges, Amount per Point.
          When to award — Occasion (custom date / membership anniversary),
                          the date and how it repeats.
      · Points Usage Configuration — Points per sale's own card (V3UsageCard),
        without Availability or the Redemption Window: minimum points and
        Expiry.

    Points per sale's body, usage card and preview are not touched; anything
    shared that needed to differ is a `v3sp` variant.  */

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

const AMOUNT_PER_POINT_TIP = 'Value of one point when redeemed.';

const OCCASION_OPTIONS = [
  { value: 'anniversary', label: 'Membership anniversary' },
  { value: 'custom', label: 'Custom date' },
];
const PURCHASE_PERIOD_OPTIONS = (Object.keys(PURCHASE_PERIOD_LABEL) as PurchasePeriod[])
  .map((value) => ({ value, label: PURCHASE_PERIOD_LABEL[value] }));
const REPEAT_OPTIONS = [
  { value: 'month', label: 'Every month' },
  { value: 'quarter', label: 'Every quarter' },
  { value: 'year', label: 'Every year' },
  { value: 'none', label: 'None' },
];

/*  The ⓘ, as in Points per sale, but on the canon Tooltip so it shows on
    hover rather than relying on the browser's title delay.  */
function V3spInfoTip({ tip }: { tip: string }) {
  return (
    <Inline gap={0} align="center" className="h-control shrink-0">
      <Tooltip content={tip}>
        <Icon name="info" size="md" tone="subtle" label={tip} />
      </Tooltip>
    </Inline>
  );
}

/*  "WHEN TO AWARD" / "HOW TO AWARD" — the overline style (11, Semi Bold,
    upper case), so the two group headings read as section markers rather
    than as one more label among the field labels below them.  */
function Subheading({ children }: { children: string }) {
  return <Text as="h4" size="overline" tone="secondary">{children}</Text>;
}

export function V3ScheduledBody({ general, form: f, onChange: set, tried, previewOpen, onPreviewOpenChange }: V3ScheduledBodyProps) {
  //  The preview's "Customer purchased" — the simulator, not program data.
  const [purchased, setPurchased] = useState('180000');

  const e = scheduledErrors(f, tried);
  const update = set;

  //  The preview's usage rows — the same two the card shows.
  const rules = [
    {
      icon: 'lock' as const,
      label: 'Minimum to redeem',
      on: f.minPoints,
      value: f.minPoints && Number(f.minPointValue) > 0 ? `${inr(Number(f.minPointValue))} points` : 'No minimum',
    },
    {
      icon: 'alert-circle' as const,
      label: 'Points expire',
      on: f.pointsExpiration,
      value: !f.pointsExpiration ? 'Never'
        : f.expirationMode === 'earning' ? `${period(f.expiryCount, f.expiryUnit)} after they are awarded`
          : f.expirationMode === 'date' ? `All on ${fmt(f.expiryDate)}` : '—',
    },
  ];

  const tryResult = tryRate(f, Number(purchased) || 0);
  const mismatch = periodMismatch(f);

  return (
    <Inline gap={16} align="start" className="flex-nowrap pe-10 pb-20">
      <Stack gap={0} className="flex-1 min-w-0 max-w-settings-form">
        {general}

        <Stack gap={16} className="pt-15 max-w-settings-form">
          {/*  1. POINTS REWARDING RULES  */}
          <V3OptionCard title="Points Rewarding Rules" icon="gift">
            {/*  1a. How to award — the purchase period, the ranges, the point value.  */}
            <Stack gap={8}>
              <Subheading>How to award</Subheading>

              <Stack gap={4}>
                <Stack gap={0} className="w-field-sm shrink-0">
                  <Field label="Purchase period" required>
                    {({ id, required, describedBy }) => (
                      <Select id={id} required={required} ariaDescribedBy={describedBy} value={f.purchasePeriod} onChange={(v) => update({ purchasePeriod: v as PurchasePeriod })} options={PURCHASE_PERIOD_OPTIONS} />
                    )}
                  </Field>
                </Stack>
                {/*  A warning, not an error: a mismatch can be deliberate.  */}
                {mismatch ? <Banner tone="warning">{mismatch}</Banner> : null}
              </Stack>

              <V3spRateRanges ranges={f.ranges} onChange={update} errors={e} />

              <Inline gap={6} align="end" className="flex-nowrap">
                <Stack gap={0} className="w-field-md shrink-0">
                  <Field label="Amount per Point" required error={Boolean(e.amount)} message={e.amount}>
                    {({ id, required, error, describedBy }) => (
                      <InputField id={id} required={required} error={error} aria-describedby={describedBy} format="numeric" prefix="INR" align="end" value={f.amountPerPoint} onChange={(ev) => update({ amountPerPoint: ev.target.value })} />
                    )}
                  </Field>
                </Stack>
                <V3spInfoTip tip={AMOUNT_PER_POINT_TIP} />
              </Inline>
            </Stack>

            <Divider gap="none" />

            {/*  1b. When to award  */}
            <Stack gap={8}>
              <Subheading>When to award</Subheading>

              <Stack gap={4}>
                <Inline gap={8} align="start" wrap>
                  <Stack gap={0} className="w-field-xs shrink-0">
                    <Field label="Occasion" required>
                      {({ id, required, describedBy }) => (
                        <Select id={id} required={required} ariaDescribedBy={describedBy} value={f.occasion} onChange={(v) => update({ occasion: v as ScheduledForm['occasion'] })} options={OCCASION_OPTIONS} />
                      )}
                    </Field>
                  </Stack>

                  {f.occasion === 'custom' ? (
                    <>
                      <Stack gap={0} className="w-field-sm shrink-0">
                        <Field label="Date" required error={Boolean(e.date || e.dateRange)} message={e.date}>
                          {({ id, required, error, describedBy }) => (
                            <DatePicker id={id} required={required} error={error} ariaDescribedBy={describedBy} value={f.awardDate} onChange={(v) => update({ awardDate: v })} />
                          )}
                        </Field>
                      </Stack>
                      <Stack gap={0} className="w-field-sm shrink-0">
                        <Field label="Repeat">
                          {({ id, describedBy }) => (
                            <Select id={id} ariaDescribedBy={describedBy} value={f.repeat} onChange={(v) => update({ repeat: v as ScheduledForm['repeat'] })} options={REPEAT_OPTIONS} />
                          )}
                        </Field>
                      </Stack>
                    </>
                  ) : null}
                </Inline>

                {e.dateRange ? <Text size="body-sm" tone="danger">{e.dateRange}</Text> : null}
              </Stack>
            </Stack>
          </V3OptionCard>

          {/*  2. POINTS USAGE CONFIGURATION — Points per sale's card, without
               Availability or the Redemption Window.  */}
          <V3UsageCard form={f} onChange={update} variant="scheduled" />
        </Stack>
      </Stack>

      {/*  RIGHT COLUMN — Schedule Program, then the sticky live preview.  */}
      <Stack gap={8} className="self-stretch w-settings-aside shrink-0">
        <V3SchedulePanel value={f} onChange={set} error={e.dateRange} />

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
                      <Text size="body" weight="medium">{summary(f)}</Text>
                    </Stack>
                  </Surface>

                  <Surface tone="default" radius="lg" border="divider" pad={0}>
                    <Stack gap={0}>
                      <V3PreviewRow icon="refresh" label="Next award" value={nextAward(f)} />
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

                  <Stack gap={4}>
                    <Text size="overline" tone="tertiary">Try it</Text>
                    <Surface tone="default" radius="lg" border="divider" pad={8}>
                      <Stack gap={6}>
                        <Field label="Customer purchased">
                            {({ id, describedBy }) => (
                              <InputField
                                id={id}
                                aria-describedby={describedBy}
                                format="numeric"
                                prefix="INR"
                                align="end"
                                value={purchased.trim() === '' ? '' : inr(Number(purchased))}
                                onChange={(ev) => setPurchased(ev.target.value)}
                              />
                            )}
                          </Field>
                        <Inline gap={3} align="start" className="flex-nowrap">
                          <Icon name="gift" size="sm" tone="primary" />
                          <Text size="body">{tryResult}</Text>
                        </Inline>
                      </Stack>
                    </Surface>
                  </Stack>
                </>
              ) : null}
            </Stack>
          </Surface>
        </Stack>
      </Stack>
    </Inline>
  );
}
