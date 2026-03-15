import { AVATAR_COLORS } from '../constants';

export const formatCurrency = (amount: number) => `${Number(amount).toFixed(0)} грн`;

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const formatTime = (time: string) => time || '';

export const todayStr = () => new Date().toISOString().split('T')[0];

export const avatarColor = (name: string) =>
  AVATAR_COLORS[
    name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  ];

export const getWeekDates = (offset = 0) => {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().split('T')[0];
  });
};

export const formatDayShort = (dateStr: string) => new Date(dateStr).getDate();

export const formatMonthLabel = (dates: string[]) => {
  const first = new Date(dates[0]);
  const last = new Date(dates[6]);
  const mF = first.toLocaleDateString('uk-UA', { month: 'long' });
  const mL = last.toLocaleDateString('uk-UA', { month: 'long' });
  const yF = first.getFullYear();
  const yL = last.getFullYear();
  if (mF === mL) return `${mF} ${yF}`;
  if (yF === yL) return `${mF} – ${mL} ${yF}`;
  return `${mF} ${yF} – ${mL} ${yL}`;
};

export const pluralStudents = (n: number) => {
  if (n === 1) return 'учень';
  if (n >= 2 && n <= 4) return 'учні';
  return 'учнів';
};

export const pluralLessons = (n: number) => {
  if (n === 1) return 'урок';
  if (n >= 2 && n <= 4) return 'уроки';
  return 'уроків';
};

export const pluralPayments = (n: number) => {
  if (n === 1) return 'оплата';
  if (n >= 2 && n <= 4) return 'оплати';
  return 'оплат';
};
