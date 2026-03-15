export const SUBJECTS = [
  'Англійська',
  'Математика',
  'Фізика',
  'Хімія',
  'Біологія',
  'Музика',
  'Іспанська',
  'Французька',
  'Німецька',
  'Програмування',
  'Мистецтво',
  'Історія',
  'Інше',
];

export const STATUS_LABELS = {
  scheduled: 'Заплановано',
  completed: 'Проведено',
  cancelled: 'Скасовано',
  rescheduled: 'Перенесено',
} as const;

export const FILTER_LABELS = {
  all: 'Усі',
  scheduled: 'Заплановані',
  completed: 'Проведені',
  cancelled: 'Скасовані',
  rescheduled: 'Перенесені',
} as const;

export const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

export const AVATAR_COLORS = [
  '#1A2344',
  '#3DD9A0',
  '#FB7185',
  '#FBBF24',
  '#7C3AED',
  '#06B6D4',
  '#F97316',
  '#8B5CF6',
];
