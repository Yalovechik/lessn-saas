import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData';
import { formatCurrency, formatDate, todayStr, formatTime } from '@/utils/helpers';
import { Avatar } from '@/components/lessn/Avatar';
import { STATUS_LABELS } from '@/constants';

export default function Dashboard() {
  const { students, lessons, payments, groups } = useAppData();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const td = todayStr();

  const todayLessons = lessons
    .filter((l) => l.date === td)
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  const mo = new Date().getMonth();
  const yr = new Date().getFullYear();
  const monthPay = payments.filter((p) => {
    const d = new Date(p.date);
    return d.getMonth() === mo && d.getFullYear() === yr;
  });
  const monthIncome = monthPay.reduce((s, p) => s + p.amount, 0);
  const completedMonth = lessons.filter((l) => {
    const d = new Date(l.date);
    return l.status === 'completed' && d.getMonth() === mo && d.getFullYear() === yr;
  }).length;

  const getStudent = (id: string) => students.find((s) => s.id === id);
  const getGroup = (id: string) => groups.find((g) => g.id === id);

  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const dayNameShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('uk-UA', { weekday: 'short' });
  };

  const getRemaining = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return 0;
    const paid = payments.filter((p) => p.student_id === studentId).reduce((x, p) => x + p.amount, 0);
    const lp = student.price_per_lesson > 0 ? Math.floor(paid / student.price_per_lesson) : 0;
    const done = lessons.filter((l) => l.student_id === studentId && l.status === 'completed').length;
    return lp - done;
  };

  const lowBal = students.filter((s) => getRemaining(s.id) <= 2);

  const getLessonDisplay = (lesson: typeof lessons[0]) => {
    if (lesson.is_group && lesson.group_id) {
      const group = getGroup(lesson.group_id);
      return { name: group?.name || 'Невідома група', subject: `${group?.student_ids?.length || 0} учнів` };
    }
    const student = lesson.student_id ? getStudent(lesson.student_id) : null;
    return { name: student?.name || 'Невідомий', subject: student?.subject || '' };
  };

  const stats = [
    { l: 'Учнів', v: students.length, s: `${students.length} активних` },
    { l: 'Уроки сьогодні', v: todayLessons.length, s: formatDate(td) },
    { l: 'Дохід за місяць', v: formatCurrency(monthIncome), s: `${monthPay.length} оплат` },
    { l: 'Проведено уроків', v: completedMonth, s: 'за цей місяць' },
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-foreground leading-tight">Головна</h1>
        <p className="text-sm text-muted-foreground mt-1">Огляд вашого репетиторського бізнесу</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map((s, i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-5 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${
              i === 0 ? 'bg-foreground' : i === 1 ? 'bg-mint-dark' : i === 2 ? 'bg-orange' : 'bg-coral'
            }`} />
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">{s.l}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground leading-tight">{s.v}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{s.s}</p>
          </div>
        ))}
      </div>

      {/* Today's schedule */}
      <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Розклад на сьогодні</h2>
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        {todayLessons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">☀️</p>
            <p className="text-sm font-semibold text-muted-foreground">Сьогодні уроків немає</p>
            <p className="text-xs text-muted-foreground mt-1">Вільний день або час додати уроки</p>
            <button
              onClick={() => navigate('/lessons')}
              className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold transition-all hover:bg-mint-dark"
            >
              Запланувати
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayLessons.map((l) => {
              const display = getLessonDisplay(l);
              return (
                <div key={l.id} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-secondary/50 transition-colors">
                  <span className="text-xs font-medium text-muted-foreground w-12">{l.time ? formatTime(l.time) : '—'}</span>
                  <Avatar name={display.name} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{display.name}</p>
                    <p className="text-xs text-muted-foreground">{display.subject}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    l.status === 'completed' ? 'bg-mint-light text-foreground' :
                    l.status === 'cancelled' ? 'bg-coral-light text-coral-dark' :
                    'bg-secondary text-foreground'
                  }`}>
                    {STATUS_LABELS[l.status]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Week ahead + Low balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 7-day mini schedule */}
        <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4">Тиждень попереду</h2>
          <div className="space-y-0">
            {next7.map((date) => {
              const dayLessons = lessons.filter((l) => l.date === date && l.status !== 'cancelled');
              const isToday = date === td;
              const isOpen = selectedDay === date;
              return (
                <div key={date}>
                  <button
                    onClick={() => setSelectedDay(isOpen ? null : date)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left ${
                      isOpen ? 'bg-mint-50 rounded-t-md border border-mint-light/50 border-b-0' :
                      isToday ? 'bg-mint-50 rounded-md border border-mint-light/50' :
                      'hover:bg-secondary/30 rounded-md border border-transparent'
                    }`}
                  >
                    <div className="text-center w-10">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{dayNameShort(date)}</p>
                      <p className={`text-lg font-bold ${isToday ? 'text-mint-dark' : 'text-foreground'}`}>
                        {new Date(date).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      {dayLessons.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Вільно</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {dayLessons.slice(0, 3).map((l) => {
                            const display = getLessonDisplay(l);
                            return (
                              <span key={l.id} className="text-xs text-foreground">
                                {l.time && <span className="text-muted-foreground">{formatTime(l.time)} </span>}
                                {display.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {dayLessons.length > 0 && (
                      <span className="text-xs font-bold text-foreground bg-mint-light px-2 py-0.5 rounded-full">
                        {dayLessons.length}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low balance */}
        <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4">Увага до балансу</h2>
          {lowBal.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-semibold text-mint-dark">✓ Все добре!</p>
              <p className="text-xs text-muted-foreground mt-1">Усі учні мають достатній баланс</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowBal.map((s) => {
                const rem = getRemaining(s.id);
                return (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-secondary/30 transition-colors">
                    <Avatar name={s.name} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${rem <= 0 ? 'text-coral' : 'text-orange'}`}>{rem}</p>
                      <p className="text-[10px] text-muted-foreground">{rem <= 0 ? 'уроків' : 'залишилось'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
