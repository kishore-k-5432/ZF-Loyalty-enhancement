import {
  Banner, Checkbox, DatePicker, Divider, Field, Icon, Inline, InputField, RadioGroup, Select, Stack, Text, Tooltip,
} from '@canon';
import { V3OptionCard, clampDay, toDays, v3Fmt as fmt } from './v3Shared';
import type { UsageFields } from './v3ProgramModel';

/*  VERSION 3 — the Points Usage Configuration card, shared by both program
    types: Availability (the pending period), Redemption, Expiry.
    `variant="scheduled"` drops Availability and keeps only the minimum
    points from Redemption — no Redemption Window.  */

export interface V3UsageCardProps {
  form: UsageFields;
  onChange: (patch: Partial<UsageFields>) => void;
  /** 'sale': every group. 'scheduled': minimum points + Expiry only. */
  variant: 'sale' | 'scheduled';
}

/*  V3 adds weeks to the expiry unit.  */
const unitOptions = [
  { value: 'days', label: 'days' },
  { value: 'weeks', label: 'weeks' },
  { value: 'months', label: 'months' },
  { value: 'years', label: 'years' },
];

const pendingUnitOptions = [
  { value: 'days', label: 'days' },
  { value: 'weeks', label: 'weeks' },
];

const frequencyOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

/*  Redemption Window and Points Expiration are mutually exclusive (as in V2):
    only one can be on. The one that is off is disabled, and says why on hover.  */
const EXPIRY_LOCKED_TIP = 'You can\'t enable Points Expiration while Redemption Window is enabled. Disable Redemption Window to use this option.';
const WINDOW_LOCKED_TIP = 'You can\'t enable Redemption Window while Points Expiration is enabled. Disable Points Expiration to use this option.';
const PENDING_TIP = 'Use this to protect against returns. Points from a returned bill are cancelled while still pending, so nothing needs to be clawed back.';

export function V3UsageCard({ form: f, onChange: set, variant }: V3UsageCardProps) {
  /*  The one conflict left: a fixed expiry that falls BEFORE redemption opens
      means no point can ever be redeemed. Warned on the later field — the
      start date — and only when both are in force and both dates are set.  */
  const expiresBeforeStart = f.redemptionStartOn && f.pointsExpiration && f.expirationMode === 'date'
    && Boolean(f.redemptionStart) && Boolean(f.expiryDate) && f.expiryDate < f.redemptionStart;

  /*  V3: a pending period as long as the per-earning expiry means points
      expire before they can be used. Compared in days (weeks 7, months 30).  */
  const pendingTooLong = f.pendingOn && f.releaseMode === 'period'
    && f.pointsExpiration && f.expirationMode === 'earning'
    && Number(f.expiryCount) > 0 && Number(f.pendingCount) > 0
    && toDays(f.pendingCount, f.pendingUnit) >= toDays(f.expiryCount, f.expiryUnit);

  const day = clampDay(f.releaseDay);
  const releaseHelper = f.releaseFrequency === 'quarterly'
    ? `Points earned in July–September become available on ${day} October.`
    : `Points earned in October become available on ${day} November.`;

  const sale = variant === 'sale';

  return (
          <V3OptionCard title="Points Usage Configuration" icon="hourglass">
            {/*  3a. AVAILABILITY (V3) — the pending period. Points per sale only.  */}
            {sale ? (
            <>
            <Stack gap={8}>
              <Text as="h4" size="body-lg" weight="medium">Availability</Text>

              <Stack gap={8}>
                {/*  The ⓘ sits beside the label, so the description is set
                     under it at the checkbox's own indent rather than inside
                     the Checkbox (which would push the icon past it).  */}
                <Stack gap={2}>
                  <Inline gap={2} align="start" className="flex-nowrap">
                    <Checkbox
                      label="Points Pending Period"
                      selection={f.pendingOn ? 'checked' : 'unchecked'}
                      onSelectionChange={(next) => set({ pendingOn: next === 'checked' })}
                    />
                    <Inline gap={0} align="center" className="h-10 shrink-0">
                      <Text as="span" title={PENDING_TIP} className="cursor-help">
                        <Icon name="info" size="md" tone="subtle" label={PENDING_TIP} />
                      </Text>
                    </Inline>
                  </Inline>
                  <Inline gap={4} className="flex-nowrap">
                    <Stack gap={0} className="w-checkbox shrink-0" />
                    <Text size="body-sm" tone="secondary">
                      Newly earned points stay pending before customers can redeem them. Pending points are cancelled if the order is returned.
                    </Text>
                  </Inline>
                </Stack>

                {f.pendingOn ? (
                  <Stack gap={0} className="ps-10 max-w-settings-option-panel">
                    <RadioGroup
                      label="Release method"
                      required
                      variant="tile"
                      layout="stacked"
                      value={f.releaseMode}
                      onChange={(v) => set({ releaseMode: v })}
                      options={[
                        {
                          value: 'period',
                          label: 'After a set period',
                          description: 'Each batch of earned points becomes available after the set duration from the bill date.',
                          detail: f.releaseMode === 'period' ? (
                            <Stack gap={2}>
                              <Text as="span" size="body" weight="medium">Available after</Text>
                              <Inline gap={0} className="flex-nowrap">
                                <Stack gap={0} className="w-field-num">
                                  <InputField
                                    aria-label="Available after"
                                    format="numeric"
                                    error={pendingTooLong}
                                    value={f.pendingCount}
                                    onChange={(e) => set({ pendingCount: e.target.value })}
                                    className="rounded-e-none"
                                  />
                                </Stack>
                                <Select
                                  className="w-field-unit rounded-s-none border-s-0"
                                  value={f.pendingUnit}
                                  onChange={(v) => set({ pendingUnit: v })}
                                  options={pendingUnitOptions}
                                  ariaLabel="Pending period unit"
                                />
                              </Inline>
                              {pendingTooLong ? (
                                <Text size="body-sm" tone="danger">
                                  Pending period must be shorter than the expiry period, or points will expire before they can be used.
                                </Text>
                              ) : null}
                            </Stack>
                          ) : undefined,
                        },
                        {
                          value: 'fixed',
                          label: 'On a fixed date each period',
                          description: 'All points earned within a period become available together on a fixed date.',
                          detail: f.releaseMode === 'fixed' ? (
                            <Stack gap={4}>
                              <Inline gap={6} align="end" className="flex-nowrap">
                                <Stack gap={0} className="w-field-sm shrink-0">
                                  <Field label="Frequency">
                                    {({ id, describedBy }) => (
                                      <Select id={id} ariaDescribedBy={describedBy} value={f.releaseFrequency} onChange={(v) => set({ releaseFrequency: v })} options={frequencyOptions} />
                                    )}
                                  </Field>
                                </Stack>
                                <Stack gap={0} className="w-field-num shrink-0">
                                  <Field label="On day">
                                    {({ id, describedBy }) => (
                                      <InputField
                                        id={id}
                                        aria-describedby={describedBy}
                                        format="numeric"
                                        align="end"
                                        value={f.releaseDay}
                                        onChange={(e) => set({ releaseDay: e.target.value })}
                                        onBlur={() => set({ releaseDay: String(clampDay(f.releaseDay)) })}
                                      />
                                    )}
                                  </Field>
                                </Stack>
                              </Inline>
                              <Text size="body-sm" tone="secondary">{releaseHelper}</Text>
                            </Stack>
                          ) : undefined,
                        },
                      ]}
                    />
                  </Stack>
                ) : null}
              </Stack>
            </Stack>

            <Divider gap="none" />
            </>
            ) : null}

            {/*  Redemption — the window is Points per sale only.  */}

            <Stack gap={8}>
              <Text as="h4" size="body-lg" weight="medium">Redemption</Text>

              <Stack gap={8}>
                <Checkbox
                  label="Minimum Points Required for Redemption"
                  description="Customers can redeem loyalty points only if they meet the entered minimum point."
                  selection={f.minPoints ? 'checked' : 'unchecked'}
                  onSelectionChange={(next) => set({ minPoints: next === 'checked' })}
                />

                {f.minPoints ? (
                  <Stack gap={0} className="ps-10">
                    <Stack gap={0} className="w-field-lg shrink-0">
                      <Field label="Minimum Point" required>
                        {({ id, required, describedBy }) => (
                          <InputField
                            id={id}
                            required={required}
                            aria-describedby={describedBy}
                            format="numeric"
                            prefix="Min Points"
                            align="end"
                            value={f.minPointValue}
                            onChange={(e) => set({ minPointValue: e.target.value })}
                          />
                        )}
                      </Field>
                    </Stack>
                  </Stack>
                ) : null}
              </Stack>

              {sale ? (
              <Stack gap={8}>
                <Tooltip content={WINDOW_LOCKED_TIP} enabled={f.pointsExpiration}>
                  <Checkbox
                    label="Redemption Window"
                    description="When customers can start and stop redeeming points."
                    disabled={f.pointsExpiration}
                    selection={f.redemptionStartOn ? 'checked' : 'unchecked'}
                    onSelectionChange={(next) => set({ redemptionStartOn: next === 'checked' })}
                  />
                </Tooltip>

                {f.redemptionStartOn ? (
                  <Stack gap={8} className="ps-10">
                    <Stack gap={0} className="w-field-lg shrink-0">
                      <Field label="Redemption Start Date" required>
                        {({ id, required, describedBy }) => (
                          <DatePicker id={id} required={required} ariaDescribedBy={describedBy} value={f.redemptionStart} onChange={(v) => set({ redemptionStart: v })} />
                        )}
                      </Field>
                    </Stack>
                    <Stack gap={0} className="w-field-lg shrink-0">
                      <Field label="Redemption End Date" required>
                        {({ id, required, describedBy }) => (
                          <DatePicker id={id} required={required} ariaDescribedBy={describedBy} min={f.redemptionStart} value={f.redemptionEnd} onChange={(v) => set({ redemptionEnd: v })} />
                        )}
                      </Field>
                    </Stack>
                    {expiresBeforeStart ? (
                      <Stack gap={0} className="w-field-lg shrink-0">
                        <Banner tone="warning">
                          {`Points expire on ${fmt(f.expiryDate)}, before redemption opens on ${fmt(f.redemptionStart)} — customers won't be able to redeem them.`}
                        </Banner>
                      </Stack>
                    ) : null}
                  </Stack>
                ) : null}
              </Stack>
              ) : null}
            </Stack>

            <Divider gap="none" />

            <Stack gap={8}>
              <Text as="h4" size="body-lg" weight="medium">Expiry</Text>

              <Stack gap={8}>
                <Tooltip content={EXPIRY_LOCKED_TIP} enabled={f.redemptionStartOn}>
                  <Checkbox
                    label="Points Expiration"
                    description="Enable points expiry that controls how long individual points stay valid in a customer's wallet"
                    disabled={f.redemptionStartOn}
                    selection={f.pointsExpiration ? 'checked' : 'unchecked'}
                    onSelectionChange={(next) => set({ pointsExpiration: next === 'checked' })}
                  />
                </Tooltip>

                {f.pointsExpiration ? (
                  <Stack gap={0} className="ps-10 max-w-settings-option-panel">
                    <RadioGroup
                      label="Expiration method"
                      required
                      variant="tile"
                      layout="stacked"
                      value={f.expirationMode}
                      onChange={(v) => set({ expirationMode: v })}
                      options={[
                        {
                          value: 'date',
                          label: 'Expiration Date',
                          description: 'A fixed cutoff that applies to all points regardless of when they were earned.',
                          detail: f.expirationMode === 'date' ? (
                            <Field label="Expiration date" required>
                              {({ id, required, describedBy }) => (
                                <DatePicker id={id} required={required} ariaDescribedBy={describedBy} value={f.expiryDate} onChange={(v) => set({ expiryDate: v })} />
                              )}
                            </Field>
                          ) : undefined,
                        },
                        {
                          value: 'earning',
                          label: 'Per-earning expiry',
                          description: f.pendingOn
                            ? 'Each batch of earned points expires individually. Older points consumed first (FIFO). Expiry is counted from the date points become available.'
                            : 'Each batch of earned points expires individually. Older points consumed first (FIFO).',
                          detail: f.expirationMode === 'earning' ? (
                            <Stack gap={2}>
                              <Text as="span" size="body" weight="medium">Expire after</Text>
                              <Inline gap={0} className="flex-nowrap">
                                <Stack gap={0} className="w-field-num">
                                  <InputField
                                    aria-label="Expire after"
                                    format="numeric"
                                    value={f.expiryCount}
                                    onChange={(e) => set({ expiryCount: e.target.value })}
                                    className="rounded-e-none"
                                  />
                                </Stack>
                                <Select
                                  className="w-field-unit rounded-s-none border-s-0"
                                  value={f.expiryUnit}
                                  onChange={(v) => set({ expiryUnit: v })}
                                  options={unitOptions}
                                  ariaLabel="Expiry unit"
                                />
                              </Inline>
                            </Stack>
                          ) : undefined,
                        },
                      ]}
                    />
                  </Stack>
                ) : null}
              </Stack>
            </Stack>
          </V3OptionCard>
  );
}
