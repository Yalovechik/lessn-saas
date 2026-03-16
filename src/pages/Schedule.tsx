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
import {
    CalendarPicker,
    CalendarRangePicker,
} from "@/components/ui/calendar-picker";

const DEFAULT_SLOT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];
const SLOT_HOURS = Array.from({ length: 24 }, (_, i) => i); // full 0–23 for mapping
const TIME_SLOTS = SLOT_HOURS.map((h) => `${h}:00`);
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
              ? "#F59E0B"
              : lesson.isToday
                ? "hsl(var(--mint-dark) / 0.85)"
                : "hsl(var(--foreground))";
    const color = "#fff";

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
                            borderTop: `1px solid rgba(255,255,255,0.25)`,
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
                {onComplete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onComplete();
                        }}
                        style={actionBtnStyle(
                            "#10B981",
                            lesson.status === "completed",
                            lesson.status !== "scheduled",
                        )}
                        title="Виконано"
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
                {onCancel && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancel();
                        }}
                        style={actionBtnStyle(
                            "#FB7185",
                            lesson.status === "cancelled",
                            lesson.status !== "scheduled",
                        )}
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
                        style={actionBtnStyle(
                            "#64748B",
                            false,
                            lesson.status !== "scheduled",
                        )}
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

function actionBtnStyle(
    bg: string,
    active = false,
    anyActive = false,
): React.CSSProperties {
    return {
        width: active ? 24 : 22,
        height: active ? 24 : 22,
        borderRadius: "50%",
        background: bg,
        border: active
            ? "2.5px solid #fff"
            : "2px solid rgba(255,255,255,0.45)",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: active
            ? "0 0 0 2px " + bg + ", 0 3px 10px rgba(0,0,0,0.28)"
            : "0 2px 8px rgba(0,0,0,0.18)",
        padding: 0,
        opacity: active ? 1 : anyActive ? 0.75 : 1,
        transition: "all 0.15s",
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
    const [studentSearch, setStudentSearch] = useState("");
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

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
    const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(
        null,
    );
    const [showCustomDuration, setShowCustomDuration] = useState(false);
    const [customDurationInput, setCustomDurationInput] = useState("");
    const [formIsGroup, setFormIsGroup] = useState(false);

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
        let result = scheduleLessons;
        if (selectedStudentFilters.length > 0) {
            result = result.filter((sl) => {
                const raw = lessons.find((l) => l.id === sl.id);
                return (
                    raw &&
                    selectedStudentFilters.includes(
                        raw.student_id || raw.group_id || "",
                    )
                );
            });
        }
        if (listFilter !== "all") {
            result = result.filter((sl) => {
                const raw = lessons.find((l) => l.id === sl.id);
                return raw && raw.status === listFilter;
            });
        }
        return result;
    }, [scheduleLessons, selectedStudentFilters, listFilter, lessons]);

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
        setFormIsGroup(false);
        setFormStudentId(students[0]?.id || "");
        setFormNotes("");
        setFormDuration(60);
        setShowRecurring(false);
        setRecurringDays([]);
        setRecurringEndDate("");
        setShowCustomDuration(false);
        setCustomDurationInput("");
        setModal(true);
    };

    const handleLessonClick = (lessonId: string) => {
        const raw = lessons.find((l) => l.id === lessonId);
        if (!raw) return;
        setEditingLessonId(lessonId);
        setFormDate(raw.date);
        setFormIsGroup(!!raw.is_group);
        setFormStudentId(raw.student_id || raw.group_id || "");
        setFormNotes(raw.notes || "");

        const dur = raw.duration || 60;
        setFormDuration(dur);
        const isCustom = ![30, 45, 60, 90].includes(dur);
        setShowCustomDuration(isCustom);
        setCustomDurationInput(isCustom ? String(dur) : "");
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
                        student_id: formIsGroup ? null : formStudentId,
                        group_id: formIsGroup ? formStudentId : null,
                        is_group: formIsGroup,
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
                student_id: formIsGroup ? null : formStudentId,
                group_id: formIsGroup ? formStudentId : null,
                is_group: formIsGroup,
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
                        marginBottom: 12,
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

                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        position: "relative",
                        zIndex: 100,
                        marginTop: 12,
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
                                        <div style={{ marginBottom: 8, position: "relative" }}>
                                            <input
                                                type="text"
                                                placeholder="Пошук учня..."
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                autoFocus
                                                style={{
                                                    width: "100%", padding: "6px 8px 6px 28px", borderRadius: 6,
                                                    border: "1px solid hsl(var(--border))", background: "hsl(var(--background))",
                                                    fontSize: 13, outline: "none", color: "hsl(var(--foreground))"
                                                }}
                                            />
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }}>
                                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                            </svg>
                                        </div>
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
                                        {students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map((s) => {
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
                        {viewMode === "grid" ? (
                            <div style={{ position: "relative" }}>
                                <button
                                    onClick={() => { setShowStatusDropdown((v) => !v); setShowStudentDropdown(false); setShowDateDropdown(false); }}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: 20,
                                        border: `1.5px solid ${listFilter !== "all" ? "hsl(var(--foreground))" : "hsl(var(--border))"}`,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        whiteSpace: "nowrap",
                                        background: listFilter !== "all" ? "hsl(var(--foreground))" : "hsl(var(--card))",
                                        color: listFilter !== "all" ? "hsl(var(--card))" : "hsl(var(--muted-foreground))",
                                        display: "flex", alignItems: "center", gap: 6,
                                    }}
                                >
                                    {listFilter === "all" ? "Статус" : STATUS_LABELS[listFilter]}
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                        style={{ transform: showStatusDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                {showStatusDropdown && (
                                    <>
                                        <div style={{ position: "fixed", inset: 0, zIndex: 1998 }} onClick={() => setShowStatusDropdown(false)} />
                                        <div style={{
                                            position: "absolute", top: "calc(100% + 6px)", left: 0,
                                            background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                                            borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                            zIndex: 1999, minWidth: 180, overflow: "hidden",
                                        }}>
                                            {(["all", "scheduled", "completed", "cancelled", "rescheduled"] as const).map((f) => (
                                                <button
                                                    key={f}
                                                    onClick={() => { setListFilter(f); setShowStatusDropdown(false); }}
                                                    style={{
                                                        width: "100%", padding: "11px 16px",
                                                        background: listFilter === f ? "hsl(var(--secondary))" : "none",
                                                        border: "none", textAlign: "left",
                                                        fontSize: 14,
                                                        fontWeight: listFilter === f ? 700 : 500,
                                                        color: listFilter === f ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    }}
                                                >
                                                    {f === "all" ? "Усі статуси" : STATUS_LABELS[f]}
                                                    {listFilter === f && (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 6,
                                    flexWrap: "wrap",
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
                                            padding: "6px 14px",
                                            borderRadius: 20,
                                            border: `1.5px solid ${listFilter === f ? "hsl(var(--foreground))" : "hsl(var(--border))"}`,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            transition: "all 0.15s",
                                            whiteSpace: "nowrap",
                                            background:
                                                listFilter === f
                                                    ? "hsl(var(--foreground))"
                                                    : "hsl(var(--card))",
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
                        )}

                        {/* Date range filter */}
                        {viewMode === "list" && (
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => setShowDateDropdown((v) => !v)}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: 20,
                                    border: `1.5px solid ${dateRangeFilter !== "all" ? "hsl(var(--foreground))" : "hsl(var(--border))"}`,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    background:
                                        dateRangeFilter !== "all"
                                            ? "hsl(var(--foreground))"
                                            : "hsl(var(--card))",
                                    color:
                                        dateRangeFilter !== "all"
                                            ? "hsl(var(--card))"
                                            : "hsl(var(--muted-foreground))",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    transition: "all 0.15s",
                                    whiteSpace: "nowrap",
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
                                    <rect
                                        x="3"
                                        y="4"
                                        width="18"
                                        height="18"
                                        rx="2"
                                        ry="2"
                                    />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                {dateRangeFilter === "all"
                                    ? "Весь час"
                                    : dateRangeFilter === "today"
                                      ? "Сьогодні"
                                      : dateRangeFilter === "week"
                                        ? "Цей тиждень"
                                        : dateRangeFilter === "month"
                                          ? "Цей місяць"
                                          : "Вказати період"}
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
                                        transform: showDateDropdown
                                            ? "rotate(180deg)"
                                            : "none",
                                        transition: "transform 0.2s",
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {showDateDropdown && (
                                <>
                                    <div
                                        style={{
                                            position: "fixed",
                                            inset: 0,
                                            zIndex: 1998,
                                        }}
                                        onClick={() =>
                                            setShowDateDropdown(false)
                                        }
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 6px)",
                                            left: 0,
                                            background: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: 12,
                                            boxShadow:
                                                "0 8px 24px rgba(0,0,0,0.12)",
                                            zIndex: 1999,
                                            minWidth: 180,
                                            overflow: "hidden",
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
                                                        setShowDateDropdown(
                                                            false,
                                                        );
                                                    }
                                                    // keep dropdown open for custom to show calendar
                                                }}
                                                style={{
                                                    width: "100%",
                                                    padding: "11px 16px",
                                                    background:
                                                        dateRangeFilter === r
                                                            ? "hsl(var(--secondary))"
                                                            : "none",
                                                    border: "none",
                                                    borderBottom:
                                                        r === "month"
                                                            ? "1px solid hsl(var(--border))"
                                                            : "none",
                                                    textAlign: "left",
                                                    fontSize: 14,
                                                    fontWeight:
                                                        dateRangeFilter === r
                                                            ? 700
                                                            : 500,
                                                    color:
                                                        dateRangeFilter === r
                                                            ? "hsl(var(--foreground))"
                                                            : "hsl(var(--muted-foreground))",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent:
                                                        "space-between",
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
                                                          : "Вказати період"}
                                                {dateRangeFilter === r &&
                                                    r !== "custom" && (
                                                        <svg
                                                            width="14"
                                                            height="14"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="3"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                {r === "custom" && (
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
                                                            transform:
                                                                dateRangeFilter ===
                                                                "custom"
                                                                    ? "rotate(90deg)"
                                                                    : "none",
                                                            transition:
                                                                "transform 0.2s",
                                                        }}
                                                    >
                                                        <polyline points="9 18 15 12 9 6" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                        {/* Inline calendar for custom range */}
                                        {dateRangeFilter === "custom" && (
                                            <CalendarRangePicker
                                                startDate={customStartDate}
                                                endDate={customEndDate}
                                                onSelect={(s, e) => {
                                                    setCustomStartDate(s);
                                                    setCustomEndDate(e);
                                                    if (s && e)
                                                        setShowDateDropdown(
                                                            false,
                                                        );
                                                }}
                                            />
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        )}
                    </div>
            </div>



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

                            // Always show 8–16 (incl. 12), plus any hour that has a lesson outside that range
                            // Also include all hours a lesson spans into (e.g. 90min at 17:00 needs 17 AND 18)
                            const lessonHours = new Set<number>();
                            filteredScheduleLessons.forEach((l) => {
                                const slotsNeeded = Math.ceil(l.duration / 60);
                                for (let s = 0; s < slotsNeeded; s++) {
                                    const h = l.timeSlot + s;
                                    if (h < 24) lessonHours.add(h);
                                }
                            });
                            const visibleHourSet = new Set([
                                ...DEFAULT_SLOT_HOURS,
                                ...[...lessonHours].filter(
                                    (h) => !DEFAULT_SLOT_HOURS.includes(h),
                                ),
                            ]);
                            const visibleSlots = Array.from(
                                visibleHourSet,
                            ).sort((a, b) => a - b);
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
                                        const isEven = pos % 2 === 0;
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
                                                                              status:
                                                                                  lesson.status ===
                                                                                  "completed"
                                                                                      ? "scheduled"
                                                                                      : "completed",
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
                                                                              status:
                                                                                  lesson.status ===
                                                                                  "cancelled"
                                                                                      ? "scheduled"
                                                                                      : "cancelled",
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
                    {dateRangeFilter === "custom" &&
                        customStartDate &&
                        customEndDate && (
                            <div
                                style={{
                                    padding: "10px 16px",
                                    background: "hsl(var(--mint-50))",
                                    borderBottom:
                                        "1px solid hsl(var(--border))",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    fontSize: 13,
                                    color: "hsl(var(--foreground))",
                                    fontWeight: 600,
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
                                    <rect
                                        x="3"
                                        y="4"
                                        width="18"
                                        height="18"
                                        rx="2"
                                        ry="2"
                                    />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                {customStartDate} — {customEndDate}
                                <button
                                    onClick={() => {
                                        setCustomStartDate("");
                                        setCustomEndDate("");
                                        setDateRangeFilter("all");
                                    }}
                                    style={{
                                        marginLeft: "auto",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "hsl(var(--muted-foreground))",
                                        fontSize: 14,
                                    }}
                                >
                                    ✕
                                </button>
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
                                                    {/* Desktop: inline buttons */}
                                                    <div
                                                        className="hidden sm:flex"
                                                        style={{ gap: 6 }}
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
                                                                        "6px 12px",
                                                                    minWidth: 36,
                                                                    minHeight: 36,
                                                                    background:
                                                                        "hsl(var(--mint-light))",
                                                                    color: "hsl(var(--foreground))",
                                                                    border: "none",
                                                                    borderRadius: 6,
                                                                    fontSize: 13,
                                                                    fontWeight: 600,
                                                                    cursor: "pointer",
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                }}
                                                                title="Виконано"
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
                                                                        "6px 12px",
                                                                    minWidth: 36,
                                                                    minHeight: 36,
                                                                    background:
                                                                        "hsl(var(--coral-light))",
                                                                    color: "hsl(var(--coral-dark))",
                                                                    border: "none",
                                                                    borderRadius: 6,
                                                                    fontSize: 13,
                                                                    fontWeight: 600,
                                                                    cursor: "pointer",
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                }}
                                                                title="Скасувати"
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
                                                                    "6px 12px",
                                                                minWidth: 36,
                                                                minHeight: 36,
                                                                background:
                                                                    "hsl(var(--secondary))",
                                                                color: "hsl(var(--muted-foreground))",
                                                                border: "none",
                                                                borderRadius: 6,
                                                                fontSize: 13,
                                                                fontWeight: 600,
                                                                cursor: "pointer",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                            title="Видалити"
                                                        >
                                                            🗑
                                                        </button>
                                                    </div>

                                                    {/* Mobile: ⋯ dropdown */}
                                                    <div
                                                        className="flex sm:hidden"
                                                        style={{
                                                            position:
                                                                "relative",
                                                        }}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenActionMenuId(
                                                                    openActionMenuId ===
                                                                        l.id
                                                                        ? null
                                                                        : l.id,
                                                                );
                                                            }}
                                                            style={{
                                                                width: 36,
                                                                height: 36,
                                                                borderRadius: 8,
                                                                border: "1px solid hsl(var(--border))",
                                                                background:
                                                                    "hsl(var(--card))",
                                                                color: "hsl(var(--muted-foreground))",
                                                                cursor: "pointer",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                fontSize: 18,
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            ⋯
                                                        </button>
                                                        {openActionMenuId ===
                                                            l.id && (
                                                            <>
                                                                <div
                                                                    style={{
                                                                        position:
                                                                            "fixed",
                                                                        inset: 0,
                                                                        zIndex: 998,
                                                                    }}
                                                                    onClick={() =>
                                                                        setOpenActionMenuId(
                                                                            null,
                                                                        )
                                                                    }
                                                                />
                                                                <div
                                                                    style={{
                                                                        position:
                                                                            "absolute",
                                                                        right: 0,
                                                                        top: "calc(100% + 4px)",
                                                                        background:
                                                                            "hsl(var(--card))",
                                                                        border: "1px solid hsl(var(--border))",
                                                                        borderRadius: 10,
                                                                        boxShadow:
                                                                            "0 8px 24px rgba(0,0,0,0.15)",
                                                                        zIndex: 999,
                                                                        minWidth: 160,
                                                                        overflow:
                                                                            "hidden",
                                                                    }}
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    {l.status ===
                                                                        "scheduled" && (
                                                                        <button
                                                                            onClick={() => {
                                                                                updateLesson.mutate(
                                                                                    {
                                                                                        id: l.id,
                                                                                        status: "completed",
                                                                                    },
                                                                                );
                                                                                setOpenActionMenuId(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                            style={{
                                                                                width: "100%",
                                                                                padding:
                                                                                    "12px 16px",
                                                                                background:
                                                                                    "none",
                                                                                border: "none",
                                                                                textAlign:
                                                                                    "left",
                                                                                fontSize: 14,
                                                                                fontWeight: 600,
                                                                                color: "hsl(var(--foreground))",
                                                                                cursor: "pointer",
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                gap: 10,
                                                                                borderBottom:
                                                                                    "1px solid hsl(var(--border) / 0.5)",
                                                                            }}
                                                                        >
                                                                            <span
                                                                                style={{
                                                                                    fontSize: 16,
                                                                                }}
                                                                            >
                                                                                ✓
                                                                            </span>{" "}
                                                                            Виконано
                                                                        </button>
                                                                    )}
                                                                    {l.status ===
                                                                        "scheduled" && (
                                                                        <button
                                                                            onClick={() => {
                                                                                updateLesson.mutate(
                                                                                    {
                                                                                        id: l.id,
                                                                                        status: "cancelled",
                                                                                    },
                                                                                );
                                                                                setOpenActionMenuId(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                            style={{
                                                                                width: "100%",
                                                                                padding:
                                                                                    "12px 16px",
                                                                                background:
                                                                                    "none",
                                                                                border: "none",
                                                                                textAlign:
                                                                                    "left",
                                                                                fontSize: 14,
                                                                                fontWeight: 600,
                                                                                color: "hsl(var(--coral-dark))",
                                                                                cursor: "pointer",
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                gap: 10,
                                                                                borderBottom:
                                                                                    "1px solid hsl(var(--border) / 0.5)",
                                                                            }}
                                                                        >
                                                                            <span
                                                                                style={{
                                                                                    fontSize: 16,
                                                                                }}
                                                                            >
                                                                                ✕
                                                                            </span>{" "}
                                                                            Скасувати
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => {
                                                                            setConfirmDeleteId(
                                                                                l.id,
                                                                            );
                                                                            setOpenActionMenuId(
                                                                                null,
                                                                            );
                                                                        }}
                                                                        style={{
                                                                            width: "100%",
                                                                            padding:
                                                                                "12px 16px",
                                                                            background:
                                                                                "none",
                                                                            border: "none",
                                                                            textAlign:
                                                                                "left",
                                                                            fontSize: 14,
                                                                            fontWeight: 600,
                                                                            color: "hsl(var(--muted-foreground))",
                                                                            cursor: "pointer",
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: 10,
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                fontSize: 16,
                                                                            }}
                                                                        >
                                                                            🗑
                                                                        </span>{" "}
                                                                        Видалити
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
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
                    setShowCustomDuration(false);
                    setCustomDurationInput("");
                }}
                title={editingLessonId ? "Редагувати урок" : "Новий урок"}
                footer={
                    <>
                        <button
                            onClick={() => {
                                setModal(false);
                                setEditingLessonId(null);
                                setShowCustomDuration(false);
                                setCustomDurationInput("");
                            }}
                            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={handleAddLesson}
                            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-mint-dark transition-all flex items-center gap-1.5"
                        >
                            <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {editingLessonId ? "Зберегти" : "Додати"}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Date + time header */}
                    {selectedCell && (
                        <div
                            style={{
                                fontSize: 13,
                                color: "hsl(var(--muted-foreground))",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <span>
                                {formDate
                                    ? new Date(
                                          formDate + "T12:00:00",
                                      ).toLocaleDateString("uk", {
                                          weekday: "long",
                                      })
                                    : DAYS[selectedCell.day]}
                                , {TIME_SLOTS[selectedCell.timeSlot]}–
                                {TIME_SLOTS[selectedCell.timeSlot + 1] ?? "..."}
                            </span>
                        </div>
                    )}

                    {/* Date picker */}
                    <CalendarPicker
                        value={formDate}
                        onChange={(d) => setFormDate(d)}
                    />

                    {/* Student — read-only card in edit mode, dropdown in new */}
                    {editingLessonId ? (
                        <div
                            style={{
                                padding: "12px 14px",
                                background: "hsl(var(--mint-50))",
                                border: "1px solid hsl(var(--mint-dark) / 0.15)",
                                borderRadius: 8,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "hsl(var(--muted-foreground))",
                                    marginBottom: 4,
                                }}
                            >
                                Учень
                            </div>
                            <div
                                style={{
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: "hsl(var(--foreground))",
                                }}
                            >
                                {(() => {
                                    const raw = lessons.find(
                                        (l) => l.id === editingLessonId,
                                    );
                                    if (!raw) return "—";
                                    if (raw.is_group)
                                        return (
                                            groups.find(
                                                (g) => g.id === raw.group_id,
                                            )?.name || "Група"
                                        );
                                    return (
                                        students.find(
                                            (s) => s.id === raw.student_id,
                                        )?.name || "Невідомий"
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Lesson type toggle */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    marginBottom: 12,
                                }}
                            >
                                {([false, true] as const).map((isGrp) => {
                                    const active = formIsGroup === isGrp;
                                    return (
                                        <button
                                            key={String(isGrp)}
                                            type="button"
                                            onClick={() => {
                                                setFormIsGroup(isGrp);
                                                setFormStudentId(
                                                    isGrp
                                                        ? groups[0]?.id || ""
                                                        : students[0]?.id || "",
                                                );
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: "9px 4px",
                                                borderRadius: 8,
                                                border: `2px solid ${active ? "hsl(var(--foreground))" : "hsl(var(--border))"}`,
                                                background: active
                                                    ? "hsl(var(--foreground))"
                                                    : "hsl(var(--card))",
                                                color: active
                                                    ? "hsl(var(--card))"
                                                    : "hsl(var(--muted-foreground))",
                                                fontSize: 13,
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            {isGrp
                                                ? "Групове"
                                                : "Індивідуальне"}
                                        </button>
                                    );
                                })}
                            </div>
                            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                                {formIsGroup ? "Група" : "Учень"}
                            </label>
                            <select
                                value={formStudentId}
                                onChange={(e) =>
                                    setFormStudentId(e.target.value)
                                }
                                className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none"
                            >
                                {formIsGroup
                                    ? groups.map((g) => (
                                          <option key={g.id} value={g.id}>
                                              {g.name}
                                          </option>
                                      ))
                                    : students.map((s) => (
                                          <option key={s.id} value={s.id}>
                                              {s.name} — {s.subject}
                                          </option>
                                      ))}
                            </select>
                        </div>
                    )}

                    {/* Duration — button grid like old project */}
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-2">
                            Тривалість
                        </label>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(5, 1fr)",
                                gap: 8,
                            }}
                        >
                            {[30, 45, 60, 90].map((d) => {
                                const active =
                                    formDuration === d && !showCustomDuration;
                                return (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => {
                                            setFormDuration(d);
                                            setShowCustomDuration(false);
                                            setCustomDurationInput("");
                                        }}
                                        style={{
                                            padding: "11px 4px",
                                            borderRadius: 8,
                                            border: `2px solid ${active ? "hsl(var(--foreground))" : "hsl(var(--border))"}`,
                                            background: active
                                                ? "hsl(var(--foreground))"
                                                : "hsl(var(--card))",
                                            color: active
                                                ? "hsl(var(--card))"
                                                : "hsl(var(--muted-foreground))",
                                            fontSize: 15,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            transition: "all 0.15s",
                                            textAlign: "center",
                                        }}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCustomDuration(true);
                                    setCustomDurationInput(
                                        showCustomDuration
                                            ? customDurationInput
                                            : "",
                                    );
                                }}
                                style={{
                                    padding: "11px 4px",
                                    borderRadius: 8,
                                    border: `2px solid ${showCustomDuration ? "hsl(var(--foreground))" : "hsl(var(--border))"}`,
                                    background: showCustomDuration
                                        ? "hsl(var(--foreground))"
                                        : "hsl(var(--card))",
                                    color: showCustomDuration
                                        ? "hsl(var(--card))"
                                        : "hsl(var(--muted-foreground))",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                    textAlign: "center",
                                }}
                            >
                                Інше
                            </button>
                        </div>
                        {showCustomDuration && (
                            <div style={{ marginTop: 10 }}>
                                <input
                                    type="number"
                                    autoFocus
                                    min={1}
                                    max={300}
                                    value={customDurationInput}
                                    onChange={(e) => {
                                        setCustomDurationInput(e.target.value);
                                        const n = parseInt(e.target.value);
                                        if (!isNaN(n) && n > 0)
                                            setFormDuration(n);
                                    }}
                                    placeholder="Введіть тривалість у хвилинах..."
                                    className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none focus:border-foreground"
                                />
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: "hsl(var(--muted-foreground))",
                                        marginTop: 5,
                                    }}
                                >
                                    Введіть тривалість від 1 до 300 хвилин
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Notes — textarea like old project */}
                    <div>
                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                            Нотатки (необов'язково)
                        </label>
                        <textarea
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            placeholder="Додайте нотатки до уроку..."
                            rows={3}
                            style={{ resize: "vertical" }}
                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none focus:border-foreground"
                        />
                    </div>

                    {/* Recurring — new lessons only */}
                    {!editingLessonId && (
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
                                <CalendarPicker
                                    value={recurringEndDate}
                                    minDate={formDate}
                                    onChange={(d) => setRecurringEndDate(d)}
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
