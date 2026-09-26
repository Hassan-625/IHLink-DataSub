export const brandColors = {
  navy: '#071A3D',
  royal: '#1565D8',
  brand: '#2F80ED',
  white: '#FFFFFF',
  surface: '#F5F8FE',
  ink: '#172033',
  muted: '#64748B',
  border: '#E2E8F0',
} as const;

export const productThemes = {
  datasub: {
    name: 'IHLink DataSub',
    primary: '#10B981',
    accent: '#0EA5E9',
    bg: '#F0FDF4',
    text: '#062A2A',
    gradient: 'from-emerald-500 to-sky-500',
    softBg: '#ECFDF5',
    glow: 'shadow-glow-emerald',
    textClass: 'text-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    btnClass: 'bg-emerald-500 hover:bg-emerald-600',
    ringClass: 'ring-emerald-500/20',
    gradClass: 'gradient-text-emerald',
    dotPattern: 'dot-pattern',
    gridPattern: 'grid-pattern',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    chartColors: ['#10B981', '#22C55E', '#0EA5E9', '#67E8F9'],
    heroGradient: 'from-emerald-700 via-emerald-600 to-sky-500',
    heroPattern: 'grid-pattern',
    badgeText: 'text-emerald-700',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    sectionGradient: 'from-emerald-50/50 to-white',
    cardBorder: 'border-emerald-100',
    footerBg: 'bg-emerald-900',
    footerText: 'text-emerald-100',
    announcementBg: 'bg-emerald-900',
    announcementText: 'text-white',
    accentBar: 'bg-emerald-500',
    statIcon: 'text-emerald-600',
    statBg: 'bg-emerald-50',
    serviceIcon: 'text-emerald-600',
    serviceBg: 'bg-emerald-50',
    ctaGradient: 'from-emerald-600 to-sky-500',
    linkHover: 'hover:text-emerald-600',
    navActive: 'text-emerald-600',
    inputFocus: 'focus:ring-emerald-500/20 focus:border-emerald-500',
    progressBg: 'bg-emerald-500',
    switchActive: 'bg-emerald-500',
    tabActive: 'border-emerald-500 text-emerald-600',
    stepperActive: 'bg-emerald-500 border-emerald-500',
    stepperDone: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    stepperPending: 'bg-gray-100 text-gray-400 border-gray-200',
    chartPrimary: '#10B981',
    chartSecondary: '#22C55E',
    chartTertiary: '#0EA5E9',
    shadow: 'shadow-card',
    hoverShadow: 'hover:shadow-float',
    ring: 'ring-emerald-500/20',
    softSection: 'bg-emerald-50/30',
    divider: 'border-emerald-100',
  }
} as const;

export type ProductKey = keyof typeof productThemes;

export const naira = (amount: number): string => {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
};

export const statusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-amber-50 text-amber-700 border-amber-200',
    reviewing: 'bg-amber-50 text-amber-700 border-amber-200',
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    overdue: 'bg-rose-50 text-rose-700 border-rose-200',
    inactive: 'bg-gray-100 text-gray-500 border-gray-200',
    locked: 'bg-rose-50 text-rose-700 border-rose-200',
    published: 'bg-blue-50 text-blue-700 border-blue-200',
    sent: 'bg-blue-50 text-blue-700 border-blue-200',
    open: 'bg-blue-50 text-blue-700 border-blue-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    on_track: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    at_risk: 'bg-amber-50 text-amber-700 border-amber-200',
    delayed: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return map[status.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200';
};

export const statusLabel = (status: string): string => {
  const map: Record<string, string> = {
    success: 'Success',
    completed: 'Completed',
    active: 'Active',
    approved: 'Approved',
    paid: 'Paid',
    pending: 'Pending',
    processing: 'Processing',
    reviewing: 'Under Review',
    draft: 'Draft',
    failed: 'Failed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    overdue: 'Overdue',
    inactive: 'Inactive',
    locked: 'Locked',
    published: 'Published',
    sent: 'Sent',
    open: 'Open',
    in_progress: 'In Progress',
    on_track: 'On Track',
    at_risk: 'At Risk',
    delayed: 'Delayed',
  };
  return map[status.toLowerCase()] || status;
};
