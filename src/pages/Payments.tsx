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

    const thStyle: React.CSSProperties = {
        textAlign: "left",
        padding: "11px 16px",
        fontSize: 11,
        fontWeight: 600,
        color: "hsl(var(--muted-foreground))",
        textTransform: "uppercase",
        background: "hsl(var(--secondary) / 0.5)",
        borderBottom: "1px solid hsl(var(--border))",
    };

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
                <div
                    style={{
                        background: "hsl(var(--card))",
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        boxShadow: "0 1px 3px rgba(15,23,42,.06)",
                        overflow: "hidden",
                    }}
                >
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={thStyle}>Учень</th>
                                    <th style={thStyle}>Сума</th>
                                    <th style={thStyle}>Уроків</th>
                                    <th style={thStyle}>Дата</th>
                                    <th style={thStyle}>Примітка</th>
                                    <th style={{ ...thStyle, width: 100 }}>
                                        Дії
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPayments.map((p) => {
                                    const st = getStudent(p.student_id);
                                    const la =
                                        st && st.price_per_lesson > 0
                                            ? Math.floor(
                                                  p.amount /
                                                      st.price_per_lesson,
                                              )
                                            : 0;
                                    return (
                                        <tr
                                            key={p.id}
                                            style={{
                                                borderBottom:
                                                    "1px solid hsl(var(--border) / 0.5)",
                                                transition: "background .15s",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.background =
                                                    "hsl(var(--secondary) / 0.3)")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.background =
                                                    "transparent")
                                            }
                                        >
                                            <td
                                                style={{ padding: "14px 16px" }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 10,
                                                    }}
                                                >
                                                    <Avatar
                                                        name={st?.name || "?"}
                                                        size={32}
                                                    />
                                                    <span
                                                        style={{
                                                            fontWeight: 600,
                                                            color: "hsl(var(--foreground))",
                                                        }}
                                                    >
                                                        {st?.name ||
                                                            "Невідомий"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "14px 16px",
                                                    fontWeight: 700,
                                                    color: "hsl(var(--foreground))",
                                                }}
                                            >
                                                {formatCurrency(p.amount)}
                                            </td>
                                            <td
                                                style={{ padding: "14px 16px" }}
                                            >
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "3px 10px",
                                                        borderRadius: 20,
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        background:
                                                            "hsl(var(--mint-light))",
                                                        color: "hsl(var(--foreground))",
                                                    }}
                                                >
                                                    +{la}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "14px 16px",
                                                    fontSize: 14,
                                                    color: "hsl(var(--foreground))",
                                                }}
                                            >
                                                {formatDate(p.date)}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "14px 16px",
                                                    fontSize: 13,
                                                    color: "hsl(var(--muted-foreground))",
                                                    maxWidth: 200,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {p.note || "—"}
                                            </td>
                                            <td
                                                style={{ padding: "14px 16px" }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 4,
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <button
                                                        onClick={() =>
                                                            openEdit(p)
                                                        }
                                                        title="Редагувати"
                                                        style={{
                                                            padding: "6px",
                                                            borderRadius: 6,
                                                            border: "none",
                                                            background:
                                                                "transparent",
                                                            cursor: "pointer",
                                                            color: "hsl(var(--foreground))",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <svg
                                                            width="14"
                                                            height="14"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setDeleteConfirmId(
                                                                p.id,
                                                            )
                                                        }
                                                        title="Видалити"
                                                        style={{
                                                            padding: "6px",
                                                            borderRadius: 6,
                                                            border: "none",
                                                            background:
                                                                "transparent",
                                                            cursor: "pointer",
                                                            color: "hsl(var(--coral))",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <svg
                                                            width="14"
                                                            height="14"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div
                            style={{
                                padding: "16px 20px",
                                borderTop: "1px solid hsl(var(--border))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 13,
                                    color: "hsl(var(--muted-foreground))",
                                }}
                            >
                                Показано {startIndex + 1}–
                                {Math.min(
                                    startIndex + paymentsPerPage,
                                    sorted.length,
                                )}{" "}
                                з {sorted.length}
                            </div>
                            <div style={{ display: "flex", gap: 4 }}>
                                <button
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(1, p - 1),
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: 6,
                                        border: "none",
                                        background: "transparent",
                                        cursor:
                                            currentPage === 1
                                                ? "not-allowed"
                                                : "pointer",
                                        opacity: currentPage === 1 ? 0.4 : 1,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "hsl(var(--foreground))",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>{" "}
                                    Назад
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: 6,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            border: "none",
                                            background:
                                                currentPage === i + 1
                                                    ? "hsl(var(--foreground))"
                                                    : "transparent",
                                            color:
                                                currentPage === i + 1
                                                    ? "hsl(var(--card))"
                                                    : "hsl(var(--muted-foreground))",
                                            minWidth: 36,
                                        }}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(totalPages, p + 1),
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: 6,
                                        border: "none",
                                        background: "transparent",
                                        cursor:
                                            currentPage === totalPages
                                                ? "not-allowed"
                                                : "pointer",
                                        opacity:
                                            currentPage === totalPages
                                                ? 0.4
                                                : 1,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "hsl(var(--foreground))",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    Вперед{" "}
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
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
