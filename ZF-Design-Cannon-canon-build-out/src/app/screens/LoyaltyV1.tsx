import { useState } from 'react';
import type { ReactNode } from 'react';
import type { IconName } from '@canon';
import {
  Banner, Button, Checkbox, DatePicker, Divider, Field, Icon, Inline, InputField,
  RadioGroup, Select, SettingsShell, Stack, StatusBadge, Surface, Text, Textarea, Toggle,
} from '@canon';
import { COMMERCE_MARK } from '../data/books-marks';
import { SETTINGS_SECTIONS } from '../data/settings';

/*  VERSION 1 — FROZEN. The reviewed flow, kept as-is for comparison. Do not change
    this file; every new change goes into LoyaltyV2.tsx. Open with #v1.

    Loyalty Program configuration review POC — Zoho Retail ERP.
    Review focus: the Points Expiration section and the Live Preview.
    No backend and no persistence: every value lives in this component's state.  */

export interface LoyaltyV1Props {
  onClose: () => void;
  /** The V1 | V2 switch, rendered beside the page title. Owned by `App`. */
  versionSwitch?: ReactNode;
}

const unitOptions = [
  { value: 'days', label: 'days' },
  { value: 'months', label: 'months' },
  { value: 'years', label: 'years' },
];

const POINTS_EARNED_TIP = 'Number of loyalty points a customer earns for every qualifying unit spent in this order value range.';
const AMOUNT_PER_POINT_TIP = 'The monetary value of one loyalty point when redeemed. For example, if set to 10, then 100 points = INR 1,000 off.';

/*  Amount per Point is read-only in this POC, so the simulator uses its value.  */
const AMOUNT_PER_POINT = 10;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/*  Dates are ISO `YYYY-MM-DD` strings (the DatePicker's value), shown as
    "27 Aug 2024". ISO strings compare correctly as plain strings.  */
function fmt(iso: string): string {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return r ? `${Number(r[3])} ${MONTHS[Number(r[2]) - 1]} ${r[1]}` : '—';
}

/*  "27 Aug → 30 Sep 2024" when both ends share a year, otherwise both in full.  */
function fmtRange(a: string, b: string): string {
  if (a && b && a.slice(0, 4) === b.slice(0, 4)) return `${fmt(a).slice(0, -5)} → ${fmt(b)}`;
  return `${fmt(a)} → ${fmt(b)}`;
}

/*  "1 months" reads wrong to a cashier, so a single unit drops the plural.  */
function period(n: string, unit: string): string {
  const count = n.trim() || '—';
  return `${count} ${count === '1' ? unit.replace(/s$/, '') : unit}`;
}

/*  The checkout date minus the expiry period: points earned before it are gone.  */
function minusPeriod(iso: string, n: string, unit: string): string {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const k = Number(n);
  if (!r || !k) return '';
  const y = Number(r[1]); const m = Number(r[2]) - 1; const d = Number(r[3]);
  const dt = unit === 'days' ? new Date(y, m, d - k)
    : unit === 'months' ? new Date(y, m - k, d) : new Date(y - k, m, d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

const inRange = (d: string, a: string, b: string) => (!a || d >= a) && (!b || d <= b);

/*  The ⓘ beside a field. A native `title` gives the hover tooltip; the icon's
    `label` is what a screen reader announces.  */
function InfoTip({ tip }: { tip: string }) {
  return (
    <Inline gap={0} align="center" className="h-control">
      <Text as="span" title={tip} className="cursor-help">
        <Icon name="info" size="md" tone="subtle" label={tip} />
      </Text>
    </Inline>
  );
}

/*  The two option cards share one header treatment: title, then a rule.  */
function OptionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Surface radius="card" border="default" pad={12}>
      <Stack gap={0}>
        <Text as="h3" size="subheading" weight="regular">{title}</Text>
        <Divider gap="none" className="my-10" />
        <Stack gap={10}>{children}</Stack>
      </Stack>
    </Surface>
  );
}

/*  One rule in the preview's "at a glance" list.  */
function RuleRow({ icon, label, value, on }: { icon: IconName; label: string; value: string; on: boolean }) {
  return (
    <Inline gap={6} align="center" className="flex-nowrap px-6 py-5">
      <Surface tone={on ? 'default' : 'sunken'} radius="full" border="divider" pad={4} className="shrink-0">
        <Icon name={icon} size="sm" tone={on ? 'primary' : 'disabled'} />
      </Surface>
      <Stack gap={0} className="min-w-0 flex-1">
        <Text size="overline" tone="tertiary">{label}</Text>
        <Text size="body" weight="medium" tone={on ? 'default' : 'secondary'}>{value}</Text>
      </Stack>
      <StatusBadge status={on ? 'success' : 'inactive'}>{on ? 'On' : 'Off'}</StatusBadge>
    </Inline>
  );
}

type Check = { state: 'pass' | 'fail' | 'info'; title: string; detail: string };

const CHECK_ICON: Record<Check['state'], { name: IconName; tone: 'success' | 'danger' | 'primary' }> = {
  pass: { name: 'check-circle', tone: 'success' },
  fail: { name: 'x-circle', tone: 'danger' },
  info: { name: 'info', tone: 'primary' },
};

function CheckRow({ check, children }: { check: Check; children?: ReactNode }) {
  const icon = CHECK_ICON[check.state];
  return (
    <Inline gap={4} align="start" className="flex-nowrap">
      <Inline gap={0} align="center" className="h-10 shrink-0">
        <Icon name={icon.name} size="md" tone={icon.tone} />
      </Inline>
      <Stack gap={1} className="min-w-0 flex-1">
        <Text size="body" weight="medium">{check.title}</Text>
        <Text size="body-sm" tone="secondary">{check.detail}</Text>
        {children}
      </Stack>
    </Inline>
  );
}

export function LoyaltyV1({ onClose, versionSwitch }: LoyaltyV1Props) {
  //  Redeeming preferences
  const [minPoints, setMinPoints] = useState(true);
  const [minPointValue, setMinPointValue] = useState('100');
  const [redemptionWindow, setRedemptionWindow] = useState(true);
  const [redemptionStart, setRedemptionStart] = useState('2024-08-27');
  const [redemptionEnd, setRedemptionEnd] = useState('2024-08-28');

  //  Points expiration
  const [pointsExpiration, setPointsExpiration] = useState(true);
  const [expirationMode, setExpirationMode] = useState('earning');
  const [expiryCount, setExpiryCount] = useState('3');
  const [expiryUnit, setExpiryUnit] = useState('months');
  const [expiryDate, setExpiryDate] = useState('');

  //  Schedule program
  const [programDates, setProgramDates] = useState(true);
  const [programStart, setProgramStart] = useState('2024-08-27');
  const [programEnd, setProgramEnd] = useState('2024-08-28');
  const [neverExpire, setNeverExpire] = useState(false);

  //  Live preview simulator — a hypothetical customer at the till.
  const [balance, setBalance] = useState('250');
  const [checkoutDate, setCheckoutDate] = useState('2024-08-27');

  /*  Switching to "Expiration Date" copies the Redemption End Date in once.
      There is no live sync after that, so the merchant can edit it freely.  */
  const changeExpirationMode = (next: string) => {
    if (next === 'date' && expirationMode !== 'date') setExpiryDate(redemptionEnd);
    setExpirationMode(next);
  };

  /*  The two cutoffs can disagree. Whichever comes first is when redemption
      really stops, so the field whose date is LATER carries a warning naming
      the earlier one. Only when both are in force and both dates are set.  */
  const bothCutoffs = redemptionWindow && pointsExpiration && expirationMode === 'date'
    && Boolean(redemptionEnd) && Boolean(expiryDate);
  const expiryAfterWindow = bothCutoffs && expiryDate > redemptionEnd;
  const windowAfterExpiry = bothCutoffs && redemptionEnd > expiryDate;

  /* ── LIVE PREVIEW — derived from state on every render ─────────────────── */
  const pts = Number(balance) || 0;

  const rules = [
    { icon: 'arrow-right' as const, label: 'Redemption window', on: redemptionWindow, value: redemptionWindow ? fmtRange(redemptionStart, redemptionEnd) : 'Any time in the program' },
    {
      icon: 'alert-circle' as const,
      label: 'Points expire',
      on: pointsExpiration,
      value: !pointsExpiration ? 'Never'
        : expirationMode === 'earning' ? `${period(expiryCount, expiryUnit)} after earning`
          : `All on ${fmt(expiryDate)}`,
    },
  ];

  const windowCheck: Check = !redemptionWindow
    ? { state: 'pass', title: 'No redemption window', detail: 'Points can be redeemed any time in the program.' }
    : inRange(checkoutDate, redemptionStart, redemptionEnd)
      ? { state: 'pass', title: 'Inside the redemption window', detail: `Open ${fmtRange(redemptionStart, redemptionEnd)}.` }
      : { state: 'fail', title: 'Outside the redemption window', detail: `Redemption is open ${fmtRange(redemptionStart, redemptionEnd)}.` };

  const cutoff = minusPeriod(checkoutDate, expiryCount, expiryUnit);
  const expiryCheck: Check = !pointsExpiration
    ? { state: 'pass', title: 'Points never expire', detail: 'The whole balance stays valid.' }
    : expirationMode === 'earning'
      ? { state: 'info', title: 'Oldest points are used first', detail: cutoff ? `Points earned before ${fmt(cutoff)} have already expired.` : 'Each batch expires on its own schedule.' }
      : !expiryDate || checkoutDate <= expiryDate
        ? { state: 'pass', title: 'Points are still valid', detail: `All points expire on ${fmt(expiryDate)}.` }
        : { state: 'fail', title: 'Points have expired', detail: `All points expired on ${fmt(expiryDate)}.` };

  const checks = [windowCheck, expiryCheck];
  const blocker = checks.find((c) => c.state === 'fail');
  const worth = (pts * AMOUNT_PER_POINT).toLocaleString('en-IN');

  return (
    <SettingsShell
      sections={SETTINGS_SECTIONS}
      currentId="loyalty-program"
      mark={COMMERCE_MARK}
      title="All Settings"
      org="Nithish & co"
      searchPlaceholder="Search settings ( / )"
      onBack={() => undefined}
      onClose={() => undefined}
      header={(
        <Inline justify="between" align="center" grow>
          <Inline gap={8} align="center">
            <Text as="h1" size="title" weight="regular">Edit Loyalty Program</Text>
            {versionSwitch}
          </Inline>
          <Button type="button" emphasis="tertiary" size="md" icon="close" label="Close editor" onClick={onClose} />
        </Inline>
      )}
      footer={(
        <Stack gap={0}>
          <Divider gap="none" />
          <Inline gap={5} className="px-10 py-6">
            <Button type="button" emphasis="primary" size="md" onClick={() => alert('Config saved (POC — no backend)')}>
              Save
            </Button>
            <Button type="button" emphasis="secondary" size="md" onClick={() => alert('Changes discarded (POC)')}>
              Cancel
            </Button>
          </Inline>
        </Stack>
      )}
    >
      <Inline gap={16} align="start" className="flex-nowrap pe-10 pb-20">
        <Stack gap={0} className="flex-1 min-w-0 max-w-settings-form">
          {/*  1. GENERAL DETAILS — read-only for the POC.  */}
          <Stack gap={12}>
            <Text as="h2" size="subheading" weight="regular">General Details</Text>

            <Stack gap={0} className="w-field-xl shrink-0">
              <Field label="Program Name" required>
                {({ id, required, describedBy }) => (
                  <InputField id={id} required={required} aria-describedby={describedBy} readOnly defaultValue="testing loyality" />
                )}
              </Field>
            </Stack>

            <Stack gap={0} className="w-field-xl shrink-0">
              <Field label="Description">
                {({ id, describedBy }) => (
                  <Textarea id={id} aria-describedby={describedBy} rows={3} readOnly defaultValue="" />
                )}
              </Field>
            </Stack>
          </Stack>

          <Divider gap="none" className="my-15" />

          {/*  2. POINTS REDEMPTION RULES — read-only for the POC.  */}
          <Stack gap={12}>
            <Text as="h2" size="subheading" weight="regular">Points Redemption Rules</Text>

            <RadioGroup
              label="Loyalty Type"
              required
              disabled
              layout="inline"
              value="multiple"
              onChange={() => undefined}
              options={[
                { value: 'single', label: 'Single Criteria' },
                { value: 'multiple', label: 'Multiple Criteria' },
              ]}
            />

            <Stack gap={6}>
              <Inline gap={16} align="end" className="flex-nowrap">
                <Stack gap={0} className="w-field-md shrink-0">
                  <Field label="Order Value Range" required>
                    {({ id, required, describedBy }) => (
                      <Inline gap={0} className="flex-nowrap">
                        <InputField
                          id={id}
                          required={required}
                          aria-describedby={describedBy}
                          readOnly
                          prefix="INR"
                          align="end"
                          defaultValue="1"
                          className="min-w-0 rounded-e-none border-e-0"
                        />
                        <InputField
                          aria-label="Order value range, to, INR"
                          readOnly
                          prefix="To"
                          affix="plain"
                          align="end"
                          defaultValue="100"
                          className="min-w-0 rounded-s-none border-s-0"
                        />
                      </Inline>
                    )}
                  </Field>
                </Stack>

                <Inline gap={6} align="end" className="flex-nowrap">
                  <Stack gap={0} className="w-field-xs shrink-0">
                    <Field label="For Every" required>
                      {({ id, required, describedBy }) => (
                        <InputField id={id} required={required} aria-describedby={describedBy} readOnly prefix="INR" align="end" defaultValue="1" />
                      )}
                    </Field>
                  </Stack>

                  <Inline gap={0} align="center" className="h-control">
                    <Icon name="chevron-right" size="md" tone="primary" />
                    <Icon name="chevron-right" size="md" tone="primary" />
                  </Inline>

                  <Stack gap={0} className="w-field-xs shrink-0">
                    <Field label="Points Earned" required>
                      {({ id, required, describedBy }) => (
                        <InputField id={id} required={required} aria-describedby={describedBy} readOnly prefix="Points" align="end" defaultValue="10" />
                      )}
                    </Field>
                  </Stack>

                  <InfoTip tip={POINTS_EARNED_TIP} />
                </Inline>
              </Inline>

              {/*  Rendered for completeness, but not part of this review.  */}
              <Button type="button" emphasis="tertiary" size="sm" icon="plus-circle" disabled className="self-start -ms-3">
                Add New Range
              </Button>
            </Stack>

            <Inline gap={6} align="end" className="flex-nowrap">
              <Stack gap={0} className="w-field-md shrink-0">
                <Field label="Amount per Point" required>
                  {({ id, required, describedBy }) => (
                    <InputField id={id} required={required} aria-describedby={describedBy} readOnly prefix="INR" align="end" defaultValue="10" />
                  )}
                </Field>
              </Stack>
              <InfoTip tip={AMOUNT_PER_POINT_TIP} />
            </Inline>
          </Stack>

          <Stack gap={16} className="pt-15 max-w-settings-option-card">
            {/*  3. REDEEMING LOYALTY POINTS PREFERENCES — interactive.  */}
            <OptionCard title="Redeeming Loyalty Points Preferences">
              <Stack gap={8}>
                <Checkbox
                  label="Minimum Points Required for Redemption"
                  description="Customers can redeem loyalty points only if they meet the entered minimum point."
                  selection={minPoints ? 'checked' : 'unchecked'}
                  onSelectionChange={(next) => setMinPoints(next === 'checked')}
                />

                {minPoints ? (
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
                            value={minPointValue}
                            onChange={(e) => setMinPointValue(e.target.value)}
                          />
                        )}
                      </Field>
                    </Stack>
                  </Stack>
                ) : null}
              </Stack>

              <Stack gap={8}>
                <Checkbox
                  label="Redemption Window"
                  description="When customers can start and stop redeeming points."
                  selection={redemptionWindow ? 'checked' : 'unchecked'}
                  onSelectionChange={(next) => setRedemptionWindow(next === 'checked')}
                />

                {redemptionWindow ? (
                  <Stack gap={8} className="ps-10">
                    <Stack gap={0} className="w-field-lg shrink-0">
                      <Field label="Redemption Start Date" required>
                        {({ id, required, describedBy }) => (
                          <DatePicker id={id} required={required} ariaDescribedBy={describedBy} value={redemptionStart} onChange={setRedemptionStart} />
                        )}
                      </Field>
                    </Stack>
                    <Stack gap={0} className="w-field-lg shrink-0">
                      <Field label="Redemption End Date" required>
                        {({ id, required, describedBy }) => (
                          <DatePicker id={id} required={required} ariaDescribedBy={describedBy} min={redemptionStart} value={redemptionEnd} onChange={setRedemptionEnd} />
                        )}
                      </Field>
                    </Stack>
                    {windowAfterExpiry ? (
                      <Stack gap={0} className="w-field-lg shrink-0">
                        <Banner tone="warning">
                          {`Points expire on ${fmt(expiryDate)}, so they can't be redeemed after that — even though the window stays open until ${fmt(redemptionEnd)}.`}
                        </Banner>
                      </Stack>
                    ) : null}
                  </Stack>
                ) : null}
              </Stack>
            </OptionCard>

            {/*  4. POINTS EXPIRATION — interactive, and the focus of the review.  */}
            <OptionCard title="Points Expiration">
              <Checkbox
                label="Points Expiration"
                description="Enable points expiry that controls how long individual points stay valid in a customer's wallet"
                selection={pointsExpiration ? 'checked' : 'unchecked'}
                onSelectionChange={(next) => setPointsExpiration(next === 'checked')}
              />

              {pointsExpiration ? (
                <Stack gap={0} className="ps-10">
                  <RadioGroup
                    label="Expiration method"
                    required
                    variant="tile"
                    layout="inline"
                    value={expirationMode}
                    onChange={changeExpirationMode}
                    options={[
                      {
                        value: 'date',
                        label: 'Expiration Date',
                        description: 'A fixed cutoff that applies to all points regardless of when they were earned.',
                        detail: expirationMode === 'date' ? (
                          <Stack gap={6}>
                            <Field label="Expiration date" required>
                              {({ id, required, describedBy }) => (
                                <DatePicker id={id} required={required} ariaDescribedBy={describedBy} value={expiryDate} onChange={setExpiryDate} />
                              )}
                            </Field>
                            {expiryAfterWindow ? (
                              <Banner tone="warning">
                                {`Redemption closes on ${fmt(redemptionEnd)}, so points can't be redeemed after that — even though they stay valid until ${fmt(expiryDate)}.`}
                              </Banner>
                            ) : null}
                          </Stack>
                        ) : undefined,
                      },
                      {
                        value: 'earning',
                        label: 'Per-earning expiry',
                        description: 'Each batch of earned points expires individually. Older points consumed first (FIFO).',
                        detail: expirationMode === 'earning' ? (
                          <Stack gap={2}>
                            <Text as="span" size="body" weight="medium">Expire after</Text>
                            <Inline gap={0} className="flex-nowrap">
                              <Stack gap={0} className="w-field-num">
                                <InputField
                                  aria-label="Expire after"
                                  format="numeric"
                                  value={expiryCount}
                                  onChange={(e) => setExpiryCount(e.target.value)}
                                  className="rounded-e-none"
                                />
                              </Stack>
                              <Select
                                className="w-field-unit rounded-s-none border-s-0"
                                value={expiryUnit}
                                onChange={setExpiryUnit}
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
            </OptionCard>
          </Stack>
        </Stack>

        {/*  RIGHT COLUMN — stretched to the form's height so the preview has a
             track to stick in. Schedule Program scrolls away with the page;
             the preview then pins, scrolling on its own if it outgrows the
             viewport.  */}
        <Stack gap={8} className="self-stretch w-settings-aside shrink-0">
          {/*  5. SCHEDULE PROGRAM  */}
          <Surface tone="sunken" radius="xl" pad={12}>
            <Stack gap={10}>
              <Text as="h2" size="subheading" weight="regular">Schedule Program</Text>

              <Stack gap={8}>
                <Inline gap={6} justify="between" align="start" className="flex-nowrap">
                  <Stack gap={2} className="min-w-0">
                    <Text size="body" weight="semibold">Program Dates</Text>
                    <Text size="body" tone="secondary">Set when the loyalty program should start and end.</Text>
                  </Stack>
                  <Toggle label="Enabled" labelPlacement="top" size="sm" checked={programDates} onCheckedChange={setProgramDates} />
                </Inline>

                {programDates ? (
                  <>
                    {/*  Never Expire disables these two inputs and nothing else.
                         Contradictions with the redemption window or expiry
                         are left for the merchant to resolve.  */}
                    <Field label="Program Start Date" required disabled={neverExpire}>
                      {({ id, required, describedBy }) => (
                        <DatePicker id={id} required={required} ariaDescribedBy={describedBy} disabled={neverExpire} value={programStart} onChange={setProgramStart} />
                      )}
                    </Field>

                    <Field label="Program End Date" required disabled={neverExpire}>
                      {({ id, required, describedBy }) => (
                        <DatePicker id={id} required={required} ariaDescribedBy={describedBy} disabled={neverExpire} min={programStart} value={programEnd} onChange={setProgramEnd} />
                      )}
                    </Field>

                    <Checkbox
                      label="Never Expire"
                      description="The program will remain active indefinitely."
                      selection={neverExpire ? 'checked' : 'unchecked'}
                      onSelectionChange={(next) => setNeverExpire(next === 'checked')}
                    />
                  </>
                ) : null}
              </Stack>
            </Stack>
          </Surface>

          {/*  6. LIVE PREVIEW — the rules at a glance, then a simulated checkout
               that runs a customer through every rule.  */}
          <Stack gap={0} className="sticky top-10 max-h-settings-sticky-max overflow-y-auto overscroll-contain">
          <Surface tone="sunken" radius="xl" pad={12}>
            <Stack gap={10}>
              <Stack gap={2}>
                <Text as="h2" size="subheading" weight="regular">Live preview</Text>
                <Text size="body" tone="secondary">What a customer experiences at checkout.</Text>
              </Stack>

              <Surface tone="default" radius="lg" border="divider" pad={0}>
                <Stack gap={0}>
                  {rules.map((r, i) => (
                    <Stack key={r.label} gap={0}>
                      {i > 0 ? <Divider gap="none" /> : null}
                      <RuleRow icon={r.icon} label={r.label} value={r.value} on={r.on} />
                    </Stack>
                  ))}
                </Stack>
              </Surface>

              <Stack gap={6}>
                <Text size="overline" tone="tertiary">Try a checkout</Text>
                <Surface tone="default" radius="lg" border="divider" pad={8}>
                  <Stack gap={8}>
                    <Field label="Customer balance">
                      {({ id, describedBy }) => (
                        <InputField
                          id={id}
                          aria-describedby={describedBy}
                          format="numeric"
                          prefix="Points"
                          align="end"
                          value={balance}
                          onChange={(e) => setBalance(e.target.value)}
                        />
                      )}
                    </Field>
                    <Field label="Checkout date">
                      {({ id, describedBy }) => (
                        <DatePicker id={id} ariaDescribedBy={describedBy} value={checkoutDate} onChange={setCheckoutDate} />
                      )}
                    </Field>

                    <Divider gap="none" />

                    <Stack gap={6}>
                      {checks.map((c) => (
                        <CheckRow key={c.title} check={c} />
                      ))}
                    </Stack>

                    <Banner tone={blocker ? 'danger' : 'success'}>
                      {blocker
                        ? `Can't redeem — ${blocker.title.toLowerCase()}.`
                        : `Can redeem ${pts} points — INR ${worth} off.`}
                    </Banner>
                  </Stack>
                </Surface>
              </Stack>
            </Stack>
          </Surface>
          </Stack>
        </Stack>
      </Inline>
    </SettingsShell>
  );
}
