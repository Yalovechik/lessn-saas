import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/hooks/useAuth";
import {
    formatCurrency,
    pluralStudents,
    pluralLessons,
    todayStr,
} from "@/utils/helpers";
import { CalendarPicker } from "@/components/ui/calendar-picker";
import { Avatar } from "@/components/lessn/Avatar";
import { EmptyState } from "@/components/lessn/EmptyState";
import { Modal } from "@/components/lessn/Modal";
import { Toast } from "@/components/lessn/Toast";
import { useToast } from "@/hooks/useToast";
import { Plus } from "lucide-react";
import { DataTable, EditIcon, DeleteIcon, CalendarIcon, type Column } from "@/components/ui/data-table";
import { CustomSelect } from "@/components/ui/custom-select";

export default function Students() {
    const {
        students,
        groups,
        lessons,
        payments,
        addStudent,
        addStudents,
        updateStudent,
        deleteStudent,
        addLesson,
    } = useAppData();
    const { teacher } = useAuth();
    const navigate = useNavigate();
    const [modal, setModal] = useState(false);
    const [batchModal, setBatchModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", pricePerLesson: "" });
    const [batchForm, setBatchForm] = useState({
        names: "",
        pricePerLesson: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [groupFilter, setGroupFilter] = useState("all");
    const studentsPerPage = 10;
    const { toast, showToast, hideToast } = useToast();

    const [lessonModal, setLessonModal] = useState(false);
    const [lessonForm, setLessonForm] = useState({
        studentId: "",
        date: todayStr(),
        time: "",
        duration: 60,
        notes: "",
    });

    const openLessonModal = (studentId: string) => {
        setLessonForm({
            studentId,
            date: todayStr(),
            time: "",
            duration: 60,
            notes: "",
        });
        setLessonModal(true);
    };

    const saveLesson = async () => {
        if (
            !lessonForm.date ||
            !lessonForm.time ||
            !lessonForm.studentId ||
            !teacher
        )
            return;
        await addLesson.mutateAsync({
            student_id: lessonForm.studentId,
            group_id: null,
            is_group: false,
            date: lessonForm.date,
            time: lessonForm.time,
            duration: lessonForm.duration,
            notes: lessonForm.notes,
            status: "scheduled",
            teacher_id: teacher.id,
        });
        setLessonModal(false);
    };

    const filteredStudents = students.filter((s) => {
        if (groupFilter === "all") return true;
        if (groupFilter === "no-group")
            return !groups.some((g) => g.student_ids?.includes(s.id));
        return groups
            .find((g) => g.id === groupFilter)
            ?.student_ids?.includes(s.id);
    });

    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
    const startIndex = (currentPage - 1) * studentsPerPage;
    const paginatedStudents = filteredStudents.slice(
        startIndex,
        startIndex + studentsPerPage,
    );

    const openNew = () => {
        setForm({ name: "", pricePerLesson: "" });
        setEditId(null);
        setModal(true);
    };
    const openEdit = (s: (typeof students)[0]) => {
        setForm({ name: s.name, pricePerLesson: String(s.price_per_lesson) });
        setEditId(s.id);
        setModal(true);
    };
    const openBatch = () => {
        setBatchForm({ names: "", pricePerLesson: "" });
        setBatchModal(true);
    };

    const saveBatch = async () => {
        if (!batchForm.names.trim() || !batchForm.pricePerLesson || !teacher)
            return;
        const names = batchForm.names
            .split("\n")
            .map((n) => n.trim())
            .filter((n) => n.length > 0);
        if (names.length === 0) return;
        const dupes = names.filter(
            (n, i) =>
                names.findIndex((x) => x.toLowerCase() === n.toLowerCase()) !==
                i,
        );
        if (dupes.length > 0) {
            showToast(
                `У списку є дублікати: ${[...new Set(dupes)].join(", ")}`,
                "error",
            );
            return;
        }
        const existing = names.filter((n) =>
            students.some((s) => s.name.toLowerCase() === n.toLowerCase()),
        );
        if (existing.length > 0) {
            showToast(`Вже існують: ${existing.join(", ")}`, "error");
            return;
        }
        try {
            await addStudents.mutateAsync(
                names.map((name) => ({
                    name,
                    subject: teacher.subject,
                    price_per_lesson: Number(batchForm.pricePerLesson),
                    teacher_id: teacher.id,
                    notes: "",
                })),
            );
            showToast(`${names.length} учнів успішно додано`, "success");
            setBatchModal(false);
        } catch (err: unknown) {
            showToast((err as Error).message, "error");
        }
    };

    const save = async () => {
        if (!form.name.trim() || !form.pricePerLesson || !teacher) return;
        if (
            students.some(
                (s) =>
                    s.name.toLowerCase() === form.name.trim().toLowerCase() &&
                    s.id !== editId,
            )
        ) {
            showToast(
                `Учень з ім'ям "${form.name.trim()}" вже існує.`,
                "error",
            );
            return;
        }
        try {
            if (editId) {
                await updateStudent.mutateAsync({
                    id: editId,
                    name: form.name.trim(),
                    price_per_lesson: Number(form.pricePerLesson),
                });
                showToast("Учня успішно оновлено", "success");
            } else {
                await addStudent.mutateAsync({
                    name: form.name.trim(),
                    subject: teacher.subject,
                    price_per_lesson: Number(form.pricePerLesson),
                    teacher_id: teacher.id,
                    notes: "",
                });
                showToast("Учня успішно додано", "success");
            }
            setModal(false);
        } catch (err: unknown) {
            showToast((err as Error).message, "error");
        }
    };

    const remove = async (id: string) => {
        try {
            await deleteStudent.mutateAsync(id);
            setDeleteConfirmId(null);
            showToast("Учня видалено", "success");
        } catch (err: unknown) {
            showToast((err as Error).message, "error");
        }
    };

    const stats = (id: string) => {
        const st = students.find((s) => s.id === id);
        if (!st) return { totalPaid: 0, done: 0, remaining: 0 };
        const paid = payments
            .filter((p) => p.student_id === id)
            .reduce((s, p) => s + p.amount, 0);
        const lp =
            st.price_per_lesson > 0
                ? Math.floor(paid / st.price_per_lesson)
                : 0;
        const done = lessons.filter(
            (l) => l.student_id === id && l.status === "completed",
        ).length;
        return { totalPaid: paid, done, remaining: lp - done };
    };

    const studentLessonCounts = (id: string) => {
        const td = new Date().toISOString().split("T")[0];
        const ls = lessons.filter((l) => l.student_id === id);
        return {
            total: ls.length,
            upcoming: ls.filter((l) => l.date >= td && l.status === "scheduled")
                .length,
        };
    };

    type StudentRow = (typeof students)[number];

    const studentColumns: Column<StudentRow>[] = useMemo(() => [
        {
            header: "Учень",
            render: (s) => {
                const lc = studentLessonCounts(s.id);
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={s.name} size={32} />
                        <div>
                            <div style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>
                                {s.name}
                            </div>
                            <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                                {lc.total} {pluralLessons(lc.total)}
                                {lc.upcoming > 0 && ` · ${lc.upcoming} заплановано`}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            header: "Група",
            render: (s) => {
                const studentGroup = groups.find((g) => g.student_ids?.includes(s.id));
                return studentGroup ? (
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            borderRadius: 16,
                            background: "hsl(var(--mint-50))",
                            border: "1px solid hsl(var(--mint-dark) / 0.15)",
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{studentGroup.name}</span>
                    </div>
                ) : (
                    <span style={{ fontSize: 13, color: "hsl(var(--muted-foreground))" }}>Без групи</span>
                );
            },
        },
        {
            header: "Ціна/Урок",
            render: (s) => (
                <span style={{ fontWeight: 600 }}>{formatCurrency(s.price_per_lesson)}</span>
            ),
        },
        {
            header: "Оплачено",
            render: (s) => formatCurrency(stats(s.id).totalPaid),
        },
        {
            header: "Проведено",
            render: (s) => <span style={{ fontWeight: 600 }}>{stats(s.id).done}</span>,
        },
        {
            header: "Залишок",
            render: (s) => {
                const st = stats(s.id);
                return (
                    <span
                        style={{
                            display: "inline-block",
                            padding: "3px 12px",
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 700,
                            background:
                                st.remaining <= 0
                                    ? "hsl(var(--coral-light))"
                                    : st.remaining <= 2
                                      ? "hsl(var(--orange-light))"
                                      : "hsl(var(--mint-light))",
                            color:
                                st.remaining <= 0
                                    ? "hsl(var(--coral-dark))"
                                    : st.remaining <= 2
                                      ? "hsl(var(--orange-dark))"
                                      : "hsl(var(--foreground))",
                        }}
                    >
                        {st.remaining}
                    </span>
                );
            },
        },
        {
            header: "Дії",
            width: 140,
            render: (s) => (
                <div
                    style={{ display: "flex", gap: 4, alignItems: "center" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => openLessonModal(s.id)}
                        title="Запланувати урок"
                        style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "hsl(var(--foreground))", display: "flex", alignItems: "center" }}
                    >
                        <CalendarIcon />
                    </button>
                    <button
                        onClick={() => openEdit(s)}
                        title="Редагувати"
                        style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "hsl(var(--foreground))", display: "flex", alignItems: "center" }}
                    >
                        <EditIcon />
                    </button>
                    <button
                        onClick={() => setDeleteConfirmId(s.id)}
                        title="Видалити"
                        style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "hsl(var(--coral))", display: "flex", alignItems: "center" }}
                    >
                        <DeleteIcon color="hsl(var(--coral))" />
                    </button>
                </div>
            ),
        },
    ], [groups, lessons, payments, students]);

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}

            <div className="space-y-6">
                {/* Header */}
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
                            Учні
                        </h1>
                        <p
                            style={{
                                fontSize: 14,
                                color: "hsl(var(--muted-foreground))",
                                marginTop: 4,
                            }}
                        >
                            {students.length} {pluralStudents(students.length)}{" "}
                            зареєстровано
                            {groupFilter !== "all" &&
                                ` · ${filteredStudents.length} показано`}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            onClick={openBatch}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "9px 16px",
                                borderRadius: 8,
                                border: "1.5px solid hsl(var(--border))",
                                background: "hsl(var(--card))",
                                color: "hsl(var(--foreground))",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            <Plus size={14} /> Додати групою
                        </button>
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
                            <Plus size={14} /> Додати учня
                        </button>
                    </div>
                </div>

                {/* Group filter */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "hsl(var(--muted-foreground))",
                        }}
                    >
                        Фільтр:
                    </span>
                    <CustomSelect
                        value={groupFilter}
                        onChange={(v) => { setGroupFilter(v); setCurrentPage(1); }}
                        options={[
                            { value: "all", label: `Всі учні (${students.length})` },
                            { value: "no-group", label: `Без групи (${students.filter((s) => !groups.some((g) => g.student_ids?.includes(s.id))).length})` },
                            ...groups.map((g) => ({
                                value: g.id,
                                label: `${g.name} (${g.student_ids?.length || 0})`,
                            })),
                        ]}
                    />
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
                            icon="📚"
                            title="Учнів поки немає"
                            desc="Додайте першого учня, щоб почати"
                            action={
                                <button
                                    onClick={openNew}
                                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all"
                                >
                                    Додати учня
                                </button>
                            }
                        />
                    </div>
                ) : (
                    <DataTable
                        columns={studentColumns}
                        data={paginatedStudents}
                        keyExtractor={(s) => s.id}
                        onRowClick={(s) => navigate(`/students/${s.id}`)}
                        pagination={{
                            page: currentPage,
                            setPage: setCurrentPage,
                            pageSize: studentsPerPage,
                            total: filteredStudents.length,
                        }}
                    />
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                open={modal}
                onClose={() => setModal(false)}
                title={editId ? "Редагувати учня" : "Новий учень"}
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
                            {editId ? "Оновити" : "Додати"}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Ім'я
                        </label>
                        <input
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Ціна за урок (грн)
                        </label>
                        <input
                            type="number"
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground"
                            value={form.pricePerLesson}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    pricePerLesson: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>
            </Modal>

            {/* Batch Add Modal */}
            <Modal
                open={batchModal}
                onClose={() => setBatchModal(false)}
                title="Додати учнів групою"
                footer={
                    <>
                        <button
                            onClick={() => setBatchModal(false)}
                            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-border transition-all"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={saveBatch}
                            disabled={
                                !batchForm.names.trim() ||
                                !batchForm.pricePerLesson
                            }
                            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Додати (
                            {
                                batchForm.names
                                    .split("\n")
                                    .filter((n) => n.trim()).length
                            }
                            )
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div
                        style={{
                            background: "hsl(var(--mint-50))",
                            border: "1px solid hsl(var(--mint-dark) / 0.15)",
                            borderRadius: 8,
                            padding: "12px 14px",
                            fontSize: 13,
                        }}
                    >
                        💡 <strong>Підказка:</strong> Введіть кожне ім'я з
                        нового рядка. Усі учні матимуть однакову ціну за урок.
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Імена учнів (кожен з нового рядка)
                        </label>
                        <textarea
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground"
                            placeholder={
                                "Іван Петренко\nМарія Коваленко\nОлександр Шевченко"
                            }
                            value={batchForm.names}
                            onChange={(e) =>
                                setBatchForm({
                                    ...batchForm,
                                    names: e.target.value,
                                })
                            }
                            rows={8}
                            style={{ resize: "vertical" }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {
                                batchForm.names
                                    .split("\n")
                                    .filter((n) => n.trim()).length
                            }{" "}
                            учнів буде додано
                        </p>
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Ціна за урок для всіх (грн)
                        </label>
                        <input
                            type="number"
                            min="0"
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground"
                            placeholder="напр. 500"
                            value={batchForm.pricePerLesson}
                            onChange={(e) =>
                                setBatchForm({
                                    ...batchForm,
                                    pricePerLesson: e.target.value,
                                })
                            }
                        />
                    </div>
                    {batchForm.names.trim() && batchForm.pricePerLesson && (
                        <div
                            style={{
                                background: "hsl(var(--secondary) / 0.5)",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: 8,
                                padding: "10px 14px",
                                fontSize: 13,
                            }}
                        >
                            <p className="text-[13px] font-semibold mb-1">
                                Попередній перегляд:
                            </p>
                            <div className="text-muted-foreground">
                                {batchForm.names
                                    .split("\n")
                                    .filter((n) => n.trim())
                                    .slice(0, 3)
                                    .map((name, i) => (
                                        <div key={i} className="text-xs py-0.5">
                                            • {name} —{" "}
                                            {Number(
                                                batchForm.pricePerLesson,
                                            ).toLocaleString("uk")}{" "}
                                            грн/урок
                                        </div>
                                    ))}
                                {batchForm.names
                                    .split("\n")
                                    .filter((n) => n.trim()).length > 3 && (
                                    <div className="text-xs text-muted-foreground/60 py-0.5">
                                        ... та ще{" "}
                                        {batchForm.names
                                            .split("\n")
                                            .filter((n) => n.trim()).length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <Modal
                open={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                title="Видалити учня?"
                footer={
                    <>
                        <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-border transition-all"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={() =>
                                deleteConfirmId && remove(deleteConfirmId)
                            }
                            className="px-4 py-2 rounded-md bg-coral-light text-coral-dark text-sm font-semibold hover:bg-coral/20 transition-all"
                        >
                            Видалити
                        </button>
                    </>
                }
            >
                <p className="text-sm text-muted-foreground">
                    Ви впевнені, що хочете видалити цього учня? Усі пов'язані
                    уроки та оплати також будуть видалені.
                </p>
            </Modal>

            {/* Schedule Lesson Modal */}
            <Modal
                open={lessonModal}
                onClose={() => setLessonModal(false)}
                title="Запланувати урок"
                footer={
                    <>
                        <button
                            onClick={() => setLessonModal(false)}
                            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-border transition-all"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={saveLesson}
                            disabled={!lessonForm.time || !lessonForm.date}
                            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Запланувати
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
                            value={lessonForm.studentId}
                            onChange={(v) => setLessonForm({ ...lessonForm, studentId: v })}
                            searchable
                            options={students.map((s) => ({
                                value: s.id,
                                label: s.name,
                            }))}
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Дата
                        </label>
                        <CalendarPicker
                            value={lessonForm.date}
                            onChange={(v) =>
                                setLessonForm({ ...lessonForm, date: v })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Час початку
                        </label>
                        <input
                            type="time"
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                            value={lessonForm.time}
                            onChange={(e) =>
                                setLessonForm({
                                    ...lessonForm,
                                    time: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Тривалість (хв)
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                            {[30, 45, 60, 90].map((d) => (
                                <button
                                    key={d}
                                    onClick={() =>
                                        setLessonForm({
                                            ...lessonForm,
                                            duration: d,
                                        })
                                    }
                                    style={{
                                        flex: 1,
                                        padding: "8px",
                                        borderRadius: 8,
                                        border:
                                            lessonForm.duration === d
                                                ? "2px solid hsl(var(--foreground))"
                                                : "1.5px solid hsl(var(--border))",
                                        background:
                                            lessonForm.duration === d
                                                ? "hsl(var(--mint-50))"
                                                : "hsl(var(--card))",
                                        fontWeight:
                                            lessonForm.duration === d
                                                ? 700
                                                : 500,
                                        cursor: "pointer",
                                        fontSize: 13,
                                    }}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Нотатки
                        </label>
                        <input
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                            value={lessonForm.notes}
                            onChange={(e) =>
                                setLessonForm({
                                    ...lessonForm,
                                    notes: e.target.value,
                                })
                            }
                            placeholder="Тема, домашнє завдання тощо (необов'язково)"
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
}
