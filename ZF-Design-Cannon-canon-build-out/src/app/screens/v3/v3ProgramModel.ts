import { clampDay, todayIso, toIso, v3Period as period } from './v3Shared';

/*  VERSION 3 — the program model.

    A loyalty program has a TYPE, chosen at creation and fixed afterwards:
      · Points per sale   — earns on a bill (the program V1/V2 configure).
      · Scheduled points  — awards on an occasion (a custom date, or each
        customer's membership anniversary), at a rate on purchase value.
        A standalone program: its own point value, minimum points and expiry
        (Points per sale's usage card without Availability or the window).  */

export type ProgramType = 'sale' | 'scheduled';

export const PROGRAM_TYPE_LABEL: Record<ProgramType, string> = {
  sale: 'Points per sale',
  scheduled: 'Scheduled points',
};

/*  The program dates — the right rail's Schedule Program card. Both types.  */
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
export type Occasion = 'anniversary' | 'custom';
/*  'none': awarded once, on the date.  */
export type RepeatEvery = 'month' | 'quarter' | 'year' | 'none';
/*  Points on purchase value, drawn like Points per sale's Multiple Criteria:
    the total for the purchase period falls into one range and that range's
    rate applies to all of it. An empty `to` on the last range means "and
    above".  */
export type PurchasePeriod = '1m' | '3m' | '6m' | '12m';
export const PURCHASE_PERIOD_LABEL: Record<PurchasePeriod, string> = {
  '1m': 'Last 1 month',
  '3m': 'Last 3 months',
  '6m': 'Last 6 months',
  '12m': 'Last 12 months',
};
export type RateRange = { id: string; from: string; to: string; forEvery: string; points: string };

export type ScheduledForm = ScheduleDates & UsageFields & {
  occasion: Occasion;
  /** Custom date only. ISO. */
  awardDate: string;
  /** Custom date only. */
  repeat: RepeatEvery;
  /** Where the purchase value is counted from. */
  purchasePeriod: PurchasePeriod;
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
  programDates: true, programStart: '2026-10-01', programEnd: '2026-12-31', neverExpire: false,
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
    the first day of next quarter, every quarter, the seed ranges, INR 1 a
    point. Usage starts off, as in a new Points per sale program.  */
export function blankScheduled(): ScheduledForm {
  const date = nextQuarterStart();
  return {
    ...NO_DATES,
    ...BLANK_USAGE,
    occasion: 'custom',
    awardDate: date,
    repeat: 'quarter',
    purchasePeriod: '1m',
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
      awardDate: '2026-10-25', repeat: 'year', purchasePeriod: '12m',
      pointsExpiration: true, expirationMode: 'date', expiryDate: '2026-11-10',
    },
  },
  {
    id: 'p-quarterly', name: 'Quarterly purchase rewards', description: 'Points by last quarter\'s purchase value', type: 'scheduled', active: true,
    sale: BLANK_SALE,
    //  The 1 Apr 2027 award needs program dates that reach it.
    scheduled: {
      ...blankScheduled(), ...PROGRAM_DATES, programEnd: '2027-12-31',
      awardDate: '2027-04-01', repeat: 'quarter', purchasePeriod: '3m',
      minPoints: true, minPointValue: '100',
      pointsExpiration: true, expirationMode: 'earning', expiryCount: '30', expiryUnit: 'days',
    },
  },
  {
    id: 'p-anniversary', name: 'Membership anniversary bonus', description: 'Points on each customer\'s membership anniversary', type: 'scheduled', active: true,
    sale: BLANK_SALE,
    scheduled: { ...blankScheduled(), ...PROGRAM_DATES, occasion: 'anniversary', purchasePeriod: '12m',
      pointsExpiration: true, expirationMode: 'earning', expiryCount: '30', expiryUnit: 'days',
    },
  },
];

/*  The program's own date bounds, or nulls when it has none.  */
export function dateBounds(d: ScheduleDates): { start: string | null; end: string | null } {
  const bounded = d.programDates && !d.neverExpire;
  return {
    start: bounded && d.programStart ? d.programStart : null,
    end: bounded && d.programEnd ? d.programEnd : null,
  };
}

/*  "15 days after earning" / "On day 1 of every month".  */
export function releaseLabel(u: UsageFields): string {
  return u.releaseMode === 'fixed'
    ? `On day ${clampDay(u.releaseDay)} of every ${u.releaseFrequency === 'quarterly' ? 'quarter' : 'month'}`
    : `${period(u.pendingCount, u.pendingUnit)} after earning`;
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
