import {
  Checkbox, DatePicker, Divider, Field, Icon, Inline, InputField, Select, Stack, Text, Tooltip,
} from '@canon';
import { V3Nested, V3OptionCard, toDays } from './v3Shared';
import { expiryRule } from './v3ProgramModel';
import type { UsageFields, V3Audience } from './v3ProgramModel';

/*  VERSION 3 — the Points Usage Configuration card, shared by both program
    types: Availability (the pending period), then one group, Redemption and
    Expiry (V2 had them as two). Both types get every group, the Redemption
    Window included (V2 had no window for Scheduled points).

    V3 has no Points Expiration option. Expiry lives under the window:
    "Points never expire", ticked by default, holds unredeemed points past
    the end date. Unticked, each batch expires after a set period — per
    earning only, no fixed date. With the window off, points never expire.  */

export interface V3UsageCardProps {
  form: UsageFields;
  /** Existing Customers: the Redemption Window and its expiry choice.
   *  New Customers: no window; an opt-in Points Expiration instead. */
  audience: V3Audience;
  onChange: (patch: Partial<UsageFields>) => void;
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

/*  The ⓘ on the four options (Checkbox `info`): a short worked example —
    the description under each option already says what it is.  */
const PENDING_INFO = 'Example: a customer earns 100 points on 1 Oct. With a 15-day pending period, they can redeem them from 16 Oct.';
const MIN_POINTS_INFO = 'Example: with a minimum of 100, a customer with 80 points can\'t redeem yet. Once they reach 100, they can.';
const WINDOW_INFO = 'Example: with a window of 1–31 Dec, a customer\'s 500 points can be redeemed only in December. Points left after 31 Dec are held, not expired.';
const EXPIRE_AFTER_TIP = 'Each batch of points expires on its own, this long after it is earned. Older points are used first (FIFO).';
const EXPIRE_AFTER_TIP_PENDING = 'Each batch of points expires on its own, this long after it becomes available. Older points are used first (FIFO).';
const POINTS_EXPIRY_INFO = 'Example: with points expiring 3 months after they are earned, points earned on 1 Oct expire on 1 Jan if not redeemed.';
const KEEP_INFO = 'Example: with a window of 1–31 Dec, points not redeemed by 31 Dec stay in the customer\'s wallet. Untick to expire each batch a set time after it is earned.';

export function V3UsageCard({ form: f, onChange: set, audience }: V3UsageCardProps) {
  /*  V3: a pending period as long as the per-earning expiry means points
      expire before they can be used. Compared in days (weeks 7, months 30).  */
  const expiry = expiryRule(f, audience);
  const pendingTooLong = f.pendingOn
    && expiry.on && expiry.mode === 'earning'
    && Number(f.expiryCount) > 0 && Number(f.pendingCount) > 0
    && toDays(f.pendingCount, f.pendingUnit) >= toDays(f.expiryCount, f.expiryUnit);

  /*  The window's per-earning expiry: one label (how it works is in the ⓘ)
      and a number + unit, sized like the pending period's.  */
  const expireAfter = (
    <Stack gap={2}>
      {/*  The ⓘ sits on the label's own line height (V3InfoTip is a control-
           height box, which pushed the field 8px further down).  */}
      <Inline gap={2} align="center" className="flex-nowrap">
        <Text as="span" size="body" weight="medium">Per-earning expiry</Text>
        <Tooltip content={f.pendingOn ? EXPIRE_AFTER_TIP_PENDING : EXPIRE_AFTER_TIP} className="inline-flex cursor-help">
          <Icon name="info" size="md" tone="subtle" />
        </Tooltip>
      </Inline>
      {/*  "Expire after" is the number box's prefix (like Min Points
           above), so the field says what it sets without a second label.  */}
      <Inline gap={0} className="flex-nowrap">
        <Stack gap={0} className="w-field-xs">
          <InputField
            aria-label="Points expire after"
            format="numeric"
            prefix="Expire after"
            affix="filled"
            error={pendingTooLong}
            value={f.expiryCount}
            onChange={(e) => set({ expiryCount: e.target.value })}
            className="rounded-e-none"
          />
        </Stack>
        <Stack gap={0} className="w-field-unit shrink-0">
          <Select
            className="w-full rounded-s-none border-s-0"
            value={f.expiryUnit}
            onChange={(v) => set({ expiryUnit: v })}
            options={unitOptions}
            ariaLabel="Expiry unit"
          />
        </Stack>
      </Inline>
    </Stack>
  );

  return (
          <V3OptionCard title="Points Usage Configuration" icon="hourglass">
            {/*  3a. AVAILABILITY (V3) — the pending period. Both types.  */}
            <Stack gap={12}>
              <Text as="h4" size="body-lg" weight="medium">Availability</Text>

              <Stack gap={8}>
                <Checkbox
                  label="Points Pending Period"
                  emphasis="strong"
                  description="Newly earned points stay pending before customers can redeem them. Pending points are cancelled if the order is returned."
                  info={PENDING_INFO}
                  selection={f.pendingOn ? 'checked' : 'unchecked'}
                  onSelectionChange={(next) => set({ pendingOn: next === 'checked' })}
                />

                {/*  On: the set period, straight away (no release-method choice).  */}
                {f.pendingOn ? (
                  <V3Nested>
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
                        <Stack gap={0} className="w-field-unit shrink-0">
                          <Select
                            className="w-full rounded-s-none border-s-0"
                            value={f.pendingUnit}
                            onChange={(v) => set({ pendingUnit: v })}
                            options={pendingUnitOptions}
                            ariaLabel="Pending period unit"
                          />
                        </Stack>
                      </Inline>
                      {pendingTooLong ? (
                        <Text size="body-sm" tone="danger">
                          Pending period must be shorter than the expiry period, or points will expire before they can be used.
                        </Text>
                      ) : null}
                    </Stack>
                  </V3Nested>
                ) : null}
              </Stack>
            </Stack>

            <Divider gap="none" />

            {/*  Redemption and Expiry (one group in V3), both types.  */}

            <Stack gap={12}>
              <Text as="h4" size="body-lg" weight="medium">Redemption and Expiry</Text>

              {/*  Spacing groups the contents: 32 between options (24 under the heading), 16 from an
                   option to its fields, 24 between the window's dates and its
                   expiry choice, 12 from that choice to its field.  */}
              <Stack gap={16}>
                <Stack gap={8}>
                  <Checkbox
                    label="Minimum Points Required for Redemption"
                    emphasis="strong"
                    description="Customers can redeem loyalty points only if they meet the entered minimum point."
                    info={MIN_POINTS_INFO}
                    selection={f.minPoints ? 'checked' : 'unchecked'}
                    onSelectionChange={(next) => set({ minPoints: next === 'checked' })}
                  />

                  {f.minPoints ? (
                    <V3Nested>
                      <Stack gap={0}>
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
                    </V3Nested>
                  ) : null}
                </Stack>

                {audience === 'new' ? (
                  /*  New Customers: no Redemption Window. Expiry is opt-in
                      (off by default) and per earning only.  */
                  <Stack gap={8}>
                    <Checkbox
                      label="Points Expiration"
                      emphasis="strong"
                      description="Make each batch of points expire a set time after it is earned."
                      info={POINTS_EXPIRY_INFO}
                      selection={f.perEarningExpiry ? 'checked' : 'unchecked'}
                      onSelectionChange={(next) => set({ perEarningExpiry: next === 'checked' })}
                    />
                    {f.perEarningExpiry ? (
                      <V3Nested>
                        {expireAfter}
                      </V3Nested>
                    ) : null}
                  </Stack>
                ) : (
                  <Stack gap={8}>
                    <Checkbox
                      label="Redemption Window"
                      emphasis="strong"
                      description="When customers can start and stop redeeming points."
                      info={WINDOW_INFO}
                      selection={f.redemptionStartOn ? 'checked' : 'unchecked'}
                      onSelectionChange={(next) => set({ redemptionStartOn: next === 'checked' })}
                    />

                    {f.redemptionStartOn ? (
                      <Stack gap={12}>
                        {/*  The rule ties only the dates to the window; the expiry
                             choice below keeps the indent without it.  */}
                        <V3Nested>
                          {/*  Start and end side by side, each half the old width.  */}
                          <Inline gap={8} align="start">
                            <Stack gap={0} className="w-field-sm shrink-0">
                              <Field label="Redemption Start Date" required>
                                {({ id, required, describedBy }) => (
                                  <DatePicker id={id} required={required} ariaDescribedBy={describedBy} value={f.redemptionStart} onChange={(v) => set({ redemptionStart: v })} />
                                )}
                              </Field>
                            </Stack>
                            <Stack gap={0} className="w-field-sm shrink-0">
                              <Field label="Redemption End Date" required>
                                {({ id, required, describedBy }) => (
                                  <DatePicker id={id} required={required} ariaDescribedBy={describedBy} min={f.redemptionStart} value={f.redemptionEnd} onChange={(v) => set({ redemptionEnd: v })} />
                                )}
                              </Field>
                            </Stack>
                          </Inline>
                        </V3Nested>
                        {/*  V3: what happens to points after the window.  */}
                        <V3Nested rule={false}>
                          <Stack gap={6}>
                            <Checkbox
                              label="Points never expire"
                              description="Points not redeemed by the end date stay in the customer's wallet. Untick to make each batch of points expire after a set period."
                              info={KEEP_INFO}
                              selection={f.windowExpiry ? 'unchecked' : 'checked'}
                              onSelectionChange={(next) => set({ windowExpiry: next !== 'checked' })}
                            />
                            {f.windowExpiry ? (
                              <V3Nested>
                                <Stack gap={0}>
                                  {expireAfter}
                                </Stack>
                              </V3Nested>
                            ) : null}
                          </Stack>
                        </V3Nested>
                      </Stack>
                    ) : null}
                  </Stack>
                )}
              </Stack>
            </Stack>
          </V3OptionCard>
  );
}
