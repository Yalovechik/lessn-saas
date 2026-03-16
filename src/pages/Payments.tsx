import { useState, useMemo } from "react";
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
import { DataTable, EditIcon, DeleteIcon, type Column } from "@/components/ui/data-table";
import { CustomSelect } from "@/components/ui/custom-select";

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

    type PaymentRow = (typeof payments)[number];

    const paymentColumns: Column<PaymentRow>[] = useMemo(() => [
        {
            header: "Учень",
            render: (p) => {
                const st = getStudent(p.student_id);
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={st?.name || "?"} size={32} />
                        <span style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>
                            {st?.name || "Невідомий"}
                        </span>
                    </div>
                );
            },
        },
        {
            header: "Сума",
            render: (p) => (
                <span style={{ fontWeight: 700, color: "hsl(var(--foreground))" }}>
                    {formatCurrency(p.amount)}
                </span>
            ),
        },
        {
            header: "Уроків",
            render: (p) => {
                const st = getStudent(p.student_id);
                const la = st && st.price_per_lesson > 0 ? Math.floor(p.amount / st.price_per_lesson) : 0;
                return (
                    <span style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        background: "hsl(var(--mint-light))",
                        color: "hsl(var(--foreground))",
                    }}>
                        +{la}
                    </span>
                );
            },
        },
        {
            header: "Дата",
            render: (p) => (
                <span style={{ fontSize: 14, color: "hsl(var(--foreground))" }}>
                    {formatDate(p.date)}
                </span>
            ),
        },
        {
            header: "Примітка",
            render: (p) => (
                <span style={{
                    fontSize: 13,
                    color: "hsl(var(--muted-foreground))",
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                }}>
                    {p.note || "—"}
                </span>
            ),
        },
        {
            header: "Дії",
            width: 100,
            render: (p) => (
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button
                        onClick={() => openEdit(p)}
                        title="Редагувати"
                        style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "hsl(var(--foreground))", display: "flex", alignItems: "center" }}
                    >
                        <EditIcon />
                    </button>
                    <button
                        onClick={() => setDeleteConfirmId(p.id)}
                        title="Видалити"
                        style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "hsl(var(--coral))", display: "flex", alignItems: "center" }}
                    >
                        <DeleteIcon color="hsl(var(--coral))" />
                    </button>
                </div>
            ),
        },
    ], [students, payments]);

    return (
        <div className="space-y-6">
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: 26,
                            fontWeight: 700,
                            letterSpacing: "-0.3px",
                            color: "hsl(var(--foreground))",
                            lineHeight: 1.2,
                        }}
                    >
                        Оплати
                    </h1>
                    <p
                        style={{
                            fontSize: 14,
                            color: "hsl(var(--muted-foreground))",
                            marginTop: 4,
                        }}
                    >
                        {payments.length} {pluralPayments(payments.length)}{" "}
                        записано
                    </p>
                </div>
                <button
                    onClick={openNew}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "9px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "hsl(var(--foreground))",
                        color: "hsl(var(--card))",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    <Plus size={14} /> Записати оплату
                </button>
            </div>

            {students.length === 0 ? (
                <div
                    style={{
                        background: "hsl(var(--card))",
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                    }}
                >
                    <EmptyState
                        icon="💰"
                        title="Спочатку додайте учнів"
                        desc="Для запису оплат потрібні учні"
                    />
                </div>
            ) : sorted.length === 0 ? (
                <div
                    style={{
                        background: "hsl(var(--card))",
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                    }}
                >
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
                <DataTable
                    columns={paymentColumns}
                    data={paginatedPayments}
                    keyExtractor={(p) => p.id}
                    pagination={{
                        page: currentPage,
                        setPage: setCurrentPage,
                        pageSize: paymentsPerPage,
                        total: sorted.length,
                    }}
                />
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
                        <CustomSelect
                            value={form.studentId}
                            onChange={(v) => setForm({ ...form, studentId: v })}
                            searchable
                            options={students.map((s) => ({
                                value: s.id,
                                label: `${s.name} — ${formatCurrency(s.price_per_lesson)}/урок`,
                            }))}
                        />
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
