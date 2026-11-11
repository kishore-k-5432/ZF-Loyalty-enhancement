import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { SettingsLink } from '@canon';
import {
  Banner, Button, Checkbox, DatePicker, Divider, Field, Icon, Inline, InputField,
  RadioGroup, Select, SettingsShell, Stack, Surface, Text, Textarea, Toggle, Tooltip,
} from '@canon';
import { COMMERCE_MARK } from '../data/books-marks';
import { SETTINGS_SECTIONS } from '../data/settings';
import {
  SEED_CAMPAIGNS, V3CheckRow, V3InfoTip, V3OptionCard, V3RuleRow,
  blankCampaign, clampDay, fixedReleaseDate, newId, shiftPeriod, toDays, v3Fmt as fmt,
  v3MinusPeriod as minusPeriod, v3Period as period,
} from './v3/v3Shared';
import type { Campaign, ProgramInfo, V3Check as Check } from './v3/v3Shared';
import { V3LoyaltyLanding } from './v3/V3LoyaltyLanding';
import type { V3Tab } from './v3/V3LoyaltyLanding';
import { V3CampaignEditor } from './v3/V3CampaignEditor';

/*  VERSION 3 — Periodic Loyalty + Scheduled Points. Open with #v3.

    Started as an exact copy of LoyaltyV2.tsx. V1 and V2 are untouched and are
    not imported from: a V2 change reaches V3 only when it is copied across
    on purpose.

    Three screens, switched by state (no router):
      1. Edit Loyalty Program — V2 plus the Availability (pending period)
         subsection, its expiry interplay and its live-preview rows.
      2. Loyalty Program landing — Preferences · Programs · Campaigns.
      3. New / Edit Campaign.
    All state is held here so the campaign screen can read the program's
    pending period and dates. No backend, no persistence.  */

export interface LoyaltyV3Props {
  onClose: () => void;
  /** The V1 | V2 | V3 switch, rendered beside the page title. Owned by `App`. */
  versionSwitch?: ReactNode;
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

const POINTS_EARNED_TIP = 'Number of loyalty points a customer earns for every qualifying unit spent in this order value range.';
/*  Redemption Window and Points Expiration are mutually exclusive (as in V2):
    only one can be on. The one that is off is disabled, and says why on hover.  */
const EXPIRY_LOCKED_TIP = 'You can\'t enable Points Expiration while Redemption Window is enabled. Disable Redemption Window to use this option.';
const WINDOW_LOCKED_TIP = 'You can\'t enable Redemption Window while Points Expiration is enabled. Disable Points Expiration to use this option.';
const AMOUNT_PER_POINT_TIP = 'The monetary value of one loyalty point when redeemed. For example, if set to 10, then 100 points = INR 1,000 off.';
const PENDING_TIP = 'Use this to protect against returns. Points from a returned bill are cancelled while still pending, so nothing needs to be clawed back.';

type Screen = 'edit' | 'landing' | 'campaign';

/*  Everything Screen 1 edits, as one object, so the same form can show the
    existing program or a blank new one.  */
type ProgramForm = {
  name: string;
  description: string;
  loyaltyType: string;
  rangeFrom: string;
  rangeTo: string;
  forEvery: string;
  pointsEarned: string;
  amountPerPoint: string;
  //  Availability — the pending period (V3)
  pendingOn: boolean;
  releaseMode: string;
  pendingCount: string;
  pendingUnit: string;
  releaseFrequency: string;
  releaseDay: string;
  //  Redeeming preferences
  minPoints: boolean;
  minPointValue: string;
  redemptionStartOn: boolean;
  redemptionStart: string;
  redemptionEnd: string;
  //  Points expiration
  pointsExpiration: boolean;
  expirationMode: string;
  expiryCount: string;
  expiryUnit: string;
  expiryDate: string;
  //  Schedule program
  programDates: boolean;
  programStart: string;
  programEnd: string;
  neverExpire: boolean;
};

/*  The program that already exists — "testing loyality".  */
const EXISTING_PROGRAM: ProgramForm = {
  name: 'testing loyality',
  description: '',
  loyaltyType: 'multiple',
  rangeFrom: '1',
  rangeTo: '100',
  forEvery: '1',
  pointsEarned: '10',
  amountPerPoint: '10',
  pendingOn: false,
  releaseMode: 'period',
  pendingCount: '15',
  pendingUnit: 'days',
  releaseFrequency: 'monthly',
  releaseDay: '1',
  minPoints: true,
  minPointValue: '100',
  //  Off, because Points Expiration is on and the two cannot both be.
  redemptionStartOn: false,
  redemptionStart: '2026-10-15',
  redemptionEnd: '2026-12-31',
  pointsExpiration: true,
  expirationMode: 'earning',
  expiryCount: '3',
  expiryUnit: 'months',
  expiryDate: '',
  programDates: true,
  programStart: '2026-10-01',
  programEnd: '2026-12-31',
  neverExpire: false,
};

/*  New Loyalty Program: nothing prefilled. Text and dates empty, every
    checkbox and toggle off, no option chosen. Unit and frequency selects
    keep their first option — a unit is not data.  */
const BLANK_PROGRAM: ProgramForm = {
  name: '',
  description: '',
  loyaltyType: '',
  rangeFrom: '',
  rangeTo: '',
  forEvery: '',
  pointsEarned: '',
  amountPerPoint: '',
  pendingOn: false,
  releaseMode: '',
  pendingCount: '',
  pendingUnit: 'days',
  releaseFrequency: 'monthly',
  releaseDay: '',
  minPoints: false,
  minPointValue: '',
  redemptionStartOn: false,
  redemptionStart: '',
  redemptionEnd: '',
  pointsExpiration: false,
  expirationMode: '',
  expiryCount: '',
  expiryUnit: 'days',
  expiryDate: '',
  programDates: false,
  programStart: '',
  programEnd: '',
  neverExpire: false,
};

/*  What the campaign screen reads from a program.  */
function programInfo(p: ProgramForm): ProgramInfo {
  const bounded = p.programDates && !p.neverExpire;
  return {
    name: p.name,
    pendingOn: p.pendingOn,
    start: bounded && p.programStart ? p.programStart : null,
    end: bounded && p.programEnd ? p.programEnd : null,
    expiry: !p.pointsExpiration ? 'points never expire'
      : p.expirationMode === 'earning' ? `${period(p.expiryCount, p.expiryUnit)} after earning`
        : `all expire on ${fmt(p.expiryDate)}`,
  };
}

export function LoyaltyV3({ onClose, versionSwitch }: LoyaltyV3Props) {
  //  Which V3 screen is showing
  const [screen, setScreen] = useState<Screen>('edit');
  const [tab, setTab] = useState<V3Tab>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>(SEED_CAMPAIGNS);
  const [editing, setEditing] = useState<{ campaign: Campaign; isNew: boolean } | null>(null);
  const [showEmpty, setShowEmpty] = useState(false);
  const [toast, setToast] = useState('');

  //  Screen 1's form: the existing program, or a blank draft for a new one.
  //  The draft is thrown away and started afresh on every "New".
  const [existing, setExisting] = useState<ProgramForm>(EXISTING_PROGRAM);
  const [draft, setDraft] = useState<ProgramForm>(BLANK_PROGRAM);
  const [isNewProgram, setIsNewProgram] = useState(false);
  const f = isNewProgram ? draft : existing;
  const set = (patch: Partial<ProgramForm>) =>
    (isNewProgram ? setDraft : setExisting)((prev) => ({ ...prev, ...patch }));

  //  Live preview simulator — a hypothetical customer at the till.
  //  V3 splits the balance into available and pending points.
  const [available, setAvailable] = useState('210');
  const [pending, setPending] = useState('40');
  const [checkoutDate, setCheckoutDate] = useState('2026-11-10');
  const [earnedOn, setEarnedOn] = useState(() => shiftPeriod('2026-11-10', -5, 'days'));

  //  The "Campaign saved" toast clears itself.
  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);

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
  const releaseLabel = f.releaseMode === 'period'
    ? `${period(f.pendingCount, f.pendingUnit)} after earning`
    : `On day ${day} of every ${f.releaseFrequency === 'quarterly' ? 'quarter' : 'month'}`;
  const releaseHelper = f.releaseFrequency === 'quarterly'
    ? `Points earned in July–September become available on ${day} October.`
    : `Points earned in October become available on ${day} November.`;

  /* ── LIVE PREVIEW — derived from state on every render ─────────────────── */
  const availablePts = Number(available) || 0;
  const pendingPts = f.pendingOn ? Number(pending) || 0 : 0;
  const unlockOn = !f.pendingOn ? ''
    : f.releaseMode === 'period'
      ? shiftPeriod(earnedOn, Number(f.pendingCount) || 0, f.pendingUnit)
      : fixedReleaseDate(earnedOn, f.releaseFrequency, day);
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

  /*  Campaigns belong to the existing program, so they always read it — never
      the new-program draft.  */
  const program = programInfo(existing);

  const openProgram = (asNew: boolean) => {
    if (asNew) setDraft(BLANK_PROGRAM);
    setIsNewProgram(asNew);
    setScreen('edit');
  };
  const backToPrograms = () => {
    setIsNewProgram(false);
    setTab('programs');
    setScreen('landing');
  };

  /*  The settings rail's "Loyalty Program" is the way in to the landing
      page, which opens on the Programs tab. Other rail items do nothing in
      this POC (and must not follow their href, which would change the hash).  */
  const onNavigate = (leaf: SettingsLink) => {
    if (leaf.id !== 'loyalty-program') return;
    setEditing(null);
    backToPrograms();
  };

  const openCampaign = (c: Campaign | null) => {
    setEditing(c ? { campaign: c, isNew: false } : { campaign: blankCampaign(program), isNew: true });
    setScreen('campaign');
  };

  const saveCampaign = (c: Campaign) => {
    setCampaigns((prev) => (c.id
      ? prev.map((x) => (x.id === c.id ? c : x))
      : [...prev, { ...c, id: newId('campaign') }]));
    setEditing(null);
    setShowEmpty(false);
    setTab('campaigns');
    setScreen('landing');
    setToast('Campaign saved');
  };

  /* ── Screens 2 and 3 ───────────────────────────────────────────────────── */
  if (screen === 'landing') {
    return (
      <V3LoyaltyLanding
        tab={tab}
        onTabChange={setTab}
        campaigns={campaigns}
        onOpenProgram={() => openProgram(false)}
        onNewProgram={() => openProgram(true)}
        onOpenCampaign={openCampaign}
        showEmpty={showEmpty}
        onShowEmptyChange={setShowEmpty}
        toast={toast}
        onDismissToast={() => setToast('')}
        onNavigate={onNavigate}
        versionSwitch={versionSwitch}
      />
    );
  }

  if (screen === 'campaign' && editing) {
    return (
      <V3CampaignEditor
        key={editing.campaign.id || 'new'}
        initial={editing.campaign}
        isNew={editing.isNew}
        program={program}
        onSave={saveCampaign}
        onCancel={() => { setEditing(null); setTab('campaigns'); setScreen('landing'); }}
        onNavigate={onNavigate}
        versionSwitch={versionSwitch}
      />
    );
  }

  /* ── Screen 1: Edit Loyalty Program ────────────────────────────────────── */
  return (
    <SettingsShell
      sections={SETTINGS_SECTIONS}
      currentId="loyalty-program"
      onNavigate={onNavigate}
      mark={COMMERCE_MARK}
      title="All Settings"
      org="Nithish & co"
      searchPlaceholder="Search settings ( / )"
      onBack={() => undefined}
      onClose={() => undefined}
      header={(
        <Inline justify="between" align="center" grow>
          <Inline gap={8} align="center">
            <Text as="h1" size="title" weight="regular">{isNewProgram ? 'New Loyalty Program' : 'Edit Loyalty Program'}</Text>
            {versionSwitch}
          </Inline>
          <Button type="button" emphasis="tertiary" size="md" icon="close" label="Close editor" onClick={onClose} />
        </Inline>
      )}
      footer={(
        <Stack gap={0}>
          <Divider gap="none" />
          <Inline gap={5} className="px-10 py-6">
            {isNewProgram ? (
              <>
                <Button type="button" emphasis="primary" size="md" onClick={() => { alert('Program saved (POC — no backend)'); backToPrograms(); }}>
                  Save
                </Button>
                <Button type="button" emphasis="secondary" size="md" onClick={backToPrograms}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button type="button" emphasis="primary" size="md" onClick={() => alert('Config saved (POC — no backend)')}>
                  Save
                </Button>
                <Button type="button" emphasis="secondary" size="md" onClick={() => alert('Changes discarded (POC)')}>
                  Cancel
                </Button>
              </>
            )}
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
                  <InputField id={id} required={required} aria-describedby={describedBy} readOnly={!isNewProgram} value={f.name} onChange={(e) => set({ name: e.target.value })} />
                )}
              </Field>
            </Stack>

            <Stack gap={0} className="w-field-xl shrink-0">
              <Field label="Description">
                {({ id, describedBy }) => (
                  <Textarea id={id} aria-describedby={describedBy} rows={3} readOnly={!isNewProgram} value={f.description} onChange={(e) => set({ description: e.target.value })} />
                )}
              </Field>
            </Stack>
          </Stack>

          {/*  2. POINTS REWARDING RULES — read-only for the POC. Its own box.  */}
          <Stack gap={16} className="pt-15 max-w-settings-form">
          <V3OptionCard title="Points Rewarding Rules" icon="gift">

            <RadioGroup
              label="Loyalty Type"
              required
              disabled={!isNewProgram}
              layout="inline"
              value={f.loyaltyType}
              onChange={(v) => set({ loyaltyType: v })}
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
                          readOnly={!isNewProgram}
                          format="numeric"
                          prefix="INR"
                          align="end"
                          value={f.rangeFrom}
                          onChange={(e) => set({ rangeFrom: e.target.value })}
                          className="min-w-0 rounded-e-none border-e-0"
                        />
                        <InputField
                          aria-label="Order value range, to, INR"
                          readOnly={!isNewProgram}
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

                <Inline gap={6} align="end" className="flex-nowrap">
                  <Stack gap={0} className="w-field-xs shrink-0">
                    <Field label="For Every" required>
                      {({ id, required, describedBy }) => (
                        <InputField id={id} required={required} aria-describedby={describedBy} readOnly={!isNewProgram} format="numeric" prefix="INR" align="end" value={f.forEvery} onChange={(e) => set({ forEvery: e.target.value })} />
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
                        <InputField id={id} required={required} aria-describedby={describedBy} readOnly={!isNewProgram} format="numeric" prefix="Points" align="end" value={f.pointsEarned} onChange={(e) => set({ pointsEarned: e.target.value })} />
                      )}
                    </Field>
                  </Stack>

                  <V3InfoTip tip={POINTS_EARNED_TIP} />
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
                    <InputField id={id} required={required} aria-describedby={describedBy} readOnly={!isNewProgram} format="numeric" prefix="INR" align="end" value={f.amountPerPoint} onChange={(e) => set({ amountPerPoint: e.target.value })} />
                  )}
                </Field>
              </Stack>
              <V3InfoTip tip={AMOUNT_PER_POINT_TIP} />
            </Inline>
          </V3OptionCard>

          {/*  3. REDEMPTION & EXPIRY — one box, now three groups in V3:
               Availability → Redemption → Expiry.  */}
          <V3OptionCard title="Points Usage Configuration" icon="hourglass">
            {/*  3a. AVAILABILITY (V3) — the pending period.  */}
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
          </Stack>
        </Stack>

        {/*  RIGHT COLUMN — stretched to the form's height so the preview has a
             track to stick in.  */}
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
                  <Toggle label="Enabled" labelPlacement="top" size="sm" checked={f.programDates} onCheckedChange={(v) => set({ programDates: v })} />
                </Inline>

                {f.programDates ? (
                  <>
                    <Field label="Program Start Date" required disabled={f.neverExpire}>
                      {({ id, required, describedBy }) => (
                        <DatePicker id={id} required={required} ariaDescribedBy={describedBy} disabled={f.neverExpire} value={f.programStart} onChange={(v) => set({ programStart: v })} />
                      )}
                    </Field>

                    <Field label="Program End Date" required disabled={f.neverExpire}>
                      {({ id, required, describedBy }) => (
                        <DatePicker id={id} required={required} ariaDescribedBy={describedBy} disabled={f.neverExpire} min={f.programStart} value={f.programEnd} onChange={(v) => set({ programEnd: v })} />
                      )}
                    </Field>

                    <Checkbox
                      label="Never Expire"
                      description="The program will remain active indefinitely."
                      selection={f.neverExpire ? 'checked' : 'unchecked'}
                      onSelectionChange={(next) => set({ neverExpire: next === 'checked' })}
                    />
                  </>
                ) : null}
              </Stack>
            </Stack>
          </Surface>

          {/*  6. LIVE PREVIEW  */}
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
                      <V3RuleRow icon={r.icon} label={r.label} value={r.value} on={r.on} />
                    </Stack>
                  ))}
                </Stack>
              </Surface>

              <Stack gap={6}>
                <Text size="overline" tone="tertiary">Try a checkout</Text>
                <Surface tone="default" radius="lg" border="divider" pad={8}>
                  <Stack gap={8}>
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
                    {f.pendingOn ? (
                      <>
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
                    ) : null}
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
            </Stack>
          </Surface>
          </Stack>
        </Stack>
      </Inline>
    </SettingsShell>
  );
}

