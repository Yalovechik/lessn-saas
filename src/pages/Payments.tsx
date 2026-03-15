import { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/hooks/useAuth";
import {
    formatCurrency,
    formatDate,
    todayStr,
    pluralPayments,
} from "@/utils/helpers";
import { Avatar } from "@/components/lessn/Avatar";
import { EmptyState } from "@/components/lessn/EmptyState";
import { Modal } from "@/components/lessn/Modal";
import { Plus } from "lucide-react";

export default function Payments() {
    const { students, payments, addPayment, updatePayment, deletePayment } =
        useAppData();
    const { teacher } = useAuth();
    const [modal, setModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [form, setForm] = useState({
        studentId: "",
        amount: "",
        date: todayStr(),
        note: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const paymentsPerPage = 10;

    const openNew = () => {
        setForm({
            studentId: students[0]?.id || "",
            amount: "",
            date: todayStr(),
            note: "",
        });
        setEditId(null);
        setModal(true);
    };

    const openEdit = (p: (typeof payments)[0]) => {
        setForm({
            studentId: p.student_id,
            amount: String(p.amount),
            date: p.date,
            note: p.note,
        });
        setEditId(p.id);
        setModal(true);
    };

    const save = async () => {
        if (!form.studentId || !form.amount || !teacher) return;
        try {
            if (editId) {
                await updatePayment.mutateAsync({
                    id: editId,
                    student_id: form.studentId,
                    amount: Number(form.amount),
                    date: form.date,
                    note: form.note,
                });
            } else {
                await addPayment.mutateAsync({
                    student_id: form.studentId,
                    amount: Number(form.amount),
                    date: form.date,
                    note: form.note,
                    teacher_id: teacher.id,
                });
            }
            setModal(false);
        } catch (err) {
            console.error(err);
        }
    };

    const remove = async (id: string) => {
        await deletePayment.mutateAsync(id);
        setDeleteConfirmId(null);
    };

    const sorted = [...payments].sort((a, b) => b.date.localeCompare(a.date));
    const totalPages = Math.ceil(sorted.length / paymentsPerPage);
    const startIndex = (currentPage - 1) * paymentsPerPage;
    const paginatedPayments = sorted.slice(
        startIndex,
        startIndex + paymentsPerPage,
    );

    const getStudent = (id: string) => students.find((s) => s.id === id);
    const selectedStudent = getStudent(form.studentId);
    const previewLessons =
        selectedStudent && form.amount && selectedStudent.price_per_lesson > 0
            ? Math.floor(Number(form.amount) / selectedStudent.price_per_lesson)
            : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-foreground leading-tight">
                        Оплати
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {payments.length} {pluralPayments(payments.length)}{" "}
                        записано
                    </p>
                </div>
                <button
                    onClick={openNew}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold transition-all hover:bg-mint-dark"
                >
                    <Plus className="h-4 w-4" />
                    Записати оплату
                </button>
            </div>

            {students.length === 0 ? (
                <div className="bg-card rounded-lg border border-border">
                    <EmptyState
                        icon="💰"
                        title="Спочатку додайте учнів"
                        desc="Для запису оплат потрібні учні"
                    />
                </div>
            ) : sorted.length === 0 ? (
                <div className="bg-card rounded-lg border border-border">
                    <EmptyState
                        icon="💰"
                        title="Оплат ще немає"
                        desc="Запишіть першу оплату"
                        action={
                            <button
                                onClick={openNew}
                                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all"
                            >
                                Записати оплату
                            </button>
                        }
                    />
                </div>
            ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-secondary/50 border-b border-border">
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase">
                                    Учень
                                </th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase">
                                    Сума
                                </th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">
                                    Уроків
                                </th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">
                                    Дата
                                </th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase hidden md:table-cell">
                                    Примітка
                                </th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPayments.map((p) => {
                                const st = getStudent(p.student_id);
                                const la =
                                    st && st.price_per_lesson > 0
                                        ? Math.floor(
                                              p.amount / st.price_per_lesson,
                                          )
                                        : 0;
                                return (
                                    <tr
                                        key={p.id}
                                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={st?.name || "?"}
                                                    size={28}
                                                />
                                                <span className="text-sm font-medium text-foreground">
                                                    {st?.name || "Невідомий"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-foreground">
                                            {formatCurrency(p.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-mint-dark font-medium hidden sm:table-cell">
                                            +{la} уроків
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                                            {formatDate(p.date)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                                            {p.note || "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEdit(p)}
                                                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setDeleteConfirmId(p.id)
                                                    }
                                                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-sm text-coral hover:text-coral-dark rounded-md hover:bg-coral-light transition-colors"
                                                >
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
                                Показано {startIndex + 1}-
                                {Math.min(
                                    startIndex + paymentsPerPage,
                                    sorted.length,
                                )}{" "}
                                з {sorted.length}
                            </span>
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${currentPage === i + 1 ? "bg-foreground text-card" : "text-muted-foreground hover:bg-secondary"}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <Modal
                open={modal}
                onClose={() => setModal(false)}
                title={editId ? "Редагувати оплату" : "Записати оплату"}
                footer={
                    <>
                        <button
                            onClick={() => setModal(false)}
                            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-border transition-all"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={save}
                            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all"
                        >
                            {editId ? "Оновити" : "Записати"}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Учень
                        </label>
                        <select
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                            value={form.studentId}
                            onChange={(e) =>
                                setForm({ ...form, studentId: e.target.value })
                            }
                        >
                            {students.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} —{" "}
                                    {formatCurrency(s.price_per_lesson)}/урок
                                </option>
                            ))}
                        </select>
                    </div>
                    {form.amount && selectedStudent && (
                        <div className="bg-mint-50 rounded-md p-3 text-sm text-foreground">
                            {formatCurrency(Number(form.amount))} ÷{" "}
                            {formatCurrency(selectedStudent.price_per_lesson)} ={" "}
                            <strong>{previewLessons} уроків</strong>
                        </div>
                    )}
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Сума (грн)
                        </label>
                        <input
                            type="number"
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                            value={form.amount}
                            onChange={(e) =>
                                setForm({ ...form, amount: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Дата
                        </label>
                        <input
                            type="date"
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                            value={form.date}
                            onChange={(e) =>
                                setForm({ ...form, date: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Примітка
                        </label>
                        <input
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                            value={form.note}
                            onChange={(e) =>
                                setForm({ ...form, note: e.target.value })
                            }
                            placeholder="Необов'язково"
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete confirm */}
            <Modal
                open={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                title="Видалити оплату?"
                footer={
                    <>
                        <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={() =>
                                deleteConfirmId && remove(deleteConfirmId)
                            }
                            className="px-4 py-2 rounded-md bg-coral-light text-coral-dark text-sm font-semibold"
                        >
                            Видалити
                        </button>
                    </>
                }
            >
                <p className="text-sm text-muted-foreground">
                    Ви впевнені, що хочете видалити цю оплату?
                </p>
            </Modal>
        </div>
    );
}
