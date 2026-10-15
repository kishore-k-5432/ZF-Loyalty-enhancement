/**
 * Thirty-five sales contracts. Application data, not design data — the canon
 * owns how a row looks, this owns what is in one.
 *
 * `status` and `signature` are the record's own vocabulary; the screen maps each
 * to a `StatusBadge` status. Keeping the mapping in the screen rather than here
 * is deliberate: "Expired" is a fact about a contract, `void` is a fact about
 * how it is drawn, and this file should not know the second one.
 *
 * Written out literally rather than generated at import: a list view that
 * reshuffles on every reload cannot be reviewed, screenshotted, or compared
 * against a design.
 */
export interface SalesContract {
  id: string;
  date: string;              // ISO — formatted at render, never stored formatted
  number: string;
  name: string;
  customer: string;
  owner: string;
  status: 'Draft' | 'Sent for Signature' | 'Active' | 'Expiring Soon' | 'Expired' | 'Terminated';
  signature: 'Signed' | 'Awaiting' | 'Declined';
  endDate: string;           // ISO
  value: number;             // whole rupees
}

//  `signature` is CONSISTENT with `status`, and that is not decoration: a Draft
//  that is Signed, or an Active contract still Awaiting a signature, is a lie,
//  and a screen full of lies teaches nobody anything about the view.
export const SALES_CONTRACTS: SalesContract[] = [
  { id: 'sc-1',  date: '2026-08-26', number: 'SC-00128', name: 'Annual Supply — Packaging',      customer: 'Kavery Packaging',          owner: 'Nithya Raman',   status: 'Active',             signature: 'Signed',   endDate: '2027-08-25', value: 1840000 },
  { id: 'sc-2',  date: '2026-08-22', number: 'SC-00127', name: 'Maintenance Retainer',           customer: 'Sundar Metalworks',         owner: 'Arjun Pillai',   status: 'Sent for Signature', signature: 'Awaiting', endDate: '2027-08-21', value: 624000 },
  { id: 'sc-3',  date: '2026-08-20', number: 'SC-00126', name: 'Component Framework Agreement',  customer: 'Nilgiri Components Pvt Ltd', owner: 'Nithya Raman',  status: 'Active',             signature: 'Signed',   endDate: '2027-02-19', value: 9213400 },
  { id: 'sc-4',  date: '2026-08-18', number: 'SC-00125', name: 'Tooling Services SLA',           customer: 'Anand Tooling',             owner: 'Kiran Desai',    status: 'Draft',              signature: 'Awaiting', endDate: '2027-08-17', value: 472150 },
  { id: 'sc-5',  date: '2026-08-15', number: 'SC-00124', name: 'Freight & Logistics Contract',   customer: 'Deccan Logistics',          owner: 'Arjun Pillai',   status: 'Expiring Soon',      signature: 'Signed',   endDate: '2026-09-30', value: 159800 },
  { id: 'sc-6',  date: '2026-08-12', number: 'SC-00123', name: 'Steel Supply — Q3/Q4',           customer: 'Bharat Steel Traders',      owner: 'Meera Krishnan', status: 'Terminated',         signature: 'Declined', endDate: '2026-08-30', value: 2684000 },
  { id: 'sc-7',  date: '2026-08-09', number: 'SC-00122', name: 'Chemicals Blanket Order',        customer: 'Vaigai Chemicals',          owner: 'Kiran Desai',    status: 'Active',             signature: 'Signed',   endDate: '2027-08-08', value: 760500 },
  { id: 'sc-8',  date: '2026-08-06', number: 'SC-00121', name: 'Fastener Supply Terms',          customer: 'Coromandel Fasteners',      owner: 'Nithya Raman',   status: 'Draft',              signature: 'Awaiting', endDate: '2027-08-05', value: 93750 },
  { id: 'sc-9',  date: '2026-08-03', number: 'SC-00120', name: 'Rubber Components — Annual',     customer: 'Mahanadi Rubber Works',     owner: 'Meera Krishnan', status: 'Active',             signature: 'Signed',   endDate: '2027-08-02', value: 4126000 },
  { id: 'sc-10', date: '2026-07-30', number: 'SC-00119', name: 'Electrical Fit-out',             customer: 'Sarayu Electricals',        owner: 'Arjun Pillai',   status: 'Expired',            signature: 'Signed',   endDate: '2026-07-29', value: 581200 },

  { id: 'sc-11', date: '2026-07-24', number: 'SC-00118', name: 'Packaging Rate Card',            customer: 'Kavery Packaging',          owner: 'Kiran Desai',    status: 'Expired',            signature: 'Signed',   endDate: '2026-07-23', value: 507300 },
  { id: 'sc-12', date: '2026-07-20', number: 'SC-00117', name: 'Metalworks Master Agreement',    customer: 'Sundar Metalworks',         owner: 'Nithya Raman',   status: 'Active',             signature: 'Signed',   endDate: '2027-07-19', value: 3120450 },
  { id: 'sc-13', date: '2026-07-16', number: 'SC-00116', name: 'Warehouse Lease Services',       customer: 'Deccan Logistics',          owner: 'Meera Krishnan', status: 'Active',             signature: 'Signed',   endDate: '2028-07-15', value: 1298000 },
  { id: 'sc-14', date: '2026-07-11', number: 'SC-00115', name: 'Precision Parts — Pilot',        customer: 'Nilgiri Components Pvt Ltd', owner: 'Arjun Pillai',  status: 'Sent for Signature', signature: 'Awaiting', endDate: '2027-01-10', value: 218900 },
  { id: 'sc-15', date: '2026-07-07', number: 'SC-00114', name: 'Solvent Supply Agreement',       customer: 'Vaigai Chemicals',          owner: 'Kiran Desai',    status: 'Expiring Soon',      signature: 'Signed',   endDate: '2026-09-15', value: 664300 },
  { id: 'sc-16', date: '2026-07-02', number: 'SC-00113', name: 'Die & Mould Servicing',          customer: 'Anand Tooling',             owner: 'Nithya Raman',   status: 'Active',             signature: 'Signed',   endDate: '2027-07-01', value: 389400 },
  { id: 'sc-17', date: '2026-06-27', number: 'SC-00112', name: 'Structural Steel — Phase 2',     customer: 'Bharat Steel Traders',      owner: 'Meera Krishnan', status: 'Draft',              signature: 'Awaiting', endDate: '2027-06-26', value: 5420000 },
  { id: 'sc-18', date: '2026-06-23', number: 'SC-00111', name: 'Gasket Supply Terms',            customer: 'Mahanadi Rubber Works',     owner: 'Arjun Pillai',   status: 'Active',             signature: 'Signed',   endDate: '2027-06-22', value: 274600 },
  { id: 'sc-19', date: '2026-06-18', number: 'SC-00110', name: 'Switchgear Maintenance',         customer: 'Sarayu Electricals',        owner: 'Kiran Desai',    status: 'Terminated',         signature: 'Declined', endDate: '2026-08-01', value: 143250 },
  { id: 'sc-20', date: '2026-06-14', number: 'SC-00109', name: 'Bolt & Rivet Framework',         customer: 'Coromandel Fasteners',      owner: 'Nithya Raman',   status: 'Active',             signature: 'Signed',   endDate: '2027-06-13', value: 96800 },

  { id: 'sc-21', date: '2026-06-09', number: 'SC-00108', name: 'Cartons — Seasonal Uplift',      customer: 'Kavery Packaging',          owner: 'Meera Krishnan', status: 'Expired',            signature: 'Signed',   endDate: '2026-06-30', value: 318700 },
  { id: 'sc-22', date: '2026-06-04', number: 'SC-00107', name: 'Sheet Metal — Annual',           customer: 'Sundar Metalworks',         owner: 'Arjun Pillai',   status: 'Active',             signature: 'Signed',   endDate: '2027-06-03', value: 2205000 },
  { id: 'sc-23', date: '2026-05-30', number: 'SC-00106', name: 'Last-mile Distribution',         customer: 'Deccan Logistics',          owner: 'Kiran Desai',    status: 'Expiring Soon',      signature: 'Signed',   endDate: '2026-09-22', value: 487500 },
  { id: 'sc-24', date: '2026-05-26', number: 'SC-00105', name: 'Sensor Assemblies',              customer: 'Nilgiri Components Pvt Ltd', owner: 'Nithya Raman',  status: 'Active',             signature: 'Signed',   endDate: '2027-05-25', value: 1740300 },
  { id: 'sc-25', date: '2026-05-21', number: 'SC-00104', name: 'Reagents & Consumables',         customer: 'Vaigai Chemicals',          owner: 'Meera Krishnan', status: 'Draft',              signature: 'Awaiting', endDate: '2027-05-20', value: 205400 },
  { id: 'sc-26', date: '2026-05-16', number: 'SC-00103', name: 'Jig Fabrication Contract',       customer: 'Anand Tooling',             owner: 'Arjun Pillai',   status: 'Expired',            signature: 'Signed',   endDate: '2026-05-15', value: 356200 },
  { id: 'sc-27', date: '2026-05-12', number: 'SC-00102', name: 'Reinforcement Bar Supply',       customer: 'Bharat Steel Traders',      owner: 'Kiran Desai',    status: 'Active',             signature: 'Signed',   endDate: '2027-05-11', value: 3894000 },
  { id: 'sc-28', date: '2026-05-07', number: 'SC-00101', name: 'Moulded Seals — Annual',         customer: 'Mahanadi Rubber Works',     owner: 'Nithya Raman',   status: 'Sent for Signature', signature: 'Awaiting', endDate: '2027-05-06', value: 612900 },
  { id: 'sc-29', date: '2026-05-02', number: 'SC-00100', name: 'Panel Wiring Services',          customer: 'Sarayu Electricals',        owner: 'Meera Krishnan', status: 'Active',             signature: 'Signed',   endDate: '2027-05-01', value: 228400 },
  { id: 'sc-30', date: '2026-04-28', number: 'SC-00099', name: 'Anchor Supply Terms',            customer: 'Coromandel Fasteners',      owner: 'Arjun Pillai',   status: 'Terminated',         signature: 'Declined', endDate: '2026-06-15', value: 74300 },

  { id: 'sc-31', date: '2026-04-23', number: 'SC-00098', name: 'Corrugate Supply — Renewal',     customer: 'Kavery Packaging',          owner: 'Kiran Desai',    status: 'Active',             signature: 'Signed',   endDate: '2027-04-22', value: 921600 },
  { id: 'sc-32', date: '2026-04-18', number: 'SC-00097', name: 'Fabrication Retainer',           customer: 'Sundar Metalworks',         owner: 'Nithya Raman',   status: 'Expiring Soon',      signature: 'Signed',   endDate: '2026-10-05', value: 1408000 },
  { id: 'sc-33', date: '2026-04-13', number: 'SC-00096', name: 'Cold Chain Transport',           customer: 'Deccan Logistics',          owner: 'Meera Krishnan', status: 'Draft',              signature: 'Awaiting', endDate: '2027-04-12', value: 533800 },
  { id: 'sc-34', date: '2026-04-08', number: 'SC-00095', name: 'Housing Components',            customer: 'Nilgiri Components Pvt Ltd', owner: 'Arjun Pillai',   status: 'Expired',            signature: 'Signed',   endDate: '2026-04-07', value: 1176500 },
  { id: 'sc-35', date: '2026-04-02', number: 'SC-00094', name: 'Catalyst Supply Agreement',      customer: 'Vaigai Chemicals',          owner: 'Kiran Desai',    status: 'Active',             signature: 'Signed',   endDate: '2027-04-01', value: 845700 },
];
