/**
 * Twenty-eight scheduled invoices. Application data, not design data — the canon
 * owns how a row looks, this owns what is in one.
 *
 * A scheduled invoice is an invoice with a FUTURE send date: `scheduledOn` is
 * when it goes out, `dueDate` is when payment is expected after it has. That
 * ordering is the record's whole point, so the two dates are separate fields and
 * never derived from one another.
 *
 * `status` is the record's own vocabulary; the screen maps it to a
 * `StatusBadge`. "Failed" is a fact about a send attempt, `failed` is a fact
 * about how it is drawn, and this file does not know the second one.
 */
export interface ScheduledInvoice {
  id: string;
  date: string;              // ISO — when the invoice was raised
  number: string;
  customer: string;
  status: 'Draft' | 'Scheduled' | 'Sent' | 'Paid' | 'Overdue' | 'Failed' | 'Cancelled';
  dueDate: string;           // ISO
  scheduledOn: string;       // ISO — when it will be, or was, sent
  amount: number;            // whole rupees
}

//  Every row is INTERNALLY CONSISTENT, because a screen full of contradictions
//  teaches nothing about the view: a Draft has no send date it can honour, a
//  Sent or Paid row is scheduled in the past, and a Scheduled row is scheduled
//  in the future. Today is 4 Sep 2026.
export const SCHEDULED_INVOICES: ScheduledInvoice[] = [
  { id: 'si-1',  date: '2026-09-01', number: 'INV-04412', customer: 'Kavery Packaging',           status: 'Scheduled', dueDate: '2026-10-15', scheduledOn: '2026-09-15', amount: 184500 },
  { id: 'si-2',  date: '2026-09-01', number: 'INV-04411', customer: 'Sundar Metalworks',          status: 'Scheduled', dueDate: '2026-10-10', scheduledOn: '2026-09-10', amount: 62400 },
  { id: 'si-3',  date: '2026-08-30', number: 'INV-04410', customer: 'Nilgiri Components Pvt Ltd', status: 'Sent',      dueDate: '2026-09-29', scheduledOn: '2026-08-30', amount: 921340 },
  { id: 'si-4',  date: '2026-08-28', number: 'INV-04409', customer: 'Anand Tooling',              status: 'Draft',     dueDate: '2026-10-05', scheduledOn: '2026-09-20', amount: 47215 },
  { id: 'si-5',  date: '2026-08-27', number: 'INV-04408', customer: 'Deccan Logistics',           status: 'Paid',      dueDate: '2026-09-11', scheduledOn: '2026-08-27', amount: 15980 },
  { id: 'si-6',  date: '2026-08-25', number: 'INV-04407', customer: 'Bharat Steel Traders',       status: 'Failed',    dueDate: '2026-09-24', scheduledOn: '2026-08-25', amount: 268400 },
  { id: 'si-7',  date: '2026-08-24', number: 'INV-04406', customer: 'Vaigai Chemicals',           status: 'Overdue',   dueDate: '2026-08-31', scheduledOn: '2026-08-24', amount: 76050 },
  { id: 'si-8',  date: '2026-08-22', number: 'INV-04405', customer: 'Coromandel Fasteners',       status: 'Scheduled', dueDate: '2026-10-22', scheduledOn: '2026-09-22', amount: 9375 },
  { id: 'si-9',  date: '2026-08-20', number: 'INV-04404', customer: 'Mahanadi Rubber Works',      status: 'Sent',      dueDate: '2026-09-19', scheduledOn: '2026-08-20', amount: 412600 },
  { id: 'si-10', date: '2026-08-19', number: 'INV-04403', customer: 'Sarayu Electricals',         status: 'Paid',      dueDate: '2026-09-03', scheduledOn: '2026-08-19', amount: 58120 },

  { id: 'si-11', date: '2026-08-17', number: 'INV-04402', customer: 'Kavery Packaging',           status: 'Cancelled', dueDate: '2026-09-16', scheduledOn: '2026-08-17', amount: 50730 },
  { id: 'si-12', date: '2026-08-15', number: 'INV-04401', customer: 'Sundar Metalworks',          status: 'Paid',      dueDate: '2026-08-30', scheduledOn: '2026-08-15', amount: 312045 },
  { id: 'si-13', date: '2026-08-14', number: 'INV-04400', customer: 'Deccan Logistics',           status: 'Overdue',   dueDate: '2026-08-29', scheduledOn: '2026-08-14', amount: 129800 },
  { id: 'si-14', date: '2026-08-12', number: 'INV-04399', customer: 'Nilgiri Components Pvt Ltd', status: 'Scheduled', dueDate: '2026-10-26', scheduledOn: '2026-09-26', amount: 218900 },
  { id: 'si-15', date: '2026-08-11', number: 'INV-04398', customer: 'Vaigai Chemicals',           status: 'Sent',      dueDate: '2026-09-10', scheduledOn: '2026-08-11', amount: 66430 },
  { id: 'si-16', date: '2026-08-09', number: 'INV-04397', customer: 'Anand Tooling',              status: 'Paid',      dueDate: '2026-08-24', scheduledOn: '2026-08-09', amount: 38940 },
  { id: 'si-17', date: '2026-08-07', number: 'INV-04396', customer: 'Bharat Steel Traders',       status: 'Scheduled', dueDate: '2026-10-18', scheduledOn: '2026-09-18', amount: 542000 },
  { id: 'si-18', date: '2026-08-05', number: 'INV-04395', customer: 'Mahanadi Rubber Works',      status: 'Failed',    dueDate: '2026-09-04', scheduledOn: '2026-08-05', amount: 27460 },
  { id: 'si-19', date: '2026-08-03', number: 'INV-04394', customer: 'Sarayu Electricals',         status: 'Cancelled', dueDate: '2026-09-02', scheduledOn: '2026-08-03', amount: 14325 },
  { id: 'si-20', date: '2026-08-01', number: 'INV-04393', customer: 'Coromandel Fasteners',       status: 'Paid',      dueDate: '2026-08-16', scheduledOn: '2026-08-01', amount: 9680 },

  { id: 'si-21', date: '2026-07-30', number: 'INV-04392', customer: 'Kavery Packaging',           status: 'Overdue',   dueDate: '2026-08-14', scheduledOn: '2026-07-30', amount: 31870 },
  { id: 'si-22', date: '2026-07-28', number: 'INV-04391', customer: 'Sundar Metalworks',          status: 'Paid',      dueDate: '2026-08-12', scheduledOn: '2026-07-28', amount: 220500 },
  { id: 'si-23', date: '2026-07-26', number: 'INV-04390', customer: 'Deccan Logistics',           status: 'Sent',      dueDate: '2026-09-24', scheduledOn: '2026-07-26', amount: 48750 },
  { id: 'si-24', date: '2026-07-24', number: 'INV-04389', customer: 'Nilgiri Components Pvt Ltd', status: 'Paid',      dueDate: '2026-08-08', scheduledOn: '2026-07-24', amount: 174030 },
  { id: 'si-25', date: '2026-07-22', number: 'INV-04388', customer: 'Vaigai Chemicals',           status: 'Draft',     dueDate: '2026-10-01', scheduledOn: '2026-09-12', amount: 20540 },
  { id: 'si-26', date: '2026-07-20', number: 'INV-04387', customer: 'Anand Tooling',              status: 'Scheduled', dueDate: '2026-10-08', scheduledOn: '2026-09-08', amount: 35620 },
  { id: 'si-27', date: '2026-07-18', number: 'INV-04386', customer: 'Bharat Steel Traders',       status: 'Paid',      dueDate: '2026-08-02', scheduledOn: '2026-07-18', amount: 389400 },
  { id: 'si-28', date: '2026-07-16', number: 'INV-04385', customer: 'Mahanadi Rubber Works',      status: 'Failed',    dueDate: '2026-08-15', scheduledOn: '2026-07-16', amount: 61290 },
];
