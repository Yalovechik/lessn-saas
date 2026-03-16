import { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/hooks/useAuth";
import {
    formatDate,
    formatTime,
    todayStr,
    pluralLessons,
} from "@/utils/helpers";
import { Avatar } from "@/components/lessn/Avatar";
import { EmptyState } from "@/components/lessn/EmptyState";
import { Modal } from "@/components/lessn/Modal";
import { STATUS_LABELS, FILTER_LABELS } from "@/constants";
import { Plus } from "lucide-react";
import { CalendarPicker } from "@/components/ui/calendar-picker";

export default function Lessons() {
    const { students, lessons, groups, addLesson, updateLesson, deleteLesson } =
        useAppData();
    const { teacher } = useAuth();
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({
        type: "individual" as "individual" | "group",
        studentId: "",
        groupId: "",
        date: todayStr(),
        time: "",
        duration: 60,
        notes: "",
    });
    const [filter, setFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const lessonsPerPage = 15;

    const openNew = () => {
        setForm({
            type: "individual",
            studentId: students[0]?.id || "",
            groupId: groups[0]?.id || "",
            date: todayStr(),
            time: "",
            duration: 60,
            notes: "",
        });
        setModal(true);
    };

    const add = async () => {
        if (!form.date || !form.time || !teacher) return;
        if (form.type === "individual" && !form.studentId) return;
        if (form.type === "group" && !form.groupId) return;
        await addLesson.mutateAsync({
            student_id: form.type === "individual" ? form.studentId : null,
            group_id: form.type === "group" ? form.groupId : null,
            is_group: form.type === "group",
            date: form.date,
            time: form.time,
            duration: form.duration,
            notes: form.notes,
            status: "scheduled",
            teacher_id: teacher.id,
        });
        setModal(false);
    };

    const setStatus = async (
        id: string,
        status: "scheduled" | "completed" | "cancelled" | "rescheduled",
    ) => {
        await updateLesson.mutateAsync({ id, status });
    };

    const remove = async (id: string) => {
        if (confirm("Видалити урок?")) await deleteLesson.mutateAsync(id);
    };

    const filtered =
        filter === "all" ? lessons : lessons.filter((l) => l.status === filter);
    const sorted = [...filtered].sort(
        (a, b) =>
            b.date.localeCompare(a.date) ||
            (b.time || "").localeCompare(a.time || ""),
    );
    const totalPages = Math.ceil(sorted.length / lessonsPerPage);
    const startIndex = (currentPage - 1) * lessonsPerPage;
    const paginatedLessons = sorted.slice(
        startIndex,
        startIndex + lessonsPerPage,
    );

    const getLessonDisplay = (lesson: (typeof lessons)[0]) => {
        if (lesson.is_group && lesson.group_id) {
            const g = groups.find((g) => g.id === lesson.group_id);
            return {
                name: g?.name || "Невідома група",
                subtitle: `${g?.student_ids?.length || 0} учнів`,
                isGroup: true,
            };
        }
        const s = lesson.student_id
            ? students.find((s) => s.id === lesson.student_id)
            : null;
        return {
            name: s?.name || "Невідомий",
            subtitle: s?.subject || "",
            isGroup: false,
        };
    };

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

    const statusBadge = (status: string) => {
        const map: Record<string, { bg: string; color: string; dot: string }> =
            {
                scheduled: {
                    bg: "hsl(var(--secondary))",
                    color: "hsl(var(--foreground))",
                    dot: "hsl(var(--foreground))",
                },
                completed: {
                    bg: "hsl(var(--mint-light))",
                    color: "hsl(var(--foreground))",
                    dot: "hsl(var(--mint-dark))",
                },
                cancelled: {
                    bg: "hsl(var(--coral-light))",
                    color: "hsl(var(--coral-dark))",
                    dot: "hsl(var(--coral))",
                },
                rescheduled: {
                    bg: "hsl(var(--orange-light))",
                    color: "hsl(var(--orange-dark))",
                    dot: "hsl(var(--orange))",
                },
            };
        return map[status] || map.scheduled;
    };

    return (
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
                        Уроки
                    </h1>
                    <p
                        style={{
                            fontSize: 14,
                            color: "hsl(var(--muted-foreground))",
                            marginTop: 4,
                        }}
                    >
                        {lessons.length} {pluralLessons(lessons.length)} загалом
                    </p>
                </div>
                <button
                    onClick={openNew}
                    disabled={students.length === 0}
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
                        cursor:
                            students.length === 0 ? "not-allowed" : "pointer",
                        opacity: students.length === 0 ? 0.5 : 1,
                    }}
                >
                    <Plus size={14} /> Додати урок
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
                        icon="📚"
                        title="Спочатку додайте учня"
                        desc="Потрібен хоча б один учень для планування уроків"
                    />
                </div>
            ) : (
                <>
                    {/* Filter pills */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {(
                            [
                                "all",
                                "scheduled",
                                "completed",
                                "cancelled",
                                "rescheduled",
                            ] as const
                        ).map((f) => (
                            <button
                                key={f}
                                onClick={() => {
                                    setFilter(f);
                                    setCurrentPage(1);
                                }}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: 20,
                                    border:
                                        filter === f
                                            ? "1.5px solid hsl(var(--foreground))"
                                            : "1.5px solid hsl(var(--border))",
                                    background:
                                        filter === f
                                            ? "hsl(var(--foreground))"
                                            : "hsl(var(--card))",
                                    color:
                                        filter === f
                                            ? "hsl(var(--card))"
                                            : "hsl(var(--muted-foreground))",
                                    fontSize: 12.5,
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    transition: "all .15s",
                                }}
                            >
                                {FILTER_LABELS[f]}
                            </button>
                        ))}
                    </div>

                    {sorted.length === 0 ? (
                        <div
                            style={{
                                background: "hsl(var(--card))",
                                borderRadius: 12,
                                border: "1px solid hsl(var(--border))",
                            }}
                        >
                            <EmptyState
                                icon="📝"
                                title="Уроків не знайдено"
                                desc="Спробуйте інший фільтр або додайте новий урок"
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
                                            <th style={thStyle}>Дата</th>
                                            <th style={thStyle}>Час</th>
                                            <th style={thStyle}>Статус</th>
                                            <th style={thStyle}>Дії</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedLessons.map((l) => {
                                            const display = getLessonDisplay(l);
                                            const badge = statusBadge(l.status);
                                            return (
                                                <tr
                                                    key={l.id}
                                                    style={{
                                                        borderBottom:
                                                            "1px solid hsl(var(--border) / 0.5)",
                                                        transition:
                                                            "background .15s",
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
                                                        style={{
                                                            padding:
                                                                "14px 16px",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 10,
                                                            }}
                                                        >
                                                            {display.isGroup ? (
                                                                <div
                                                                    style={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius:
                                                                            "50%",
                                                                        background:
                                                                            "hsl(var(--mint-light))",
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        justifyContent:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    👥
                                                                </div>
                                                            ) : (
                                                                <Avatar
                                                                    name={
                                                                        display.name
                                                                    }
                                                                    size={32}
                                                                />
                                                            )}
                                                            <div>
                                                                <div
                                                                    style={{
                                                                        fontWeight: 600,
                                                                        color: "hsl(var(--foreground))",
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        gap: 6,
                                                                    }}
                                                                >
                                                                    {
                                                                        display.name
                                                                    }
                                                                    {display.isGroup && (
                                                                        <span
                                                                            style={{
                                                                                fontSize: 11,
                                                                                padding:
                                                                                    "2px 6px",
                                                                                borderRadius: 4,
                                                                                background:
                                                                                    "hsl(var(--mint-light))",
                                                                                color: "hsl(var(--foreground))",
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            ГРУПА
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 12,
                                                                        color: "hsl(var(--muted-foreground))",
                                                                    }}
                                                                >
                                                                    {
                                                                        display.subtitle
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "14px 16px",
                                                            fontSize: 14,
                                                        }}
                                                    >
                                                        {formatDate(l.date)}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "14px 16px",
                                                            fontSize: 14,
                                                            color: l.time
                                                                ? "hsl(var(--foreground))"
                                                                : "hsl(var(--muted-foreground))",
                                                        }}
                                                    >
                                                        {l.time
                                                            ? formatTime(l.time)
                                                            : "—"}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "14px 16px",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 6,
                                                                padding:
                                                                    "4px 10px",
                                                                borderRadius: 20,
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                                background:
                                                                    badge.bg,
                                                                color: badge.color,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    width: 6,
                                                                    height: 6,
                                                                    borderRadius:
                                                                        "50%",
                                                                    background:
                                                                        badge.dot,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            {
                                                                STATUS_LABELS[
                                                                    l.status
                                                                ]
                                                            }
                                                        </span>
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "14px 16px",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 4,
                                                                flexWrap:
                                                                    "wrap",
                                                                alignItems:
                                                                    "center",
                                                            }}
                                                        >
                                                            {/* Complete toggle */}
                                                            <button
                                                                onClick={() =>
                                                                    setStatus(
                                                                        l.id,
                                                                        l.status ===
                                                                            "completed"
                                                                            ? "scheduled"
                                                                            : "completed",
                                                                    )
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "5px 12px",
                                                                    borderRadius: 6,
                                                                    border: "none",
                                                                    fontSize: 12,
                                                                    fontWeight: 600,
                                                                    cursor: "pointer",
                                                                    transition:
                                                                        "all .15s",
                                                                    background:
                                                                        l.status ===
                                                                        "completed"
                                                                            ? "hsl(var(--mint-dark))"
                                                                            : "hsl(var(--mint-light))",
                                                                    color:
                                                                        l.status ===
                                                                        "completed"
                                                                            ? "#fff"
                                                                            : "hsl(var(--foreground))",
                                                                }}
                                                            >
                                                                ✓{" "}
                                                                {l.status ===
                                                                "completed"
                                                                    ? "Виконано"
                                                                    : "Готово"}
                                                            </button>
                                                            {/* Cancel toggle */}
                                                            <button
                                                                onClick={() =>
                                                                    setStatus(
                                                                        l.id,
                                                                        l.status ===
                                                                            "cancelled"
                                                                            ? "scheduled"
                                                                            : "cancelled",
                                                                    )
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "5px 12px",
                                                                    borderRadius: 6,
                                                                    border: "none",
                                                                    fontSize: 12,
                                                                    fontWeight: 600,
                                                                    cursor: "pointer",
                                                                    transition:
                                                                        "all .15s",
                                                                    background:
                                                                        l.status ===
                                                                        "cancelled"
                                                                            ? "hsl(var(--coral))"
                                                                            : "hsl(var(--coral-light))",
                                                                    color:
                                                                        l.status ===
                                                                        "cancelled"
                                                                            ? "#fff"
                                                                            : "hsl(var(--coral-dark))",
                                                                }}
                                                            >
                                                                {l.status ===
                                                                "cancelled"
                                                                    ? "✕ Скасовано"
                                                                    : "Скасувати"}
                                                            </button>
                                                            {/* Delete */}
                                                            <button
                                                                onClick={() =>
                                                                    remove(l.id)
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "5px 8px",
                                                                    borderRadius: 6,
                                                                    border: "none",
                                                                    background:
                                                                        "transparent",
                                                                    cursor: "pointer",
                                                                    color: "hsl(var(--muted-foreground))",
                                                                    fontSize: 14,
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                }}
                                                                onMouseEnter={(
                                                                    e,
                                                                ) =>
                                                                    (e.currentTarget.style.color =
                                                                        "hsl(var(--coral))")
                                                                }
                                                                onMouseLeave={(
                                                                    e,
                                                                ) =>
                                                                    (e.currentTarget.style.color =
                                                                        "hsl(var(--muted-foreground))")
                                                                }
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
                                        borderTop:
                                            "1px solid hsl(var(--border))",
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
                                        Показано {startIndex + 1}
                                        {"-"}
                                        {Math.min(
                                            startIndex + lessonsPerPage,
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
                                                opacity:
                                                    currentPage === 1 ? 0.4 : 1,
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
                                        {Array.from(
                                            { length: totalPages },
                                            (_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() =>
                                                        setCurrentPage(i + 1)
                                                    }
                                                    style={{
                                                        padding: "6px 12px",
                                                        borderRadius: 6,
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        border: "none",
                                                        background:
                                                            currentPage ===
                                                            i + 1
                                                                ? "hsl(var(--foreground))"
                                                                : "transparent",
                                                        color:
                                                            currentPage ===
                                                            i + 1
                                                                ? "hsl(var(--card))"
                                                                : "hsl(var(--muted-foreground))",
                                                        minWidth: 36,
                                                    }}
                                                >
                                                    {i + 1}
                                                </button>
                                            ),
                                        )}
                                        <button
                                            onClick={() =>
                                                setCurrentPage((p) =>
                                                    Math.min(totalPages, p + 1),
                                                )
                                            }
                                            disabled={
                                                currentPage === totalPages
                                            }
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
                </>
            )}

            {/* Add Lesson Modal */}
            <Modal
                open={modal}
                onClose={() => setModal(false)}
                title="Запланувати урок"
                footer={
                    <>
                        <button
                            onClick={() => setModal(false)}
                            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-border transition-all"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={add}
                            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all"
                        >
                            Запланувати
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Тип уроку
                        </label>
                        <div className="flex gap-2">
                            {(["individual", "group"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() =>
                                        setForm({ ...form, type: t })
                                    }
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        borderRadius: 8,
                                        border:
                                            form.type === t
                                                ? "2px solid hsl(var(--foreground))"
                                                : "1.5px solid hsl(var(--border))",
                                        background:
                                            form.type === t
                                                ? "hsl(var(--mint-50))"
                                                : "hsl(var(--card))",
                                        color:
                                            form.type === t
                                                ? "hsl(var(--foreground))"
                                                : "hsl(var(--muted-foreground))",
                                        fontWeight: form.type === t ? 700 : 500,
                                        cursor: "pointer",
                                        fontSize: 14,
                                    }}
                                >
                                    {t === "individual"
                                        ? "👤 Індивідуальний"
                                        : "👥 Груповий"}
                                </button>
                            ))}
                        </div>
                    </div>
                    {form.type === "individual" ? (
                        <div>
                            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                                Учень
                            </label>
                            <select
                                className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                                value={form.studentId}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        studentId: e.target.value,
                                    })
                                }
                            >
                                {students.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} — {s.subject}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                                Група
                            </label>
                            <select
                                className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                                value={form.groupId}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        groupId: e.target.value,
                                    })
                                }
                            >
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.name} — {g.student_ids?.length || 0}{" "}
                                        учнів
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Дата
                        </label>
                        <CalendarPicker
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e })}
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Час початку
                        </label>
                        <input
                            type="time"
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                            value={form.time}
                            onChange={(e) =>
                                setForm({ ...form, time: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Нотатки
                        </label>
                        <input
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                            value={form.notes}
                            onChange={(e) =>
                                setForm({ ...form, notes: e.target.value })
                            }
                            placeholder="Тема, домашнє завдання тощо (необовʼязково)"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
