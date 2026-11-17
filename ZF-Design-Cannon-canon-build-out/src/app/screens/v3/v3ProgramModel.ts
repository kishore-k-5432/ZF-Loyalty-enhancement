import { blankCriteriaRow, clampDay, v3Period as period } from './v3Shared';
import type { CriteriaRow, TriggerValue } from './v3Shared';

/*  VERSION 3 — the program model.

    A loyalty program has a TYPE, chosen at creation and fixed afterwards:
      · Points per sale   — earns on a bill (the program V1/V2 configure).
      · Scheduled points  — awards on a date-based trigger. A standalone
        program: its own point value, pending period and expiry, but no
        Redemption group.  */

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

/*  Everything a Scheduled points program configures. It is STANDALONE: its
    own point value, availability and expiry — no Redemption group.  */
export type ScheduledForm = ScheduleDates & TriggerValue & UsageFields & {
  amountPerPoint: string;
  conditionsOn: boolean;
  criteria: CriteriaRow[];
  points: string;
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

/*  A new Scheduled points program — trigger defaults from the spec (recurring
    monthly on day 1, weekly on Mon if switched, 50 points); nothing else set.  */
export function blankScheduled(): ScheduledForm {
  return {
    ...NO_DATES,
    ...BLANK_USAGE,
    trigger: 'recurring',
    frequency: 'monthly',
    weekdays: ['Mon'],
    monthDay: '1',
    amountPerPoint: '',
    conditionsOn: false,
    criteria: [blankCriteriaRow()],
    points: '50',
  };
}

/*  The seeded scheduled programs: INR 10 a point, expiring 3 months after
    they are awarded, no pending period.  */
const SEEDED_SCHEDULED: ScheduledForm = {
  ...blankScheduled(),
  ...PROGRAM_DATES,
  amountPerPoint: '10',
  pointsExpiration: true,
  expirationMode: 'earning',
  expiryCount: '3',
  expiryUnit: 'months',
  minPoints: true,
  minPointValue: '100',
};

export const SEED_TARGET_ID = 'p-everyday';

export const SEED_PROGRAMS: ProgramRecord[] = [
  {
    id: SEED_TARGET_ID, name: 'Everyday Rewards', description: 'Earn points on every purchase at any store.', type: 'sale', active: true,
    sale: EXISTING_SALE, scheduled: blankScheduled(),
  },
  {
    id: 'p-birthday', name: 'Birthday bonus', description: 'Points on customer\'s birthday', type: 'scheduled', active: true,
    sale: BLANK_SALE,
    scheduled: { ...SEEDED_SCHEDULED, trigger: 'birthday', points: '100' },
  },
  {
    id: 'p-monthly', name: 'Monthly regulars', description: 'Monthly bonus for repeat customers', type: 'scheduled', active: true,
    sale: BLANK_SALE,
    scheduled: {
      ...SEEDED_SCHEDULED,
      conditionsOn: true,
      criteria: [
        { id: 'seed-c1', join: 'AND', field: 'group', comparator: 'in', value: '', values: ['Gold'] },
        { id: 'seed-c2', join: 'AND', field: 'purchases', comparator: 'gt', value: '2', values: [] },
      ],
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
