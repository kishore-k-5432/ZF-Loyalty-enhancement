/**
 * Thirty bills. Application data, not design data — the canon owns how a row
 * looks, this owns what is in one.
 *
 * `status` is the record's own vocabulary; the screen maps it to a
 * `StatusBadge`. "Partially Paid" is a fact about a bill, `in-progress` is a
 * fact about how it is drawn, and this file does not know the second one.
 */
export interface Bill {
  id: string;
  date: string;              // ISO — formatted at render, never stored formatted
  number: string;
  reference: string;
  vendor: string;
  status: 'Draft' | 'Open' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Void';
  dueDate: string;           // ISO
  amount: number;            // whole rupees
  balance: number;           // what is still owed
}

//  `balance` is CONSISTENT with `status`: Paid is 0, Draft and Open are the full
//  amount, Partially Paid is somewhere between, and Void is 0 because nothing is
//  collectable on it. A screen full of contradictions teaches nothing about the
//  view.
export const BILLS: Bill[] = [
  { id: 'b-1',  date: '2026-08-28', number: 'BILL-00218', reference: 'INV-77120', vendor: 'Sundar Metalworks',          status: 'Open',           dueDate: '2026-09-27', amount: 184500, balance: 184500 },
  { id: 'b-2',  date: '2026-08-26', number: 'BILL-00217', reference: 'INV-77104', vendor: 'Kavery Packaging',           status: 'Paid',           dueDate: '2026-09-10', amount: 32760,  balance: 0 },
  { id: 'b-3',  date: '2026-08-24', number: 'BILL-00216', reference: 'INV-77098', vendor: 'Nilgiri Components Pvt Ltd', status: 'Partially Paid', dueDate: '2026-09-23', amount: 921340, balance: 421340 },
  { id: 'b-4',  date: '2026-08-21', number: 'BILL-00215', reference: 'INV-77081', vendor: 'Anand Tooling',              status: 'Overdue',        dueDate: '2026-08-25', amount: 47215,  balance: 47215 },
  { id: 'b-5',  date: '2026-08-19', number: 'BILL-00214', reference: 'INV-77066', vendor: 'Deccan Logistics',           status: 'Paid',           dueDate: '2026-09-02', amount: 15980,  balance: 0 },
  { id: 'b-6',  date: '2026-08-17', number: 'BILL-00213', reference: 'INV-77052', vendor: 'Bharat Steel Traders',       status: 'Void',           dueDate: '2026-09-16', amount: 268400, balance: 0 },
  { id: 'b-7',  date: '2026-08-14', number: 'BILL-00212', reference: 'INV-77039', vendor: 'Vaigai Chemicals',           status: 'Open',           dueDate: '2026-09-13', amount: 76050,  balance: 76050 },
  { id: 'b-8',  date: '2026-08-12', number: 'BILL-00211', reference: 'INV-77021', vendor: 'Coromandel Fasteners',       status: 'Draft',          dueDate: '2026-09-11', amount: 9375,   balance: 9375 },
  { id: 'b-9',  date: '2026-08-09', number: 'BILL-00210', reference: 'INV-77008', vendor: 'Mahanadi Rubber Works',      status: 'Overdue',        dueDate: '2026-08-20', amount: 412600, balance: 412600 },
  { id: 'b-10', date: '2026-08-06', number: 'BILL-00209', reference: 'INV-76994', vendor: 'Sarayu Electricals',         status: 'Paid',           dueDate: '2026-08-21', amount: 58120,  balance: 0 },

  { id: 'b-11', date: '2026-08-03', number: 'BILL-00208', reference: 'INV-76980', vendor: 'Kavery Packaging',           status: 'Partially Paid', dueDate: '2026-09-02', amount: 507300, balance: 207300 },
  { id: 'b-12', date: '2026-07-31', number: 'BILL-00207', reference: 'INV-76965', vendor: 'Sundar Metalworks',          status: 'Paid',           dueDate: '2026-08-15', amount: 76050,  balance: 0 },
  { id: 'b-13', date: '2026-07-28', number: 'BILL-00206', reference: 'INV-76951', vendor: 'Deccan Logistics',           status: 'Open',           dueDate: '2026-09-26', amount: 129800, balance: 129800 },
  { id: 'b-14', date: '2026-07-25', number: 'BILL-00205', reference: 'INV-76938', vendor: 'Nilgiri Components Pvt Ltd', status: 'Overdue',        dueDate: '2026-08-09', amount: 218900, balance: 218900 },
  { id: 'b-15', date: '2026-07-22', number: 'BILL-00204', reference: 'INV-76920', vendor: 'Vaigai Chemicals',           status: 'Paid',           dueDate: '2026-08-06', amount: 66430,  balance: 0 },
  { id: 'b-16', date: '2026-07-19', number: 'BILL-00203', reference: 'INV-76907', vendor: 'Anand Tooling',              status: 'Draft',          dueDate: '2026-08-18', amount: 38940,  balance: 38940 },
  { id: 'b-17', date: '2026-07-16', number: 'BILL-00202', reference: 'INV-76893', vendor: 'Bharat Steel Traders',       status: 'Partially Paid', dueDate: '2026-09-14', amount: 542000, balance: 142000 },
  { id: 'b-18', date: '2026-07-13', number: 'BILL-00201', reference: 'INV-76879', vendor: 'Mahanadi Rubber Works',      status: 'Paid',           dueDate: '2026-07-28', amount: 27460,  balance: 0 },
  { id: 'b-19', date: '2026-07-10', number: 'BILL-00200', reference: 'INV-76864', vendor: 'Sarayu Electricals',         status: 'Void',           dueDate: '2026-08-09', amount: 14325,  balance: 0 },
  { id: 'b-20', date: '2026-07-07', number: 'BILL-00199', reference: 'INV-76850', vendor: 'Coromandel Fasteners',       status: 'Open',           dueDate: '2026-09-05', amount: 9680,   balance: 9680 },

  { id: 'b-21', date: '2026-07-04', number: 'BILL-00198', reference: 'INV-76836', vendor: 'Kavery Packaging',           status: 'Overdue',        dueDate: '2026-08-03', amount: 31870,  balance: 31870 },
  { id: 'b-22', date: '2026-07-01', number: 'BILL-00197', reference: 'INV-76822', vendor: 'Sundar Metalworks',          status: 'Paid',           dueDate: '2026-07-16', amount: 220500, balance: 0 },
  { id: 'b-23', date: '2026-06-28', number: 'BILL-00196', reference: 'INV-76808', vendor: 'Deccan Logistics',           status: 'Open',           dueDate: '2026-09-26', amount: 48750,  balance: 48750 },
  { id: 'b-24', date: '2026-06-25', number: 'BILL-00195', reference: 'INV-76794', vendor: 'Nilgiri Components Pvt Ltd', status: 'Paid',           dueDate: '2026-07-10', amount: 174030, balance: 0 },
  { id: 'b-25', date: '2026-06-22', number: 'BILL-00194', reference: 'INV-76780', vendor: 'Vaigai Chemicals',           status: 'Draft',          dueDate: '2026-07-22', amount: 20540,  balance: 20540 },
  { id: 'b-26', date: '2026-06-19', number: 'BILL-00193', reference: 'INV-76766', vendor: 'Anand Tooling',              status: 'Partially Paid', dueDate: '2026-09-17', amount: 35620,  balance: 12620 },
  { id: 'b-27', date: '2026-06-16', number: 'BILL-00192', reference: 'INV-76752', vendor: 'Bharat Steel Traders',       status: 'Paid',           dueDate: '2026-07-01', amount: 389400, balance: 0 },
  { id: 'b-28', date: '2026-06-13', number: 'BILL-00191', reference: 'INV-76738', vendor: 'Mahanadi Rubber Works',      status: 'Overdue',        dueDate: '2026-07-13', amount: 61290,  balance: 61290 },
  { id: 'b-29', date: '2026-06-10', number: 'BILL-00190', reference: 'INV-76724', vendor: 'Sarayu Electricals',         status: 'Open',           dueDate: '2026-09-08', amount: 22840,  balance: 22840 },
  { id: 'b-30', date: '2026-06-07', number: 'BILL-00189', reference: 'INV-76710', vendor: 'Coromandel Fasteners',       status: 'Paid',           dueDate: '2026-06-22', amount: 7430,   balance: 0 },
];
