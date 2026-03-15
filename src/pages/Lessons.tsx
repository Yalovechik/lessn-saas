import { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatTime, todayStr, pluralLessons } from '@/utils/helpers';
import { Avatar } from '@/components/lessn/Avatar';
import { EmptyState } from '@/components/lessn/EmptyState';
import { Modal } from '@/components/lessn/Modal';
import { STATUS_LABELS, FILTER_LABELS } from '@/constants';
import { Plus } from 'lucide-react';

export default function Lessons() {
  const { students, lessons, groups, addLesson, updateLesson, deleteLesson } = useAppData();
  const { teacher } = useAuth();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    type: 'individual' as 'individual' | 'group',
    studentId: '',
    groupId: '',
    date: todayStr(),
    time: '',
    duration: 60,
    notes: '',
  });
  const [filter, setFilter] = useState('all');

  const openNew = () => {
    setForm({
      type: 'individual',
      studentId: students[0]?.id || '',
      groupId: groups[0]?.id || '',
      date: todayStr(),
      time: '',
      duration: 60,
      notes: '',
    });
    setModal(true);
  };

  const add = async () => {
    if (!form.date || !form.time || !teacher) return;
    if (form.type === 'individual' && !form.studentId) return;
    if (form.type === 'group' && !form.groupId) return;

    await addLesson.mutateAsync({
      student_id: form.type === 'individual' ? form.studentId : null,
      group_id: form.type === 'group' ? form.groupId : null,
      is_group: form.type === 'group',
      date: form.date,
      time: form.time,
      duration: form.duration,
      notes: form.notes,
      status: 'scheduled',
      teacher_id: teacher.id,
    });
    setModal(false);
  };

  const setStatus = async (id: string, status: 'completed' | 'cancelled' | 'rescheduled') => {
    await updateLesson.mutateAsync({ id, status });
  };

  const remove = async (id: string) => {
    if (confirm('Видалити урок?')) {
      await deleteLesson.mutateAsync(id);
    }
  };

  const filtered = filter === 'all' ? lessons : lessons.filter((l) => l.status === filter);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || ''));

  const getStudent = (id: string) => students.find((s) => s.id === id);
  const getGroup = (id: string) => groups.find((g) => g.id === id);

  const getLessonDisplay = (lesson: typeof lessons[0]) => {
    if (lesson.is_group && lesson.group_id) {
      const group = getGroup(lesson.group_id);
      return { name: group?.name || 'Невідома група', subtitle: `${group?.student_ids?.length || 0} учнів`, isGroup: true };
    }
    const student = lesson.student_id ? getStudent(lesson.student_id) : null;
    return { name: student?.name || 'Невідомий', subtitle: student?.subject || '', isGroup: false };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground leading-tight">Уроки</h1>
          <p className="text-sm text-muted-foreground mt-1">{lessons.length} {pluralLessons(lessons.length)} загалом</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold transition-all hover:bg-mint-dark">
          <Plus className="h-4 w-4" />
          Додати урок
        </button>
      </div>

      {students.length === 0 ? (
        <div className="bg-card rounded-lg border border-border">
          <EmptyState icon="📚" title="Спочатку додайте учнів" desc="Для планування уроків потрібні учні" />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'scheduled', 'completed', 'cancelled', 'rescheduled'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-foreground text-card border-[1.5px] border-foreground'
                    : 'bg-card text-muted-foreground border-[1.5px] border-border hover:border-muted-foreground/30'
                }`}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          {sorted.length === 0 ? (
            <div className="bg-card rounded-lg border border-border">
              <EmptyState icon="📋" title="Немає уроків" desc="За обраним фільтром уроків немає" />
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase">Учень</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">Дата</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">Час</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase">Статус</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((l) => {
                    const display = getLessonDisplay(l);
                    return (
                      <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {display.isGroup ? (
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">👥</div>
                            ) : (
                              <Avatar name={display.name} size={32} />
                            )}
                            <div>
                              <p className="text-sm font-medium text-foreground">{display.name}</p>
                              <p className="text-xs text-muted-foreground">{display.subtitle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground hidden sm:table-cell">{formatDate(l.date)}</td>
                        <td className="px-4 py-3 text-sm text-foreground hidden sm:table-cell">{l.time ? formatTime(l.time) : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            l.status === 'completed' ? 'bg-mint-light text-foreground' :
                            l.status === 'cancelled' ? 'bg-coral-light text-coral-dark' :
                            l.status === 'rescheduled' ? 'bg-orange-light text-orange-dark' :
                            'bg-secondary text-foreground'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              l.status === 'completed' ? 'bg-mint-dark' :
                              l.status === 'cancelled' ? 'bg-coral' :
                              l.status === 'rescheduled' ? 'bg-orange' :
                              'bg-foreground'
                            }`} />
                            {STATUS_LABELS[l.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {l.status !== 'completed' && (
                              <button onClick={() => setStatus(l.id, 'completed')} className="px-2 py-1 text-xs bg-mint-light text-foreground rounded font-medium hover:bg-mint/30 transition-all">
                                Готово
                              </button>
                            )}
                            {l.status === 'scheduled' && (
                              <button onClick={() => setStatus(l.id, 'cancelled')} className="px-2 py-1 text-xs bg-coral-light text-coral-dark rounded font-medium hover:bg-coral/20 transition-all">
                                Скасувати
                              </button>
                            )}
                            <button onClick={() => remove(l.id)} className="px-1 py-1 text-muted-foreground/30 hover:text-coral transition-colors">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add Lesson Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Запланувати урок"
        footer={
          <>
            <button onClick={() => setModal(false)} className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-border transition-all">
              Скасувати
            </button>
            <button onClick={add} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all">
              Запланувати
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Type toggle */}
          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Тип уроку</label>
            <div className="flex gap-2">
              {(['individual', 'group'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                    form.type === t
                      ? 'border-2 border-foreground bg-mint-50 text-foreground font-bold'
                      : 'border-[1.5px] border-border text-muted-foreground'
                  }`}
                >
                  {t === 'individual' ? '👤 Індивідуальний' : '👥 Груповий'}
                </button>
              ))}
            </div>
          </div>

          {form.type === 'individual' ? (
            <div>
              <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Учень</label>
              <select
                className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.subject}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Група</label>
              <select
                className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                value={form.groupId}
                onChange={(e) => setForm({ ...form, groupId: e.target.value })}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} — {g.student_ids?.length || 0} учнів</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Дата</label>
            <input type="date" className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Час початку</label>
            <input type="time" className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Нотатки</label>
            <input className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Необов'язково" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
