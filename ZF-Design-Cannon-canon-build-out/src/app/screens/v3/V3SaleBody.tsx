import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Banner, Button, DatePicker, Divider, Field, Icon, Inline, InputField,
  RadioGroup, Stack, Surface, Text,
} from '@canon';
import {
  V3CheckRow, V3InfoTip, V3OptionCard, V3RuleRow,
  shiftPeriod, v3Fmt as fmt,
  v3MinusPeriod as minusPeriod, v3Period as period,
} from './v3Shared';
import type { V3Check as Check } from './v3Shared';
import { V3UsageCard } from './V3UsageCard';
import type { SaleForm } from './v3ProgramModel';

/*  VERSION 3 — the body of a POINTS PER SALE program: V2's form and live
    preview, plus the Availability (pending period) group, its expiry interplay
    and its preview rows. `general` is General Details + Program Type, drawn by
    the screen above this body.

    The checkout simulator's values live here, so switching program type
    (which remounts this body) resets the right rail.  */

export interface V3SaleBodyProps {
  general: ReactNode;
  form: SaleForm;
  onChange: (patch: Partial<SaleForm>) => void;
  /** The rewarding rules are read-only on an existing program, as in V2. */
  editable: boolean;
  /** Live preview show / hide, owned by App so it survives a version switch. */
  previewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
}

const POINTS_EARNED_TIP = 'Number of loyalty points a customer earns for every qualifying unit spent in this order value range.';
const AMOUNT_PER_POINT_TIP = 'The monetary value of one loyalty point when redeemed. For example, if set to 10, then 100 points = INR 1,000 off.';

export function V3SaleBody({ general, form: f, onChange: set, editable, previewOpen, onPreviewOpenChange }: V3SaleBodyProps) {
  //  Live preview simulator — a hypothetical customer at the till.
  const [balance, setBalance] = useState('250');
  const [available, setAvailable] = useState('210');
  const [pending, setPending] = useState('40');
  const [checkoutDate, setCheckoutDate] = useState('2026-11-10');
  const [earnedOn, setEarnedOn] = useState(() => shiftPeriod('2026-11-10', -5, 'days'));

  const releaseLabel = `${period(f.pendingCount, f.pendingUnit)} after earning`;

  /* ── LIVE PREVIEW — derived from state on every render ─────────────────── */
  const availablePts = f.pendingOn ? Number(available) || 0 : Number(balance) || 0;
  const pendingPts = f.pendingOn ? Number(pending) || 0 : 0;
  const unlockOn = !f.pendingOn ? ''
    : shiftPeriod(earnedOn, Number(f.pendingCount) || 0, f.pendingUnit);
  const pendingUnlocked = pendingPts > 0 && Boolean(unlockOn) && unlockOn <= checkoutDate;
  const pts = availablePts + (pendingUnlocked ? pendingPts : 0);

  const rules = [
    {
      icon: 'lock' as const,
      label: 'Points available',
      on: f.pendingOn,
      value: f.pendingOn ? releaseLabel : 'Immediately after earning',
    },
    { icon: 'arrow-right' as const, label: 'Redemption window', on: f.redemptionStartOn, value: f.redemptionStartOn ? `${fmt(f.redemptionStart)} → ${fmt(f.redemptionEnd)}` : 'As soon as points are earned' },
    {
      icon: 'alert-circle' as const,
      label: 'Points expire',
      on: f.pointsExpiration,
      value: !f.pointsExpiration ? 'Never'
        : f.expirationMode === 'earning' ? `${period(f.expiryCount, f.expiryUnit)} after earning`
          : `All on ${fmt(f.expiryDate)}`,
    },
  ];

  const startCheck: Check = !f.redemptionStartOn
    ? { state: 'pass', title: 'No start date', detail: 'Points can be redeemed as soon as they are earned.' }
    : !f.redemptionStart || checkoutDate >= f.redemptionStart
      ? { state: 'pass', title: 'Redemption has started', detail: `Open from ${fmt(f.redemptionStart)}.` }
      : { state: 'fail', title: 'Redemption hasn\'t started', detail: `It opens on ${fmt(f.redemptionStart)}.` };

  //  The window's other end: past it, nothing can be redeemed.
  const endCheck: Check | null = f.redemptionStartOn && f.redemptionEnd && checkoutDate > f.redemptionEnd
    ? { state: 'fail', title: 'Redemption window has closed', detail: `It closed on ${fmt(f.redemptionEnd)}.` }
    : null;

  const cutoff = minusPeriod(checkoutDate, f.expiryCount, f.expiryUnit);
  const expiryCheck: Check = !f.pointsExpiration
    ? { state: 'pass', title: 'Points never expire', detail: 'The whole balance stays valid.' }
    : f.expirationMode === 'earning'
      ? { state: 'info', title: 'Oldest points are used first', detail: cutoff ? `Points earned before ${fmt(cutoff)} have already expired.` : 'Each batch expires on its own schedule.' }
      : !f.expiryDate || checkoutDate <= f.expiryDate
        ? { state: 'pass', title: 'Points are still valid', detail: `All points expire on ${fmt(f.expiryDate)}.` }
        : { state: 'fail', title: 'Points have expired', detail: `All points expired on ${fmt(f.expiryDate)}.` };

  //  V3: the pending batch — informational, never a blocker.
  const pendingCheck: Check | null = !f.pendingOn || pendingPts === 0 ? null
    : pendingUnlocked
      ? { state: 'pass', title: 'Pending points are available', detail: `${pendingPts} points unlocked on ${fmt(unlockOn)}.` }
      : { state: 'info', title: 'Some points are still pending', detail: `${pendingPts} points unlock on ${fmt(unlockOn)}.` };

  const checks = [pendingCheck, startCheck, endCheck, expiryCheck].filter((c): c is Check => c !== null);
  const blocker = checks.find((c) => c.state === 'fail');
  const worth = (pts * (Number(f.amountPerPoint) || 0)).toLocaleString('en-IN');
  const stillPending = pendingPts > 0 && !pendingUnlocked ? ` ${pendingPts} points unlock on ${fmt(unlockOn)}.` : '';

  //  Only Multiple Criteria has ranges; Single (or none chosen yet) is one rate.
  const multiple = f.loyaltyType === 'multiple';
  //  165 in both modes: at 200 the Multiple Criteria row ran past the card at
  //  1440 and the Points Earned ⓘ sat under the right rail, unhoverable.
  const rateWidth = 'w-field-sm';

  return (
      <Inline gap={16} align="start" className="flex-nowrap pe-10 pb-20">
        <Stack gap={0} className="flex-1 min-w-0 max-w-settings-form">
          {general}

          {/*  2. POINTS REWARDING RULES — read-only for the POC. Its own box.  */}
          <Stack gap={16} className="pt-15 max-w-settings-form">
          <V3OptionCard title="Points Rewarding Rules" icon="gift">

            <RadioGroup
              label="Loyalty Type"
              required
              disabled={!editable}
              layout="inline"
              value={f.loyaltyType}
              onChange={(v) => set({ loyaltyType: v })}
              options={[
                { value: 'single', label: 'Single Criteria' },
                { value: 'multiple', label: 'Multiple Criteria' },
              ]}
            />

            {/*  Single Criteria: one rate, "for every INR X, earn Y points".
                 Multiple Criteria adds the order value range and more ranges.  */}
            <Stack gap={6}>
              <Inline gap={8} align="end" className="flex-nowrap">
                {multiple ? (
                <Stack gap={0} className="w-field-md shrink-0">
                  <Field label="Order Value Range" required>
                    {({ id, required, describedBy }) => (
                      <Inline gap={0} className="flex-nowrap">
                        <InputField
                          id={id}
                          required={required}
                          aria-describedby={describedBy}
                          readOnly={!editable}
                          format="numeric"
                          prefix="INR"
                          align="end"
                          value={f.rangeFrom}
                          onChange={(e) => set({ rangeFrom: e.target.value })}
                          className="min-w-0 rounded-e-none border-e-0"
                        />
                        <InputField
                          aria-label="Order value range, to, INR"
                          readOnly={!editable}
                          format="numeric"
                          prefix="To"
                          affix="plain"
                          align="end"
                          value={f.rangeTo}
                          onChange={(e) => set({ rangeTo: e.target.value })}
                          className="min-w-0 rounded-s-none border-s-0"
                        />
                      </Inline>
                    )}
                  </Field>
                </Stack>
                ) : null}

                <Inline gap={6} align="end" className="flex-nowrap">
                  <Stack gap={0} className={`${rateWidth} shrink-0`}>
                    <Field label="For Every" required>
                      {({ id, required, describedBy }) => (
                        <InputField id={id} required={required} aria-describedby={describedBy} readOnly={!editable} format="numeric" prefix="INR" align="end" value={f.forEvery} onChange={(e) => set({ forEvery: e.target.value })} />
                      )}
                    </Field>
                  </Stack>

                  <Inline gap={0} align="center" className="h-control">
                    <Icon name="chevron-right" size="md" tone="primary" />
                    <Icon name="chevron-right" size="md" tone="primary" />
                  </Inline>

                  <Stack gap={0} className={`${rateWidth} shrink-0`}>
                    <Field label="Points Earned" required>
                      {({ id, required, describedBy }) => (
                        <InputField id={id} required={required} aria-describedby={describedBy} readOnly={!editable} format="numeric" prefix="Points" align="end" value={f.pointsEarned} onChange={(e) => set({ pointsEarned: e.target.value })} />
                      )}
                    </Field>
                  </Stack>

                  <V3InfoTip tip={POINTS_EARNED_TIP} />
                </Inline>
              </Inline>

              {/*  Rendered for completeness, but not part of this review.  */}
              {multiple ? (
                <Button type="button" emphasis="tertiary" size="sm" icon="plus-circle" disabled className="self-start -ms-3">
                  Add New Range
                </Button>
              ) : null}
            </Stack>

            <Inline gap={6} align="end" className="flex-nowrap">
              <Stack gap={0} className="w-field-md shrink-0">
                <Field label="Amount per Point" required>
                  {({ id, required, describedBy }) => (
                    <InputField id={id} required={required} aria-describedby={describedBy} readOnly={!editable} format="numeric" prefix="INR" align="end" value={f.amountPerPoint} onChange={(e) => set({ amountPerPoint: e.target.value })} />
                  )}
                </Field>
              </Stack>
              <V3InfoTip tip={AMOUNT_PER_POINT_TIP} />
            </Inline>
          </V3OptionCard>

          {/*  3. REDEMPTION & EXPIRY — one box, now three groups in V3:
               Availability → Redemption → Expiry.  */}
          <V3UsageCard form={f} onChange={set} variant="sale" />
          </Stack>
        </Stack>

        {/*  RIGHT COLUMN — stretched to the form's height so the preview has a
             track to stick in.  */}
        <Stack gap={8} className="self-stretch w-settings-aside shrink-0">
          {/*  6. LIVE PREVIEW  */}
          <Stack gap={0} className="sticky top-10 max-h-settings-sticky-max overflow-y-auto overscroll-contain">
          <Surface tone="sunken" radius="xl" pad={12}>
            <Stack gap={10}>
              {/*  Show / hide: the heading stays, the body collapses.  */}
              <Inline gap={4} justify="between" align="start" className="flex-nowrap">
                <Stack gap={2} className="min-w-0">
                  <Text as="h2" size="subheading" weight="regular">Live preview</Text>
                  <Text size="body" tone="secondary">What a customer experiences at checkout.</Text>
                </Stack>
                <Button type="button" emphasis="tertiary" size="sm" iconRight={previewOpen ? 'chevron-up' : 'chevron-down'} aria-expanded={previewOpen} onClick={() => onPreviewOpenChange(!previewOpen)}>
                  {previewOpen ? 'Hide' : 'Show'}
                </Button>
              </Inline>

              {previewOpen ? (
              <>

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

              <Stack gap={6}>
                <Text size="overline" tone="tertiary">Try a checkout</Text>
                <Surface tone="default" radius="lg" border="divider" pad={8}>
                  <Stack gap={8}>
                    {/*  Pending off: V2's single balance, exactly. Pending on:
                         available and pending points, and when the pending
                         batch was earned.  */}
                    {!f.pendingOn ? (
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
                    ) : (
                      <>
                        <Field label="Available points">
                          {({ id, describedBy }) => (
                            <InputField
                              id={id}
                              aria-describedby={describedBy}
                              format="numeric"
                              prefix="Points"
                              align="end"
                              value={available}
                              onChange={(e) => setAvailable(e.target.value)}
                            />
                          )}
                        </Field>
                        <Field label="Pending points">
                          {({ id, describedBy }) => (
                            <InputField
                              id={id}
                              aria-describedby={describedBy}
                              format="numeric"
                              prefix="Points"
                              align="end"
                              value={pending}
                              onChange={(e) => setPending(e.target.value)}
                            />
                          )}
                        </Field>
                        <Field label="Earned on">
                          {({ id, describedBy }) => (
                            <DatePicker id={id} ariaDescribedBy={describedBy} value={earnedOn} onChange={setEarnedOn} />
                          )}
                        </Field>
                      </>
                    )}
                    <Field label="Checkout date">
                      {({ id, describedBy }) => (
                        <DatePicker id={id} ariaDescribedBy={describedBy} value={checkoutDate} onChange={setCheckoutDate} />
                      )}
                    </Field>

                    <Divider gap="none" />

                    <Stack gap={6}>
                      {checks.map((c) => (
                        <V3CheckRow key={c.title} check={c} />
                      ))}
                    </Stack>

                    <Banner tone={blocker ? 'danger' : 'success'}>
                      {blocker
                        ? `Can't redeem — ${blocker.title.toLowerCase()}.`
                        : `Can redeem ${pts} points — INR ${worth} off.${stillPending}`}
                    </Banner>
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
