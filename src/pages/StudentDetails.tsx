import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, todayStr } from '@/utils/helpers';
import { Avatar } from '@/components/lessn/Avatar';
import { Toast } from '@/components/lessn/Toast';
import { useToast } from '@/hooks/useToast';
import { STATUS_LABELS } from '@/constants';
import { ArrowLeft, Plus } from 'lucide-react';

type Tab = 'overview' | 'lessons' | 'payments' | 'notes';

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { students, lessons, payments, groups, addLesson, addPayment, updateLesson, updateStudent } = useAppData();
  const { teacher } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: todayStr(), note: '' });
  const [lessonForm, setLessonForm] = useState({ date: todayStr(), time: '', duration: 60, notes: '' });

  const student = students.find((s) => s.id === id);
  if (!student) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-foreground mb-4">Учня не знайдено</h2>
        <button onClick={() => navigate('/students')} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold">
          Повернутися до списку
        </button>
      </div>
    );
  }

  const studentPayments = payments.filter((p) => p.student_id === student.id);
  const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
  const lessonsPaid = student.price_per_lesson > 0 ? Math.floor(totalPaid / student.price_per_lesson) : 0;
  const individualLessons = lessons.filter((l) => l.student_id === student.id && !l.is_group);
  const completedIndividual = individualLessons.filter((l) => l.status === 'completed').length;
  const studentGroups = groups.filter((g) => g.student_ids?.includes(student.id));
  const groupLessons = lessons.filter((l) => l.is_group && studentGroups.some((g) => g.id === l.group_id));
  const completedGroup = groupLessons.filter((l) => l.status === 'completed').length;
  const totalCompleted = completedIndividual + completedGroup;
  const remaining = lessonsPaid - totalCompleted;
  const today = todayStr();

  const upcomingLessons = [
    ...individualLessons.filter((l) => l.status === 'scheduled' && l.date >= today),
    ...groupLessons.filter((l) => l.status === 'scheduled' && l.date >= today),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const allLessons = [
    ...individualLessons,
    ...groupLessons,
  ].sort((a, b) => b.date.localeCompare(a.date));

  const recentPayments = [...studentPayments].sort((a, b) => b.date.localeCompare(a.date));

  const handleAddPayment = async () => {
    if (!paymentForm.amount || !teacher) return;
    await addPayment.mutateAsync({
      student_id: student.id, amount: Number(paymentForm.amount),
      date: paymentForm.date, note: paymentForm.note, teacher_id: teacher.id,
    });
    setShowPaymentForm(false);
    setPaymentForm({ amount: '', date: todayStr(), note: '' });
    showToast('Оплату додано', 'success');
  };

  const handleAddLesson = async () => {
    if (!lessonForm.date || !lessonForm.time || !teacher) return;
    await addLesson.mutateAsync({
      student_id: student.id, group_id: null, is_group: false,
      date: lessonForm.date, time: lessonForm.time,
      duration: lessonForm.duration, notes: lessonForm.notes,
      status: 'scheduled', teacher_id: teacher.id,
    });
    setShowLessonForm(false);
    setLessonForm({ date: todayStr(), time: '', duration: 60, notes: '' });
    showToast('Урок заплановано', 'success');
  };

  const setLessonStatus = async (lessonId: string, status: 'completed' | 'cancelled') => {
    await updateLesson.mutateAsync({ id: lessonId, status });
    showToast(status === 'completed' ? 'Урок проведено' : 'Урок скасовано', 'success');
  };

  const statusConfig: Record<string, { bg: string; label: string }> = {
    completed: { bg: 'bg-mint-light text-foreground', label: 'Проведено' },
    scheduled: { bg: 'bg-secondary text-foreground', label: 'Заплановано' },
    cancelled: { bg: 'bg-coral-light text-coral-dark', label: 'Скасовано' },
    rescheduled: { bg: 'bg-orange-light text-orange-dark', label: 'Перенесено' },
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Огляд' },
    { key: 'lessons', label: 'Уроки' },
    { key: 'payments', label: 'Оплати' },
    { key: 'notes', label: 'Нотатки' },
  ];

  const formatShortDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="space-y-5">
        {/* Back */}
        <button onClick={() => navigate('/students')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Назад до учнів
        </button>

        {/* Header */}
        <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar name={student.name} size={48} />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{student.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <span>{student.subject}</span>
                <span>·</span>
                <span>{formatCurrency(student.price_per_lesson)}/урок</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setActiveTab('lessons'); setShowLessonForm(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-mint-dark transition-all">
                <Plus className="h-3.5 w-3.5" /> Урок
              </button>
              <button onClick={() => { setActiveTab('payments'); setShowPaymentForm(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-border transition-all">
                <Plus className="h-3.5 w-3.5" /> Оплата
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Баланс</p>
            <p className={`text-2xl font-bold ${remaining > 0 ? 'text-mint-dark' : remaining < 0 ? 'text-coral' : 'text-foreground'}`}>{remaining}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Проведено</p>
            <p className="text-2xl font-bold text-foreground">{totalCompleted}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Найближчих</p>
            <p className="text-2xl font-bold text-foreground">{upcomingLessons.length}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Оплачено</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPaid)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 text-sm font-semibold transition-all -mb-[2px] ${
                activeTab === tab.key
                  ? 'text-foreground border-b-2 border-foreground'
                  : 'text-muted-foreground border-b-2 border-transparent hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-5">
              {/* Upcoming */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Найближчі уроки</h3>
                {upcomingLessons.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Немає запланованих уроків</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingLessons.slice(0, 5).map((l) => (
                      <div key={l.id} className="flex items-center gap-3 py-2">
                        <div className="text-center w-10">
                          <p className="text-[10px] text-muted-foreground">{new Date(l.date).toLocaleDateString('uk-UA', { weekday: 'short' })}</p>
                          <p className="text-lg font-bold text-foreground">{new Date(l.date).getDate()}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{l.time || '—'}</p>
                          <p className="text-xs text-muted-foreground">{l.duration} хв</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setLessonStatus(l.id, 'completed')} className="text-mint-dark text-xs p-1.5 hover:bg-mint-50 rounded">✓</button>
                          <button onClick={() => setLessonStatus(l.id, 'cancelled')} className="text-coral text-xs p-1.5 hover:bg-coral-light rounded">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              {/* Recent Payments */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Останні оплати</h3>
                {recentPayments.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Оплат ще немає</p>
                ) : (
                  <div className="space-y-2">
                    {recentPayments.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-2">
                        <span className="text-sm font-semibold text-mint-dark">+{formatCurrency(p.amount)}</span>
                        <span className="text-xs text-muted-foreground">{formatShortDate(p.date)}{p.note && ` · ${p.note}`}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Lessons */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Останні уроки</h3>
                {allLessons.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Уроків ще немає</p>
                ) : (
                  <div className="space-y-2">
                    {allLessons.slice(0, 5).map((l) => {
                      const cfg = statusConfig[l.status];
                      return (
                        <div key={l.id} className="flex items-center justify-between py-2">
                          <div>
                            <p className="text-sm text-foreground">{formatShortDate(l.date)}{l.time && ` о ${l.time}`}</p>
                            <p className="text-xs text-muted-foreground">{l.duration} хв</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg}`}>{cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="space-y-4">
            {showLessonForm && (
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Запланувати урок</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Дата</label>
                    <input type="date" className="w-full px-3 py-2 rounded-md border border-border text-sm" value={lessonForm.date} onChange={(e) => setLessonForm({ ...lessonForm, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Час</label>
                    <input type="time" className="w-full px-3 py-2 rounded-md border border-border text-sm" value={lessonForm.time} onChange={(e) => setLessonForm({ ...lessonForm, time: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowLessonForm(false)} className="px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">Скасувати</button>
                  <button onClick={handleAddLesson} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold">Запланувати</button>
                </div>
              </div>
            )}

            {!showLessonForm && (
              <button onClick={() => setShowLessonForm(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-mint-dark transition-all">
                <Plus className="h-3.5 w-3.5" /> Додати
              </button>
            )}

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {allLessons.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">Уроків ще немає</p>
              ) : (
                <div className="divide-y divide-border">
                  {allLessons.map((l) => {
                    const cfg = statusConfig[l.status];
                    return (
                      <div key={l.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors">
                        <div>
                          <p className="text-sm text-foreground">{formatShortDate(l.date)} {l.time || ''}</p>
                          <p className="text-xs text-muted-foreground">{l.duration} хв{l.notes && ` · ${l.notes}`}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg}`}>{cfg.label}</span>
                          {l.status === 'scheduled' && (
                            <div className="flex gap-1">
                              <button onClick={() => setLessonStatus(l.id, 'completed')} className="text-[11px] px-2 py-1 bg-mint-light text-foreground rounded font-medium">Готово</button>
                              <button onClick={() => setLessonStatus(l.id, 'cancelled')} className="text-[11px] px-2 py-1 bg-coral-light text-coral-dark rounded font-medium">Скасувати</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            {showPaymentForm && (
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Додати оплату</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Сума (грн)</label>
                    <input type="number" className="w-full px-3 py-2 rounded-md border border-border text-sm" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Дата</label>
                    <input type="date" className="w-full px-3 py-2 rounded-md border border-border text-sm" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowPaymentForm(false)} className="px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">Скасувати</button>
                  <button onClick={handleAddPayment} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold">Додати</button>
                </div>
              </div>
            )}

            {!showPaymentForm && (
              <button onClick={() => setShowPaymentForm(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-mint-dark transition-all">
                <Plus className="h-3.5 w-3.5" /> Додати
              </button>
            )}

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {recentPayments.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">Оплат ще немає</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-semibold text-mint-dark">+{formatCurrency(p.amount)}</span>
                      <span className="text-xs text-muted-foreground">{formatShortDate(p.date)}{p.note && ` · ${p.note}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Нотатки</h3>
            <textarea
              className="w-full px-3 py-2.5 rounded-md border border-border bg-card text-sm outline-none min-h-[120px] resize-y"
              value={student.notes || ''}
              onChange={(e) => updateStudent.mutate({ id: student.id, notes: e.target.value })}
              placeholder="Додайте нотатки про учня..."
            />
          </div>
        )}
      </div>
    </>
  );
}
