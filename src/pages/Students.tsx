import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, pluralStudents, pluralLessons } from '@/utils/helpers';
import { Avatar } from '@/components/lessn/Avatar';
import { EmptyState } from '@/components/lessn/EmptyState';
import { Modal } from '@/components/lessn/Modal';
import { Toast } from '@/components/lessn/Toast';
import { useToast } from '@/hooks/useToast';
import { Plus } from 'lucide-react';

export default function Students() {
  const { students, groups, lessons, payments, addStudent, updateStudent, deleteStudent } = useAppData();
  const { teacher } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', pricePerLesson: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;
  const { toast, showToast, hideToast } = useToast();

  const openNew = () => {
    setForm({ name: '', pricePerLesson: '' });
    setEditId(null);
    setModal(true);
  };

  const openEdit = (s: typeof students[0]) => {
    setForm({ name: s.name, pricePerLesson: String(s.price_per_lesson) });
    setEditId(s.id);
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.pricePerLesson || !teacher) return;
    const nameExists = students.some(
      (s) => s.name.toLowerCase() === form.name.trim().toLowerCase() && s.id !== editId
    );
    if (nameExists) {
      showToast(`Учень з ім'ям "${form.name.trim()}" вже існує.`, 'error');
      return;
    }

    try {
      if (editId) {
        await updateStudent.mutateAsync({ id: editId, name: form.name.trim(), price_per_lesson: Number(form.pricePerLesson) });
        showToast('Учня успішно оновлено', 'success');
      } else {
        await addStudent.mutateAsync({
          name: form.name.trim(),
          subject: teacher.subject,
          price_per_lesson: Number(form.pricePerLesson),
          teacher_id: teacher.id,
          notes: '',
        });
        showToast('Учня успішно додано', 'success');
      }
      setModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteStudent.mutateAsync(id);
      setDeleteConfirmId(null);
      showToast('Учня видалено', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const stats = (id: string) => {
    const st = students.find((s) => s.id === id);
    if (!st) return { totalPaid: 0, lessonsPaid: 0, done: 0, remaining: 0 };
    const paid = payments.filter((p) => p.student_id === id).reduce((s, p) => s + p.amount, 0);
    const lp = st.price_per_lesson > 0 ? Math.floor(paid / st.price_per_lesson) : 0;
    const done = lessons.filter((l) => l.student_id === id && l.status === 'completed').length;
    return { totalPaid: paid, lessonsPaid: lp, done, remaining: lp - done };
  };

  const totalPages = Math.ceil(students.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const paginatedStudents = students.slice(startIndex, startIndex + studentsPerPage);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-foreground leading-tight">Учні</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {students.length} {pluralStudents(students.length)} зареєстровано
            </p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold transition-all hover:bg-mint-dark hover:-translate-y-px hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Додати учня
          </button>
        </div>

        {students.length === 0 ? (
          <div className="bg-card rounded-lg border border-border">
            <EmptyState
              icon="📚"
              title="Учнів поки немає"
              desc="Додайте першого учня, щоб почати"
              action={
                <button onClick={openNew} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all">
                  Додати учня
                </button>
              }
            />
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase">Учень</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">Ціна/Урок</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase hidden md:table-cell">Оплачено</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase hidden md:table-cell">Проведено</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase">Залишок</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase">Дії</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((s) => {
                  const st = stats(s.id);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/students/${s.id}`)}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} size={32} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.subject}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground hidden sm:table-cell">{formatCurrency(s.price_per_lesson)}</td>
                      <td className="px-4 py-3 text-sm text-foreground hidden md:table-cell">{formatCurrency(st.totalPaid)}</td>
                      <td className="px-4 py-3 text-sm text-foreground hidden md:table-cell">{st.done}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${st.remaining <= 0 ? 'text-coral' : st.remaining <= 2 ? 'text-orange' : 'text-mint-dark'}`}>
                          {st.remaining}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(s)} className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            ✏️
                          </button>
                          <button onClick={() => setDeleteConfirmId(s.id)} className="px-2 py-1 text-xs text-coral hover:text-coral-dark transition-colors">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Показано {startIndex + 1}-{Math.min(startIndex + studentsPerPage, students.length)} з {students.length}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        currentPage === i + 1 ? 'bg-foreground text-card' : 'text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Редагувати учня' : 'Новий учень'}
        footer={
          <>
            <button onClick={() => setModal(false)} className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-border transition-all">
              Скасувати
            </button>
            <button onClick={save} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all">
              {editId ? 'Оновити' : 'Додати'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Ім'я</label>
            <input
              className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground focus:shadow-[0_0_0_3px_rgba(26,35,68,0.08)]"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Ціна за урок (грн)</label>
            <input
              type="number"
              className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground focus:shadow-[0_0_0_3px_rgba(26,35,68,0.08)]"
              value={form.pricePerLesson}
              onChange={(e) => setForm({ ...form, pricePerLesson: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Видалити учня?"
        footer={
          <>
            <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-border transition-all">
              Скасувати
            </button>
            <button onClick={() => deleteConfirmId && remove(deleteConfirmId)} className="px-4 py-2 rounded-md bg-coral-light text-coral-dark text-sm font-semibold hover:bg-coral/20 transition-all">
              Видалити
            </button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">Ви впевнені, що хочете видалити цього учня? Усі пов'язані уроки та оплати також будуть видалені.</p>
      </Modal>
    </>
  );
}
