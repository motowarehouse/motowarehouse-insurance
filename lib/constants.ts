export const STATUS_CONFIG = {
  INTAKE: {
    label: 'Intake',
    labelGr: 'Εισαγωγή',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    step: 0,
  },
  AWAITING_ESTIMATOR: {
    label: 'Awaiting Estimator',
    labelGr: 'Αναμονή Εκτιμητή',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    step: 1,
  },
  ESTIMATOR_VISIT: {
    label: 'Estimator Visit',
    labelGr: 'Επίσκεψη Εκτιμητή',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    step: 2,
  },
  QUOTE_SENT: {
    label: 'Quote Sent',
    labelGr: 'Εστάλη Προσφορά',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    step: 3,
  },
  QUOTE_APPROVED: {
    label: 'Quote Approved',
    labelGr: 'Εγκρίθηκε Προσφορά',
    color: 'bg-lime-100 text-lime-700 border-lime-200',
    dot: 'bg-lime-500',
    step: 4,
  },
  AWAITING_AUTHORIZATION: {
    label: 'Awaiting Authorization',
    labelGr: 'Αναμονή Εξουσιοδότησης',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    step: 5,
  },
  AUTHORIZED: {
    label: 'Authorized',
    labelGr: 'Εξουσιοδοτημένο',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
    step: 6,
  },
  IN_REPAIR: {
    label: 'In Repair',
    labelGr: 'Σε Επισκευή',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    dot: 'bg-cyan-500',
    step: 7,
  },
  COMPLETED: {
    label: 'Completed',
    labelGr: 'Ολοκληρωμένο',
    color: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
    step: 8,
  },
  REJECTED: {
    label: 'Rejected',
    labelGr: 'Απορρίφθηκε',
    color: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
    step: -1,
  },
  ON_HOLD: {
    label: 'On Hold',
    labelGr: 'Σε Αναμονή',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
    step: -1,
  },
} as const

// Workflow steps in order (excluding terminal states)
export const WORKFLOW_STEPS = [
  'INTAKE',
  'AWAITING_ESTIMATOR',
  'ESTIMATOR_VISIT',
  'QUOTE_SENT',
  'QUOTE_APPROVED',
  'AWAITING_AUTHORIZATION',
  'AUTHORIZED',
  'IN_REPAIR',
  'COMPLETED',
] as const

export const TERMINAL_STATUSES = ['COMPLETED', 'REJECTED', 'ON_HOLD'] as const

export const BRAND_CONFIG = {
  SYM: { label: 'SYM', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  CFMOTO: { label: 'CFMOTO', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  OTHER: { label: 'Other', color: 'bg-gray-50 text-gray-700 border-gray-200' },
} as const

// Age indicator thresholds (days in current status)
export const AGE_THRESHOLDS = {
  OK: 6,      // 0-6 days: green
  WARNING: 13, // 7-13 days: amber
  // 14+ days: red
} as const

export const KNOWN_INSURANCE_COMPANIES = [
  'COSMOS',
  'YPERA',
  'YDROGIOS',
  'ANYTIME',
  'HELLAS DIRECT',
  'AXA',
  'EUROLIFE',
  'CNP CYPRIALIFE',
  'GENERALI',
  'UNIVERSAL LIFE',
]
