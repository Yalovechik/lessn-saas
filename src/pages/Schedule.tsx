import { useState, useMemo, useCallback } from "react";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/hooks/useAuth";
import { Modal } from "@/components/lessn/Modal";
import { formatDate, formatTime, todayStr } from "@/utils/helpers";
import { STATUS_LABELS } from "@/constants";

const TIME_SLOTS = [
    "8:00",
    "9:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
];
const SLOT_HOURS = [8, 9, 10, 11, 13, 14, 15, 16];
const DAYS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "НД"];

// ─── Types ───────────────────────────────────────────────────────────────────

type LessonType = "scheduled" | "completed" | "cancelled" | "rescheduled";
type ViewMode = "grid" | "list";
type ListFilter = "all" | LessonType;
type DateRangeFilter = "all" | "today" | "week" | "month" | "custom";

interface GridLesson {
    id: string;
    studentName: string;
    isGroup: boolean;
    day: number;
    timeSlot: number;
    status: LessonType;
    duration: number;
    notes: string | null;
    isToday: boolean;
}

// ─── Lesson Card (draggable) ──────────────────────────────────────────────────

function LessonCard({
    lesson,
    isDragging = false,
    isBeingDragged = false,
    onComplete,
    onCancel,
    onRemove,
    onEdit,
}: {
    lesson: GridLesson;
    isDragging?: boolean;
    isBeingDragged?: boolean;
    onComplete?: () => void;
    onCancel?: () => void;
    onRemove?: () => void;
    onEdit?: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: lesson.id,
    });
    const style = { transform: CSS.Translate.toString(transform) };

    const bg =
        lesson.status === "completed"
            ? "#10B981"
            : lesson.status === "cancelled"
              ? "hsl(var(--coral-light))"
              : lesson.isToday
                ? "hsl(var(--mint-dark) / 0.85)"
                : "hsl(var(--foreground))";
    const color =
        lesson.status === "cancelled" ? "hsl(var(--coral-dark))" : "#fff";

    return (
        <div
            style={{ position: "relative", height: "100%" }}
            className="group/card"
        >
            <div
                ref={setNodeRef}
                style={{
                    ...style,
                    background: bg,
                    color,
                    padding: "14px 16px",
                    borderRadius: 6,
                    cursor: isDragging ? "grabbing" : "grab",
                    boxShadow: isDragging
                        ? "0 8px 24px rgba(0,0,0,0.18)"
                        : "0 1px 2px rgba(15,23,42,.06)",
                    opacity: isBeingDragged ? 0.5 : isDragging ? 1 : 1,
                    userSelect: "none",
                    minHeight: 72,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    transition: isDragging ? "none" : "all 0.15s",
                    boxSizing: "border-box",
                }}
                {...listeners}
                {...attributes}
                onClick={(e) => {
                    if (!isDragging && onEdit) {
                        e.stopPropagation();
                        onEdit();
                    }
                }}
            >
                <p
                    style={{
                        fontSize: 15,
                        fontWeight: 700,
                        lineHeight: 1.3,
                        marginBottom: 2,
                    }}
                >
                    {lesson.studentName}
                </p>
                {lesson.isGroup && (
                    <p
                        style={{
                            fontSize: 10,
                            opacity: 0.65,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 2,
                        }}
                    >
                        Група
                    </p>
                )}
                <p
                    style={{
                        fontSize: 12,
                        opacity: 0.8,
                        marginBottom: lesson.notes ? 8 : 0,
                    }}
                >
                    {lesson.duration} хв
                </p>
                {lesson.notes && (
                    <p
                        style={{
                            fontSize: 11,
                            opacity: 0.85,
                            marginTop: 6,
                            paddingTop: 6,
                            borderTop: `1px solid ${lesson.status === "cancelled" ? "hsl(var(--coral))" : "rgba(255,255,255,0.25)"}`,
                            lineHeight: 1.4,
                            wordBreak: "break-word",
                        }}
                    >
                        {lesson.notes}
                    </p>
                )}
            </div>
            {/* Action buttons */}
            <div
                style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    display: "flex",
                    gap: 3,
                }}
                className="opacity-0 group-hover/card:opacity-100 transition-opacity"
            >
                {lesson.status === "scheduled" && onComplete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onComplete();
                        }}
                        style={actionBtnStyle("#10B981")}
                        title="Готово"
                    >
                        <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </button>
                )}
                {lesson.status === "scheduled" && onCancel && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancel();
                        }}
                        style={actionBtnStyle("#FB7185")}
                        title="Скасувати"
                    >
                        <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
                {onRemove && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        style={actionBtnStyle("#64748B")}
                        title="Видалити"
                    >
                        <svg
                            width="10"
                            height="10"
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
                )}
            </div>
        </div>
    );
}

function actionBtnStyle(bg: string): React.CSSProperties {
    return {
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: bg,
        border: "2px solid #fff",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        padding: 0,
    };
}

// ─── Schedule Cell (droppable) ────────────────────────────────────────────────

function ScheduleCell({
    id,
    lesson,
    isEven,
    isToday,
    isDraggingAny,
    activeId,
    isLastDay = false,
    rowSpan = 1,
    gridColumn,
    gridRow,
    borderTop,
    lessonHeight,
    onClick,
    onComplete,
    onCancel,
    onRemove,
    onEdit,
}: {
    id: string;
    lesson?: GridLesson;
    isEven: boolean;
    isToday: boolean;
    isDraggingAny: boolean;
    activeId: string | null;
    isLastDay?: boolean;
    rowSpan?: number;
    gridColumn?: number;
    gridRow?: number;
    borderTop?: string;
    lessonHeight?: number;
    onClick: () => void;
    onComplete?: () => void;
    onCancel?: () => void;
    onRemove?: () => void;
    onEdit?: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            style={{
                gridColumn,
                gridRow: rowSpan > 1 ? `${gridRow} / span ${rowSpan}` : gridRow,
                padding: 8,
                background: isOver
                    ? "hsl(var(--mint-50))"
                    : isToday
                      ? "hsl(var(--mint-50) / 0.4)"
                      : isEven
                        ? "hsl(var(--secondary) / 0.15)"
                        : "hsl(var(--card))",
                borderRight: isLastDay
                    ? "none"
                    : "1px solid hsl(var(--border))",
                borderTop: borderTop ?? "none",
                transition: "background 0.15s",
                cursor: lesson ? "default" : "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
            }}
            onClick={() => !lesson && !isDraggingAny && onClick()}
        >
            {lesson ? (
                <div
                    style={{
                        minHeight: lessonHeight,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <LessonCard
                        lesson={lesson}
                        isBeingDragged={lesson.id === activeId}
                        onComplete={onComplete}
                        onCancel={onCancel}
                        onRemove={onRemove}
                        onEdit={onEdit}
                    />
                </div>
            ) : (
                <div
                    style={{
                        height: "100%",
                        minHeight: 68,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "hsl(var(--border))",
                        fontSize: 22,
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = "hsl(var(--mint-dark))";
                        e.currentTarget.style.transform = "scale(1.2)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = "hsl(var(--border))";
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                >
                    +
                </div>
            )}
            {isOver && !lesson && (
                <div
                    style={{
                        position: "absolute",
                        inset: 6,
                        border: "2px dashed hsl(var(--mint-dark))",
                        borderRadius: 8,
                        background: "hsl(var(--mint-50))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "hsl(var(--mint-dark))",
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    Перемістити сюди
                </div>
            )}
        </div>
    );
}

// ─── Main Schedule Component ──────────────────────────────────────────────────

export default function Schedule() {
    const {
        students,
        groups,
        lessons,
        addLesson,
        addLessons,
        updateLesson,
        deleteLesson,
    } = useAppData();
    const { teacher } = useAuth();

    // View state
    const [currentWeek, setCurrentWeek] = useState(0);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [activeId, setActiveId] = useState<string | null>(null);

    // Filter state
    const [selectedStudentFilters, setSelectedStudentFilters] = useState<
        string[]
    >([]);
    const [showFilterSidebar, setShowFilterSidebar] = useState(false);
    const [showEmptySlots, setShowEmptySlots] = useState(true);
    const [listFilter, setListFilter] = useState<ListFilter>("all");
    const [dateRangeFilter, setDateRangeFilter] =
        useState<DateRangeFilter>("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);

    // Add/edit modal state
    const [modal, setModal] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
    const [selectedCell, setSelectedCell] = useState<{
        day: number;
        timeSlot: number;
    } | null>(null);
    const [formStudentId, setFormStudentId] = useState("");
    const [formNotes, setFormNotes] = useState("");
    const [formDuration, setFormDuration] = useState(60);
    const [formDate, setFormDate] = useState<string>("");
    const [showRecurring, setShowRecurring] = useState(false);
    const [recurringDays, setRecurringDays] = useState<number[]>([]);
    const [recurringEndDate, setRecurringEndDate] = useState("");

    // Confirm delete
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // ── Week helpers ──────────────────────────────────────────────────────────

    const getWeekMonday = useCallback(() => {
        const today = new Date();
        const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - currentDay + currentWeek * 7);
        return monday;
    }, [currentWeek]);

    const weekDates = useMemo(() => {
        const monday = getWeekMonday();
        return DAYS.map((_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }, [getWeekMonday]);

    const weekLabel = useMemo(() => {
        const monday = getWeekMonday();
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const fmt = (d: Date) =>
            `${d.getDate()} ${d.toLocaleString("uk", { month: "short" })}`;
        return `${fmt(monday)} – ${fmt(sunday)}`;
    }, [getWeekMonday]);

    // ── Grid lessons ──────────────────────────────────────────────────────────

    const scheduleLessons = useMemo<GridLesson[]>(() => {
        const monday = getWeekMonday();
        const weekDateStrs = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d.toISOString().split("T")[0];
        });

        return lessons
            .filter((l) => weekDateStrs.includes(l.date))
            .map((l) => {
                const dayOfWeek = weekDateStrs.indexOf(l.date);
                const hours = l.time ? parseInt(l.time.split(":")[0]) : 8;
                const timeSlot = Math.max(
                    0,
                    SLOT_HOURS.indexOf(hours) === -1
                        ? 0
                        : SLOT_HOURS.indexOf(hours),
                );
                const student = students.find((s) => s.id === l.student_id);
                const group = groups.find((g) => g.id === l.group_id);
                const displayName = l.is_group
                    ? group?.name || "Група"
                    : student?.name || "Невідомий";
                return {
                    id: l.id,
                    studentName: displayName,
                    isGroup: !!l.is_group,
                    day: dayOfWeek,
                    timeSlot,
                    status: l.status as LessonType,
                    duration: l.duration || 60,
                    notes: l.notes,
                    isToday: l.date === todayStr(),
                };
            });
    }, [lessons, students, groups, getWeekMonday]);

    const filteredScheduleLessons = useMemo(() => {
        if (selectedStudentFilters.length === 0) return scheduleLessons;
        return scheduleLessons.filter((sl) => {
            const raw = lessons.find((l) => l.id === sl.id);
            return (
                raw &&
                selectedStudentFilters.includes(
                    raw.student_id || raw.group_id || "",
                )
            );
        });
    }, [scheduleLessons, selectedStudentFilters, lessons]);

    // ── List lessons ──────────────────────────────────────────────────────────

    const allLessonsListView = useMemo(() => {
        let list = [...lessons];
        if (selectedStudentFilters.length > 0) {
            list = list.filter((l) =>
                selectedStudentFilters.includes(
                    l.student_id || l.group_id || "",
                ),
            );
        }
        if (listFilter !== "all")
            list = list.filter((l) => l.status === listFilter);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateRangeFilter === "today") {
            const ts = todayStr();
            list = list.filter((l) => l.date === ts);
        } else if (dateRangeFilter === "week") {
            const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
            const ws = new Date(today);
            ws.setDate(today.getDate() - dow);
            const we = new Date(ws);
            we.setDate(ws.getDate() + 6);
            list = list.filter((l) => {
                const d = new Date(l.date);
                return d >= ws && d <= we;
            });
        } else if (dateRangeFilter === "month") {
            const ms = new Date(today.getFullYear(), today.getMonth(), 1);
            const me = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            list = list.filter((l) => {
                const d = new Date(l.date);
                return d >= ms && d <= me;
            });
        } else if (
            dateRangeFilter === "custom" &&
            customStartDate &&
            customEndDate
        ) {
            const s = new Date(customStartDate),
                e = new Date(customEndDate);
            list = list.filter((l) => {
                const d = new Date(l.date);
                return d >= s && d <= e;
            });
        }

        return list.sort(
            (a, b) =>
                b.date.localeCompare(a.date) ||
                (b.time || "").localeCompare(a.time || ""),
        );
    }, [
        lessons,
        selectedStudentFilters,
        listFilter,
        dateRangeFilter,
        customStartDate,
        customEndDate,
    ]);

    // ── DnD ───────────────────────────────────────────────────────────────────

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    const handleDragStart = (e: DragStartEvent) =>
        setActiveId(e.active.id as string);

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        setActiveId(null);
        if (!over) return;
        const overId = over.id as string;
        if (!overId.startsWith("cell-")) return;
        const [, dayStr, slotStr] = overId.split("-");
        const newDay = parseInt(dayStr),
            newSlot = parseInt(slotStr);
        const monday = getWeekMonday();
        const newDate = new Date(monday);
        newDate.setDate(monday.getDate() + newDay);
        const newDateStr = newDate.toISOString().split("T")[0];
        const newTime = `${String(SLOT_HOURS[newSlot] ?? 8).padStart(2, "0")}:00`;
        updateLesson.mutate({
            id: active.id as string,
            date: newDateStr,
            time: newTime,
        });
    };

    // ── Cell click / modal ────────────────────────────────────────────────────

    const handleCellClick = (day: number, timeSlot: number) => {
        const date = weekDates[day].toISOString().split("T")[0];
        setEditingLessonId(null);
        setSelectedCell({ day, timeSlot });
        setFormDate(date);
        setFormStudentId(students[0]?.id || "");
        setFormNotes("");
        setFormDuration(60);
        setShowRecurring(false);
        setRecurringDays([]);
        setRecurringEndDate("");
        setModal(true);
    };

    const handleLessonClick = (lessonId: string) => {
        const raw = lessons.find((l) => l.id === lessonId);
        if (!raw) return;
        setEditingLessonId(lessonId);
        setFormDate(raw.date);
        setFormStudentId(raw.student_id || raw.group_id || "");
        setFormNotes(raw.notes || "");
        setFormDuration(raw.duration || 60);
        setShowRecurring(false);
        setRecurringDays([]);
        setRecurringEndDate("");
        // derive selectedCell for time display
        const hours = raw.time ? parseInt(raw.time.split(":")[0]) : 8;
        const timeSlot = Math.max(
            0,
            SLOT_HOURS.indexOf(hours) === -1 ? 0 : SLOT_HOURS.indexOf(hours),
        );
        const monday = getWeekMonday();
        const weekDateStrs = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d.toISOString().split("T")[0];
        });
        const day = weekDateStrs.indexOf(raw.date);
        setSelectedCell(day >= 0 ? { day, timeSlot } : null);
        setModal(true);
    };

    const handleAddLesson = async () => {
        if (!teacher) return;

        if (editingLessonId) {
            // Edit mode
            updateLesson.mutate({
                id: editingLessonId,
                date: formDate,
                time: selectedCell
                    ? `${String(SLOT_HOURS[selectedCell.timeSlot] ?? 8).padStart(2, "0")}:00`
                    : undefined,
                duration: formDuration,
                notes: formNotes,
            });
            setModal(false);
            setEditingLessonId(null);
            return;
        }

        if (!selectedCell || !formStudentId) return;
        const time = `${String(SLOT_HOURS[selectedCell.timeSlot] ?? 8).padStart(2, "0")}:00`;

        if (showRecurring && recurringDays.length > 0 && recurringEndDate) {
            const newLessons = [];
            const cur = new Date(formDate);
            const end = new Date(recurringEndDate);
            while (cur <= end) {
                const dow = cur.getDay() === 0 ? 6 : cur.getDay() - 1;
                if (recurringDays.includes(dow)) {
                    newLessons.push({
                        student_id: formStudentId,
                        group_id: null,
                        is_group: false,
                        date: cur.toISOString().split("T")[0],
                        time,
                        duration: formDuration,
                        notes: formNotes,
                        status: "scheduled" as const,
                        teacher_id: teacher.id,
                    });
                }
                cur.setDate(cur.getDate() + 1);
            }
            if (newLessons.length > 0) await addLessons.mutateAsync(newLessons);
        } else {
            await addLesson.mutateAsync({
                student_id: formStudentId,
                group_id: null,
                is_group: false,
                date: formDate,
                time,
                duration: formDuration,
                notes: formNotes,
                status: "scheduled",
                teacher_id: teacher.id,
            });
        }
        setModal(false);
    };

    const toggleRecurringDay = (d: number) =>
        setRecurringDays((prev) =>
            prev.includes(d)
                ? prev.filter((x) => x !== d)
                : [...prev, d].sort(),
        );

    const toggleStudentFilter = (id: string) =>
        setSelectedStudentFilters((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    // ── Misc ──────────────────────────────────────────────────────────────────

    const todayDate = new Date();
    const currentDayIndex =
        todayDate.getDay() === 0 ? 6 : todayDate.getDay() - 1;
    const isCurrentWeek = currentWeek === 0;
    const activeLesson = scheduleLessons.find((l) => l.id === activeId);

    const hasLessonsInSlot = (slotIndex: number) =>
        filteredScheduleLessons.some((l) => l.timeSlot === slotIndex);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div style={{ position: "relative", zIndex: 10 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: viewMode === "list" ? 16 : 0,
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
                            Розклад
                        </h1>
                        <p
                            style={{
                                fontSize: 14,
                                color: "hsl(var(--muted-foreground))",
                                marginTop: 4,
                            }}
                        >
                            {viewMode === "grid"
                                ? "Інтерактивний тижневий розклад занять"
                                : `${allLessonsListView.length} уроків загалом`}
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        {/* View toggle */}
                        <div
                            style={{
                                display: "flex",
                                background: "hsl(var(--card))",
                                borderRadius: 8,
                                border: "1px solid hsl(var(--border))",
                                padding: 2,
                            }}
                        >
                            {(["grid", "list"] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setViewMode(m)}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: 6,
                                        border: "none",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        background:
                                            viewMode === m
                                                ? "hsl(var(--foreground))"
                                                : "transparent",
                                        color:
                                            viewMode === m
                                                ? "hsl(var(--card))"
                                                : "hsl(var(--muted-foreground))",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                    }}
                                >
                                    {m === "grid" ? (
                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect
                                                x="3"
                                                y="3"
                                                width="7"
                                                height="7"
                                            />
                                            <rect
                                                x="14"
                                                y="3"
                                                width="7"
                                                height="7"
                                            />
                                            <rect
                                                x="14"
                                                y="14"
                                                width="7"
                                                height="7"
                                            />
                                            <rect
                                                x="3"
                                                y="14"
                                                width="7"
                                                height="7"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <line
                                                x1="8"
                                                y1="6"
                                                x2="21"
                                                y2="6"
                                            />
                                            <line
                                                x1="8"
                                                y1="12"
                                                x2="21"
                                                y2="12"
                                            />
                                            <line
                                                x1="8"
                                                y1="18"
                                                x2="21"
                                                y2="18"
                                            />
                                            <line
                                                x1="3"
                                                y1="6"
                                                x2="3.01"
                                                y2="6"
                                            />
                                            <line
                                                x1="3"
                                                y1="12"
                                                x2="3.01"
                                                y2="12"
                                            />
                                            <line
                                                x1="3"
                                                y1="18"
                                                x2="3.01"
                                                y2="18"
                                            />
                                        </svg>
                                    )}
                                    {m === "grid" ? "Сітка" : "Список"}
                                </button>
                            ))}
                        </div>

                        {/* Week nav (grid only) */}
                        {viewMode === "grid" && (
                            <>
                                <button
                                    onClick={() => setCurrentWeek((w) => w - 1)}
                                    style={{
                                        padding: "8px 12px",
                                        background: "transparent",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        color: "hsl(var(--muted-foreground))",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </button>
                                <div
                                    style={{
                                        padding: "8px 14px",
                                        background: "hsl(var(--card))",
                                        borderRadius: 8,
                                        border: "1px solid hsl(var(--border))",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "hsl(var(--foreground))",
                                    }}
                                >
                                    {weekLabel}
                                </div>
                                <button
                                    onClick={() => setCurrentWeek((w) => w + 1)}
                                    style={{
                                        padding: "8px 12px",
                                        background: "transparent",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        color: "hsl(var(--muted-foreground))",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
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
                            </>
                        )}

                        {/* Filter toggle */}
                        <button
                            onClick={() => setShowFilterSidebar((v) => !v)}
                            style={{
                                padding: "8px 12px",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: 8,
                                cursor: "pointer",
                                transition: "all 0.15s",
                                background: showFilterSidebar
                                    ? "hsl(var(--mint-50))"
                                    : "transparent",
                                color: showFilterSidebar
                                    ? "hsl(var(--mint-dark))"
                                    : "hsl(var(--muted-foreground))",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                            title="Фільтри"
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            {selectedStudentFilters.length > 0 && (
                                <span
                                    style={{
                                        background: "hsl(var(--mint-dark))",
                                        color: "#fff",
                                        borderRadius: "50%",
                                        width: 18,
                                        height: 18,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}
                                >
                                    {selectedStudentFilters.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* List view filters row */}
                {viewMode === "list" && (
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            position: "relative",
                            zIndex: 100,
                        }}
                    >
                        {/* Student dropdown */}
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() =>
                                    setShowStudentDropdown((v) => !v)
                                }
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: 8,
                                    border: `1px solid ${selectedStudentFilters.length > 0 ? "hsl(var(--mint-dark))" : "hsl(var(--border))"}`,
                                    background:
                                        selectedStudentFilters.length > 0
                                            ? "hsl(var(--mint-dark))"
                                            : "hsl(var(--card))",
                                    color:
                                        selectedStudentFilters.length > 0
                                            ? "#fff"
                                            : "hsl(var(--muted-foreground))",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                {selectedStudentFilters.length === 0
                                    ? "Всі учні"
                                    : `${selectedStudentFilters.length} учнів`}
                                <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        transform: showStudentDropdown
                                            ? "rotate(180deg)"
                                            : "none",
                                        transition: "transform 0.2s",
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {showStudentDropdown && (
                                <>
                                    <div
                                        style={{
                                            position: "fixed",
                                            inset: 0,
                                            zIndex: 1998,
                                        }}
                                        onClick={() =>
                                            setShowStudentDropdown(false)
                                        }
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 4px)",
                                            left: 0,
                                            background: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: 8,
                                            boxShadow:
                                                "0 8px 24px rgba(0,0,0,0.15)",
                                            minWidth: 220,
                                            maxHeight: 300,
                                            overflow: "auto",
                                            zIndex: 1999,
                                            padding: 8,
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {selectedStudentFilters.length > 0 && (
                                            <button
                                                onClick={() =>
                                                    setSelectedStudentFilters(
                                                        [],
                                                    )
                                                }
                                                style={{
                                                    width: "100%",
                                                    padding: "7px 10px",
                                                    background:
                                                        "hsl(var(--secondary))",
                                                    border: "none",
                                                    borderRadius: 6,
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: "hsl(var(--mint-dark))",
                                                    cursor: "pointer",
                                                    marginBottom: 6,
                                                    textAlign: "left",
                                                }}
                                            >
                                                ✕ Скинути фільтр
                                            </button>
                                        )}
                                        {students.map((s) => {
                                            const sel =
                                                selectedStudentFilters.includes(
                                                    s.id,
                                                );
                                            return (
                                                <label
                                                    key={s.id}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                        padding: "7px 10px",
                                                        borderRadius: 6,
                                                        cursor: "pointer",
                                                        background: sel
                                                            ? "hsl(var(--mint-50))"
                                                            : "transparent",
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={sel}
                                                        onChange={() =>
                                                            toggleStudentFilter(
                                                                s.id,
                                                            )
                                                        }
                                                        style={{
                                                            width: 15,
                                                            height: 15,
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            width: 26,
                                                            height: 26,
                                                            borderRadius: "50%",
                                                            background:
                                                                "hsl(var(--mint-50))",
                                                            color: "hsl(var(--mint-dark))",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {s.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                    <span
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight: 500,
                                                            color: "hsl(var(--foreground))",
                                                        }}
                                                    >
                                                        {s.name}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Status filter */}
                        <div
                            style={{
                                display: "flex",
                                background: "hsl(var(--card))",
                                borderRadius: 8,
                                border: "1px solid hsl(var(--border))",
                                padding: 2,
                                gap: 2,
                            }}
                        >
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
                                    onClick={() => setListFilter(f)}
                                    style={{
                                        padding: "5px 10px",
                                        borderRadius: 6,
                                        border: "none",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        whiteSpace: "nowrap",
                                        background:
                                            listFilter === f
                                                ? "hsl(var(--foreground))"
                                                : "transparent",
                                        color:
                                            listFilter === f
                                                ? "hsl(var(--card))"
                                                : "hsl(var(--muted-foreground))",
                                    }}
                                >
                                    {f === "all" ? "Усі" : STATUS_LABELS[f]}
                                </button>
                            ))}
                        </div>

                        {/* Date range filter */}
                        <div
                            style={{
                                display: "flex",
                                background: "hsl(var(--card))",
                                borderRadius: 8,
                                border: "1px solid hsl(var(--border))",
                                padding: 2,
                                gap: 2,
                            }}
                        >
                            {(
                                [
                                    "all",
                                    "today",
                                    "week",
                                    "month",
                                    "custom",
                                ] as const
                            ).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => {
                                        setDateRangeFilter(r);
                                        if (r !== "custom") {
                                            setCustomStartDate("");
                                            setCustomEndDate("");
                                        }
                                    }}
                                    style={{
                                        padding: "5px 10px",
                                        borderRadius: 6,
                                        border: "none",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        whiteSpace: "nowrap",
                                        background:
                                            dateRangeFilter === r
                                                ? "hsl(var(--mint-dark))"
                                                : "transparent",
                                        color:
                                            dateRangeFilter === r
                                                ? "#fff"
                                                : "hsl(var(--muted-foreground))",
                                    }}
                                >
                                    {r === "all"
                                        ? "Весь час"
                                        : r === "today"
                                          ? "Сьогодні"
                                          : r === "week"
                                            ? "Цей тиждень"
                                            : r === "month"
                                              ? "Цей місяць"
                                              : "Період"}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Filter Sidebar ── */}
            {showFilterSidebar && viewMode === "grid" && (
                <div
                    style={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        padding: 20,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16,
                        }}
                    >
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "hsl(var(--foreground))",
                            }}
                        >
                            Фільтри
                        </h3>
                        {selectedStudentFilters.length > 0 && (
                            <button
                                onClick={() => setSelectedStudentFilters([])}
                                style={{
                                    fontSize: 12,
                                    color: "hsl(var(--mint-dark))",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                }}
                            >
                                Скинути
                            </button>
                        )}
                    </div>
                    <p
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "hsl(var(--muted-foreground))",
                            marginBottom: 10,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}
                    >
                        Учні
                    </p>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                        }}
                    >
                        {students.map((s) => {
                            const sel = selectedStudentFilters.includes(s.id);
                            return (
                                <label
                                    key={s.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "6px 8px",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        background: sel
                                            ? "hsl(var(--mint-50))"
                                            : "transparent",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={sel}
                                        onChange={() =>
                                            toggleStudentFilter(s.id)
                                        }
                                    />
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: "hsl(var(--foreground))",
                                        }}
                                    >
                                        {s.name}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                    <div
                        style={{
                            marginTop: 16,
                            paddingTop: 16,
                            borderTop: "1px solid hsl(var(--border))",
                        }}
                    >
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                cursor: "pointer",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={showEmptySlots}
                                onChange={(e) =>
                                    setShowEmptySlots(e.target.checked)
                                }
                            />
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "hsl(var(--foreground))",
                                }}
                            >
                                Показувати порожні слоти
                            </span>
                        </label>
                    </div>
                </div>
            )}

            {/* ── Grid View ── */}
            {viewMode === "grid" && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => setActiveId(null)}
                >
                    <div
                        style={{
                            background: "hsl(var(--card))",
                            borderRadius: 12,
                            border: "1px solid hsl(var(--border))",
                            overflowX: "auto",
                            boxShadow: "0 1px 3px rgba(15,23,42,.06)",
                        }}
                    >
                        {/* Day headers */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "120px repeat(7, 1fr)",
                                borderBottom: "1px solid hsl(var(--border))",
                                minWidth: 700,
                            }}
                        >
                            <div
                                style={{
                                    padding: "12px 16px",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "hsl(var(--muted-foreground))",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    borderRight: "1px solid hsl(var(--border))",
                                }}
                            >
                                ЧАС
                            </div>
                            {DAYS.map((day, index) => {
                                const isToday =
                                    isCurrentWeek && index === currentDayIndex;
                                return (
                                    <div
                                        key={day}
                                        style={{
                                            padding: "12px 16px",
                                            textAlign: "center",
                                            borderRight:
                                                index < 6
                                                    ? "1px solid hsl(var(--border))"
                                                    : "none",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: "hsl(var(--muted-foreground))",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                marginBottom: 4,
                                            }}
                                        >
                                            {day}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 20,
                                                fontWeight: 700,
                                                color: isToday
                                                    ? "#fff"
                                                    : "hsl(var(--foreground))",
                                                background: isToday
                                                    ? "hsl(var(--mint-dark))"
                                                    : "transparent",
                                                width: 32,
                                                height: 32,
                                                borderRadius: 8,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                margin: "0 auto",
                                            }}
                                        >
                                            {weekDates[index].getDate()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Time rows — flat CSS grid so lessons can span rows */}
                        {(() => {
                            const ROW_H = 120; // px per 60-min slot
                            const visibleSlots = TIME_SLOTS.map(
                                (_, i) => i,
                            ).filter(
                                (i) => showEmptySlots || hasLessonsInSlot(i),
                            );
                            if (visibleSlots.length === 0) return null;

                            // Map visible slot index → grid row (1-based)
                            const slotToRow: Record<number, number> = {};
                            visibleSlots.forEach((slotIdx, pos) => {
                                slotToRow[slotIdx] = pos + 1;
                            });
                            const totalRows = visibleSlots.length;

                            // Track which (day, slot) cells are covered by a spanning lesson
                            const covered = new Set<string>();
                            filteredScheduleLessons.forEach((l) => {
                                const slotsSpanned = Math.ceil(l.duration / 60);
                                for (let s = 1; s < slotsSpanned; s++) {
                                    covered.add(`${l.day}-${l.timeSlot + s}`);
                                }
                            });

                            return (
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "120px repeat(7, 1fr)",
                                        gridTemplateRows: `repeat(${totalRows}, minmax(${ROW_H}px, auto))`,
                                        minWidth: 700,
                                    }}
                                >
                                    {visibleSlots.map((timeIndex, pos) => {
                                        const gridRow = pos + 1;
                                        const isEven = timeIndex % 2 === 0;
                                        const borderTop =
                                            pos > 0
                                                ? "1px solid hsl(var(--border))"
                                                : "none";

                                        return [
                                            // Time label cell
                                            <div
                                                key={`time-${timeIndex}`}
                                                style={{
                                                    gridColumn: 1,
                                                    gridRow,
                                                    padding: 16,
                                                    background: isEven
                                                        ? "hsl(var(--mint-50))"
                                                        : "hsl(var(--card))",
                                                    borderRight:
                                                        "1px solid hsl(var(--border))",
                                                    borderTop,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        color: "hsl(var(--foreground))",
                                                        background:
                                                            "hsl(var(--card))",
                                                        padding: "8px 12px",
                                                        borderRadius: 6,
                                                        border: "1px solid hsl(var(--border))",
                                                    }}
                                                >
                                                    {TIME_SLOTS[timeIndex]}
                                                </div>
                                            </div>,

                                            // Day cells
                                            ...DAYS.map((_, dayIndex) => {
                                                const cellKey = `${dayIndex}-${timeIndex}`;
                                                const isCovered =
                                                    covered.has(cellKey);
                                                const lesson =
                                                    filteredScheduleLessons.find(
                                                        (l) =>
                                                            l.day ===
                                                                dayIndex &&
                                                            l.timeSlot ===
                                                                timeIndex,
                                                    );
                                                const isToday =
                                                    isCurrentWeek &&
                                                    dayIndex ===
                                                        currentDayIndex;

                                                // How many visible rows does this lesson span?
                                                let rowSpan = 1;
                                                let lessonHeight:
                                                    | number
                                                    | undefined;
                                                if (lesson) {
                                                    const slotsNeeded =
                                                        Math.ceil(
                                                            lesson.duration /
                                                                60,
                                                        );
                                                    // Count how many of the needed slots are visible
                                                    rowSpan = 0;
                                                    for (
                                                        let s = 0;
                                                        s < slotsNeeded;
                                                        s++
                                                    ) {
                                                        if (
                                                            slotToRow[
                                                                timeIndex + s
                                                            ] !== undefined
                                                        )
                                                            rowSpan++;
                                                    }
                                                    rowSpan = Math.max(
                                                        1,
                                                        rowSpan,
                                                    );
                                                    // Exact pixel height based on actual duration
                                                    lessonHeight = Math.round(
                                                        (lesson.duration / 60) *
                                                            ROW_H -
                                                            16,
                                                    );
                                                }

                                                // Skip cells covered by a spanning lesson above
                                                if (isCovered) return null;

                                                return (
                                                    <ScheduleCell
                                                        key={cellKey}
                                                        id={`cell-${dayIndex}-${timeIndex}`}
                                                        lesson={lesson}
                                                        isEven={isEven}
                                                        isToday={isToday}
                                                        isDraggingAny={
                                                            !!activeId
                                                        }
                                                        activeId={activeId}
                                                        isLastDay={
                                                            dayIndex === 6
                                                        }
                                                        rowSpan={rowSpan}
                                                        gridColumn={
                                                            dayIndex + 2
                                                        }
                                                        gridRow={gridRow}
                                                        lessonHeight={
                                                            lessonHeight
                                                        }
                                                        borderTop={borderTop}
                                                        onClick={() =>
                                                            handleCellClick(
                                                                dayIndex,
                                                                timeIndex,
                                                            )
                                                        }
                                                        onComplete={
                                                            lesson
                                                                ? () =>
                                                                      updateLesson.mutate(
                                                                          {
                                                                              id: lesson.id,
                                                                              status: "completed",
                                                                          },
                                                                      )
                                                                : undefined
                                                        }
                                                        onCancel={
                                                            lesson
                                                                ? () =>
                                                                      updateLesson.mutate(
                                                                          {
                                                                              id: lesson.id,
                                                                              status: "cancelled",
                                                                          },
                                                                      )
                                                                : undefined
                                                        }
                                                        onRemove={
                                                            lesson
                                                                ? () =>
                                                                      setConfirmDeleteId(
                                                                          lesson.id,
                                                                      )
                                                                : undefined
                                                        }
                                                        onEdit={
                                                            lesson
                                                                ? () =>
                                                                      handleLessonClick(
                                                                          lesson.id,
                                                                      )
                                                                : undefined
                                                        }
                                                    />
                                                );
                                            }),
                                        ];
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                    <DragOverlay>
                        {activeLesson && (
                            <div style={{ transform: "rotate(3deg)" }}>
                                <LessonCard lesson={activeLesson} isDragging />
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            )}

            {/* ── List View ── */}
            {viewMode === "list" && (
                <div
                    style={{
                        background: "hsl(var(--card))",
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        boxShadow: "0 1px 3px rgba(15,23,42,.06)",
                    }}
                >
                    {dateRangeFilter === "custom" && (
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                padding: 16,
                                background: "hsl(var(--mint-50))",
                                borderBottom: "1px solid hsl(var(--border))",
                                alignItems: "flex-end",
                                flexWrap: "wrap",
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 140 }}>
                                <label
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "hsl(var(--foreground))",
                                        marginBottom: 6,
                                        display: "block",
                                    }}
                                >
                                    Від
                                </label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) =>
                                        setCustomStartDate(e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-md border border-border bg-card text-sm outline-none focus:border-foreground"
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: 140 }}>
                                <label
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "hsl(var(--foreground))",
                                        marginBottom: 6,
                                        display: "block",
                                    }}
                                >
                                    До
                                </label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    min={customStartDate}
                                    onChange={(e) =>
                                        setCustomEndDate(e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-md border border-border bg-card text-sm outline-none focus:border-foreground"
                                />
                            </div>
                            {customStartDate && customEndDate && (
                                <button
                                    onClick={() => {
                                        setCustomStartDate("");
                                        setCustomEndDate("");
                                        setDateRangeFilter("all");
                                    }}
                                    style={{
                                        padding: "8px 12px",
                                        background: "none",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        color: "hsl(var(--muted-foreground))",
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    )}

                    {allLessonsListView.length === 0 ? (
                        <div
                            style={{
                                padding: "60px 20px",
                                textAlign: "center",
                                color: "hsl(var(--muted-foreground))",
                            }}
                        >
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                style={{
                                    margin: "0 auto 16px",
                                    display: "block",
                                }}
                            >
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                            </svg>
                            <p
                                style={{
                                    fontSize: 15,
                                    fontWeight: 600,
                                    marginBottom: 8,
                                }}
                            >
                                Уроків не знайдено
                            </p>
                            <p style={{ fontSize: 13 }}>
                                {selectedStudentFilters.length > 0 ||
                                listFilter !== "all"
                                    ? "Спробуйте змінити фільтри"
                                    : "Додайте перший урок у розкладі"}
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            borderBottom:
                                                "1px solid hsl(var(--border))",
                                            background:
                                                "hsl(var(--secondary) / 0.5)",
                                        }}
                                    >
                                        {[
                                            "Учень",
                                            "Дата",
                                            "Час",
                                            "Тривалість",
                                            "Статус",
                                            "Дії",
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                style={{
                                                    padding: "11px 14px",
                                                    textAlign: "left",
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: "hsl(var(--muted-foreground))",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.05em",
                                                }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {allLessonsListView.map((l) => {
                                        const student = students.find(
                                            (s) => s.id === l.student_id,
                                        );
                                        const group = groups.find(
                                            (g) => g.id === l.group_id,
                                        );
                                        const displayName = l.is_group
                                            ? group?.name || "Група"
                                            : student?.name || "Невідомий";
                                        const statusColors: Record<
                                            string,
                                            { bg: string; color: string }
                                        > = {
                                            scheduled: {
                                                bg: "rgba(26,35,68,0.07)",
                                                color: "hsl(var(--foreground))",
                                            },
                                            completed: {
                                                bg: "hsl(var(--mint-light))",
                                                color: "hsl(var(--foreground))",
                                            },
                                            cancelled: {
                                                bg: "hsl(var(--coral-light))",
                                                color: "hsl(var(--coral-dark))",
                                            },
                                            rescheduled: {
                                                bg: "hsl(var(--orange-light))",
                                                color: "hsl(var(--orange-dark))",
                                            },
                                        };
                                        const sc =
                                            statusColors[l.status] ||
                                            statusColors.scheduled;
                                        return (
                                            <tr
                                                key={l.id}
                                                style={{
                                                    borderBottom:
                                                        "1px solid hsl(var(--border) / 0.5)",
                                                    transition:
                                                        "background 0.15s",
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
                                                        padding: "11px 14px",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 28,
                                                                height: 28,
                                                                borderRadius:
                                                                    "50%",
                                                                background:
                                                                    "hsl(var(--mint-50))",
                                                                color: "hsl(var(--mint-dark))",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                fontSize: 12,
                                                                fontWeight: 700,
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {displayName
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p
                                                                style={{
                                                                    fontSize: 13,
                                                                    fontWeight: 600,
                                                                    color: "hsl(var(--foreground))",
                                                                }}
                                                            >
                                                                {displayName}
                                                            </p>
                                                            {l.is_group && (
                                                                <p
                                                                    style={{
                                                                        fontSize: 11,
                                                                        color: "hsl(var(--muted-foreground))",
                                                                    }}
                                                                >
                                                                    Група
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "11px 14px",
                                                        fontSize: 13,
                                                        color: "hsl(var(--foreground))",
                                                    }}
                                                >
                                                    {formatDate(l.date)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "11px 14px",
                                                        fontSize: 13,
                                                        color: "hsl(var(--foreground))",
                                                    }}
                                                >
                                                    {formatTime(l.time)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "11px 14px",
                                                        fontSize: 13,
                                                        color: "hsl(var(--muted-foreground))",
                                                    }}
                                                >
                                                    {l.duration} хв
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "11px 14px",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 5,
                                                            padding: "3px 10px",
                                                            borderRadius: 16,
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            background: sc.bg,
                                                            color: sc.color,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius:
                                                                    "50%",
                                                                background:
                                                                    sc.color,
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        {
                                                            STATUS_LABELS[
                                                                l.status as keyof typeof STATUS_LABELS
                                                            ]
                                                        }
                                                    </span>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "11px 14px",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: 6,
                                                        }}
                                                    >
                                                        {l.status ===
                                                            "scheduled" && (
                                                            <button
                                                                onClick={() =>
                                                                    updateLesson.mutate(
                                                                        {
                                                                            id: l.id,
                                                                            status: "completed",
                                                                        },
                                                                    )
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "4px 10px",
                                                                    background:
                                                                        "hsl(var(--mint-light))",
                                                                    color: "hsl(var(--foreground))",
                                                                    border: "none",
                                                                    borderRadius: 6,
                                                                    fontSize: 12,
                                                                    fontWeight: 600,
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                ✓
                                                            </button>
                                                        )}
                                                        {l.status ===
                                                            "scheduled" && (
                                                            <button
                                                                onClick={() =>
                                                                    updateLesson.mutate(
                                                                        {
                                                                            id: l.id,
                                                                            status: "cancelled",
                                                                        },
                                                                    )
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "4px 10px",
                                                                    background:
                                                                        "hsl(var(--coral-light))",
                                                                    color: "hsl(var(--coral-dark))",
                                                                    border: "none",
                                                                    borderRadius: 6,
                                                                    fontSize: 12,
                                                                    fontWeight: 600,
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                setConfirmDeleteId(
                                                                    l.id,
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "4px 10px",
                                                                background:
                                                                    "hsl(var(--secondary))",
                                                                color: "hsl(var(--muted-foreground))",
                                                                border: "none",
                                                                borderRadius: 6,
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            🗑
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Add Lesson Modal ── */}
            <Modal
                open={modal}
                onClose={() => {
                    setModal(false);
                    setEditingLessonId(null);
                }}
                title={editingLessonId ? "Редагувати заняття" : "Нове заняття"}
                footer={
                    <>
                        <button
                            onClick={() => {
                                setModal(false);
                                setEditingLessonId(null);
                            }}
                            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={handleAddLesson}
                            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all"
                        >
                            {editingLessonId ? "Зберегти" : "Додати"}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {selectedCell && (
                        <div className="bg-mint-50 rounded-md p-3 text-sm text-foreground">
                            {DAYS[selectedCell.day]},{" "}
                            {TIME_SLOTS[selectedCell.timeSlot]}
                        </div>
                    )}
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Дата
                        </label>
                        <input
                            type="date"
                            value={formDate}
                            onChange={(e) => setFormDate(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none focus:border-foreground"
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Учень
                        </label>
                        <select
                            value={formStudentId}
                            onChange={(e) => setFormStudentId(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                            disabled={!!editingLessonId}
                        >
                            {students.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} — {s.subject}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Тривалість
                        </label>
                        <select
                            value={formDuration}
                            onChange={(e) =>
                                setFormDuration(Number(e.target.value))
                            }
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                        >
                            <option value={30}>30 хв</option>
                            <option value={45}>45 хв</option>
                            <option value={60}>60 хв</option>
                            <option value={90}>90 хв</option>
                            <option value={120}>120 хв</option>
                            <option value={150}>150 хв</option>
                            <option value={180}>180 хв</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Нотатки
                        </label>
                        <input
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            placeholder="Необов'язково"
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none focus:border-foreground"
                        />
                    </div>
                    {!editingLessonId && (
                        <div>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    cursor: "pointer",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={showRecurring}
                                    onChange={(e) =>
                                        setShowRecurring(e.target.checked)
                                    }
                                />
                                <span className="text-[13px] font-semibold text-muted-foreground">
                                    Повторюваний урок
                                </span>
                            </label>
                        </div>
                    )}
                    {!editingLessonId && showRecurring && (
                        <div className="space-y-3 p-3 bg-mint-50 rounded-md">
                            <div>
                                <p className="text-[12px] font-semibold text-muted-foreground mb-2">
                                    Дні тижня
                                </p>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 6,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {DAYS.map((d, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() =>
                                                toggleRecurringDay(i)
                                            }
                                            style={{
                                                padding: "4px 10px",
                                                borderRadius: 6,
                                                border: "1px solid",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                transition: "all 0.15s",
                                                borderColor:
                                                    recurringDays.includes(i)
                                                        ? "hsl(var(--mint-dark))"
                                                        : "hsl(var(--border))",
                                                background:
                                                    recurringDays.includes(i)
                                                        ? "hsl(var(--mint-dark))"
                                                        : "transparent",
                                                color: recurringDays.includes(i)
                                                    ? "#fff"
                                                    : "hsl(var(--muted-foreground))",
                                            }}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-muted-foreground mb-1.5">
                                    Повторювати до
                                </label>
                                <input
                                    type="date"
                                    value={recurringEndDate}
                                    min={formDate}
                                    onChange={(e) =>
                                        setRecurringEndDate(e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-md border border-border bg-card text-sm outline-none focus:border-foreground"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* ── Confirm Delete Modal ── */}
            <Modal
                open={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Видалити урок?"
                footer={
                    <>
                        <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={() => {
                                if (confirmDeleteId) {
                                    deleteLesson.mutate(confirmDeleteId);
                                    setConfirmDeleteId(null);
                                }
                            }}
                            className="px-4 py-2 rounded-md bg-coral text-white text-sm font-semibold hover:opacity-80 transition-all"
                        >
                            Видалити
                        </button>
                    </>
                }
            >
                <p className="text-sm text-muted-foreground">
                    Цю дію не можна скасувати.
                </p>
            </Modal>
        </div>
    );
}
