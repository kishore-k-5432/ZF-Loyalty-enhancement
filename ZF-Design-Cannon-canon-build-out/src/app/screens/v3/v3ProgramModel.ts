import { todayIso, toIso, v3Period as period } from './v3Shared';

/*  VERSION 3 — the program model.

    A loyalty program has a TYPE, chosen at creation and fixed afterwards:
      · Points per sale   — earns on a bill (the program V1/V2 configure).
      · Scheduled points  — awards on a date, once or repeating, at a rate on
        purchase value.
        A standalone program: its own point value, and Points per sale's usage
        card without the Redemption Window.  */

export type ProgramType = 'sale' | 'scheduled';

export const PROGRAM_TYPE_LABEL: Record<ProgramType, string> = {
  sale: 'Points per sale',
  scheduled: 'Scheduled points',
};

/*  The program dates — Program Start Date, Never Expire and, when Never
    Expire is off, Program End Date, under General Details. Both types.
    `programDates` is kept from the old Schedule Program card but unused.  */
export type ScheduleDates = {
  programDates: boolean;
  programStart: string;
  programEnd: string;
  neverExpire: boolean;
};

/*  The Points Usage Configuration card's fields — both types. A Scheduled
    points program shows only the minimum points and Expiry; its pending and window fields stay off.  */
export type UsageFields = {
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
};

/*  Everything a Points per sale program configures (V2's form + V3 pending).  */
export type SaleForm = ScheduleDates & UsageFields & {
  loyaltyType: string;
  rangeFrom: string;
  rangeTo: string;
  forEvery: string;
  pointsEarned: string;
  amountPerPoint: string;
};

/*  Everything a Scheduled points program configures. STANDALONE: its own
    point value, and the usage fields — of which only minimum points and
    expiry are shown; pending and the redemption window stay off.  */
/*  The recurrence (`v3spRecurrence`), trimmed from the Inventory stock-count
    scheduler: an interval in months or years, and which day of the period
    the award falls on. It always repeats (no "Does not repeat", no award
    date — `awardDate` is unused) and starts from the program start date: the first
    award is the first matching day on or after it.  */
export type IntervalUnit = 'months' | 'years';
export type AwardOnMode = 'date' | 'day';
export type WeekOrdinal = 'first' | 'second' | 'third' | 'fourth' | 'last';
export type Recurrence = {
  repeats: boolean;
  /** 1–12 months, or 1–5 years. Digits. */
  intervalCount: string;
  intervalUnit: IntervalUnit;
  awardOn: AwardOnMode;
  /** A specific date: day 1–28 of the month. Digits. */
  awardDay: string;
  /** A specific day: the nth weekday. */
  awardWeek: WeekOrdinal;
  /** 0 Sunday … 6 Saturday. */
  awardWeekday: number;
  /** Yearly intervals: 0 January … 11 December. */
  awardMonth: number;
  /** Every quarter: which month of each calendar quarter — 0 first
      (Jan, Apr, Jul, Oct), 1 second, 2 third. */
  quarterMonth: number;
};
/*  Points on purchase value, as in Points per sale's Loyalty Type:
      · single   — one rate, "for every INR X, Y points".
      · multiple — ranges: the total falls into one range and that range's
        rate applies to all of it. An empty `to` on the last range means
        "and above".  */
export type ScheduledLoyaltyType = 'single' | 'multiple';
export type RateRange = { id: string; from: string; to: string; forEvery: string; points: string };

export type ScheduledForm = ScheduleDates & UsageFields & Recurrence & {
  /** The award date when it does not repeat (repeating runs from the program start). ISO. */
  awardDate: string;
  loyaltyType: ScheduledLoyaltyType;
  /** Single Criteria. */
  forEvery: string;
  points: string;
  /** Multiple Criteria. */
  ranges: RateRange[];
  amountPerPoint: string;
};

export type ProgramRecord = {
  id: string;
  name: string;
  description: string;
  type: ProgramType;
  active: boolean;
  /** Used when `type` is 'sale'. */
  sale: SaleForm;
  /** Used when `type` is 'scheduled'. */
  scheduled: ScheduledForm;
};

const PROGRAM_DATES: ScheduleDates = {
  programDates: true, programStart: '2026-10-01', programEnd: '', neverExpire: true,
};
const NO_DATES: ScheduleDates = {
  programDates: false, programStart: '', programEnd: '', neverExpire: false,
};

/*  "Everyday Rewards" — the program V1/V2 show, plus V3's pending fields.  */
export const EXISTING_SALE: SaleForm = {
  ...PROGRAM_DATES,
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
  //  Off, because Points Expiration is on and the two cannot both be (V2).
  redemptionStartOn: false,
  redemptionStart: '2026-10-15',
  redemptionEnd: '2026-12-31',
  pointsExpiration: true,
  expirationMode: 'earning',
  expiryCount: '3',
  expiryUnit: 'months',
  expiryDate: '',
};

/*  A new Points per sale program: nothing prefilled. Text and dates empty,
    every checkbox and toggle off, no option chosen. Unit and frequency
    selects keep their first option — a unit is not data.  */
export const BLANK_SALE: SaleForm = {
  ...NO_DATES,
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
};

/*  The usage fields, all off and empty.  */
const BLANK_USAGE: UsageFields = {
  pendingOn: false, releaseMode: '', pendingCount: '', pendingUnit: 'days', releaseFrequency: 'monthly', releaseDay: '',
  minPoints: false, minPointValue: '', redemptionStartOn: false, redemptionStart: '', redemptionEnd: '',
  pointsExpiration: false, expirationMode: '', expiryCount: '', expiryUnit: 'days', expiryDate: '',
};

/*  The first day of the next calendar quarter, from today.  */
export function nextQuarterStart(today = todayIso()): string {
  const [y, m] = today.split('-').map(Number);
  return toIso(new Date(y, Math.floor((m - 1) / 3) * 3 + 3, 1));
}

export function seedRanges(): RateRange[] {
  return [
    { id: 'range-1', from: '75000', to: '150000', forEvery: '1000', points: '1' },
    { id: 'range-2', from: '150000', to: '300000', forEvery: '1000', points: '2' },
    { id: 'range-3', from: '300000', to: '', forEvery: '1000', points: '3' },
  ];
}

/*  A new Scheduled points program, with the spec's defaults: a custom date on
    the first day of next quarter, not repeating, the seed ranges, INR 1 a
    point. Usage starts off, as in a new Points per sale program.  */
export function blankScheduled(): ScheduledForm {
  const date = nextQuarterStart();
  return {
    ...NO_DATES,
    ...BLANK_USAGE,
    awardDate: date,
    repeats: true,
    intervalCount: '1',
    intervalUnit: 'months',
    awardOn: 'date',
    awardDay: '1',
    awardWeek: 'first',
    awardWeekday: 0,
    awardMonth: 0,
    quarterMonth: 0,
    loyaltyType: 'multiple',
    forEvery: '1000',
    points: '1',
    ranges: seedRanges(),
    amountPerPoint: '1',
  };
}

export const SEED_TARGET_ID = 'p-everyday';

export const SEED_PROGRAMS: ProgramRecord[] = [
  {
    id: SEED_TARGET_ID, name: 'Everyday Rewards', description: 'Earn points on every purchase at any store.', type: 'sale', active: true,
    sale: EXISTING_SALE, scheduled: blankScheduled(),
  },
  {
    id: 'p-diwali', name: 'Diwali bonus', description: 'Festive bonus points based on the year\'s purchases', type: 'scheduled', active: true,
    sale: BLANK_SALE,
    scheduled: {
      ...blankScheduled(), ...PROGRAM_DATES,
      awardDate: '2026-10-25', repeats: true, intervalCount: '1', intervalUnit: 'years', awardDay: '25', awardMonth: 9,
      pointsExpiration: true, expirationMode: 'date', expiryDate: '2026-11-10',
    },
  },
  {
    id: 'p-quarterly', name: 'Quarterly purchase rewards', description: 'Points by last quarter\'s purchase value', type: 'scheduled', active: true,
    sale: BLANK_SALE,
    scheduled: {
      ...blankScheduled(), ...PROGRAM_DATES, programEnd: '2027-12-31',
      awardDate: '2027-01-01', repeats: true, intervalCount: '3', intervalUnit: 'months', awardDay: '1',
      minPoints: true, minPointValue: '100',
      pointsExpiration: true, expirationMode: 'earning', expiryCount: '30', expiryUnit: 'days',
    },
  },
  {
    id: 'p-annual', name: 'Annual purchase bonus', description: 'Points once a year on the year\'s purchase value', type: 'scheduled', active: true,
    sale: BLANK_SALE,
    scheduled: { ...blankScheduled(), ...PROGRAM_DATES, awardDate: '2027-01-01', repeats: true, intervalCount: '1', intervalUnit: 'years', awardDay: '1', awardMonth: 0,
      pointsExpiration: true, expirationMode: 'earning', expiryCount: '30', expiryUnit: 'days',
    },
  },
];

/*  The program's own date bounds. `end` is null while Never Expire is on.  */
export function dateBounds(d: ScheduleDates): { start: string | null; end: string | null } {
  return { start: d.programStart || null, end: d.neverExpire ? null : d.programEnd || null };
}

/*  Program End Date errors: missing (once Save is tried), or before the start.  */
export function endDateError(d: ScheduleDates, tried: boolean): string | undefined {
  if (d.neverExpire) return undefined;
  if (!d.programEnd) return tried ? 'Select the program end date, or tick Never Expire.' : undefined;
  if (d.programStart && d.programEnd < d.programStart) return "The end date can't be before the start date.";
  return undefined;
}

/*  "15 days after earning". (The fixed-date release method was removed.)  */
export function releaseLabel(u: UsageFields): string {
  return `${period(u.pendingCount, u.pendingUnit)} after earning`;
}

export function cloneRecord(r: ProgramRecord): ProgramRecord {
  return JSON.parse(JSON.stringify(r)) as ProgramRecord;
}

/*  A new program of `type`, nothing prefilled.  */
export function blankRecord(type: ProgramType): ProgramRecord {
  return {
    id: '', name: '', description: '', type, active: true,
    sale: { ...BLANK_SALE }, scheduled: blankScheduled(),
  };
}

/*  The Preferences tab — org-wide loyalty settings, as in the live product.  */
export type LoyaltyPrefs = {
  enabled: boolean;
  allowAdjust: boolean;
  roundOff: boolean;
  deductOnReturn: boolean;
  restrictOnRedeem: boolean;
  excludeTax: boolean;
  retainOnSwitch: boolean;
  /** With retainOnSwitch: keep the points as they are, or re-apply the new program's rules. */
  retainMode: 'as-is' | 'new-rules';
};

export const DEFAULT_PREFS: LoyaltyPrefs = {
  enabled: true,
  allowAdjust: false,
  roundOff: false,
  deductOnReturn: false,
  restrictOnRedeem: true,
  excludeTax: false,
  retainOnSwitch: false,
  retainMode: 'as-is',
};
