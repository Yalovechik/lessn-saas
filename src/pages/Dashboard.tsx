import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import {
    formatCurrency,
    formatDate,
    todayStr,
    formatTime,
} from "@/utils/helpers";
import { Avatar } from "@/components/lessn/Avatar";
import { STATUS_LABELS } from "@/constants";
import { Plus } from "lucide-react";

export default function Dashboard() {
    const { students, lessons, payments, groups } = useAppData();
    const navigate = useNavigate();
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const td = todayStr();

    const todayLessons = lessons
        .filter((l) => l.date === td)
        .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

    const mo = new Date().getMonth();
    const yr = new Date().getFullYear();
    const monthPay = payments.filter((p) => {
        const d = new Date(p.date);
        return d.getMonth() === mo && d.getFullYear() === yr;
    });
    const monthIncome = monthPay.reduce((s, p) => s + p.amount, 0);
    const completedMonth = lessons.filter((l) => {
        const d = new Date(l.date);
        return (
            l.status === "completed" &&
            d.getMonth() === mo &&
            d.getFullYear() === yr
        );
    }).length;

    const getStudent = (id: string) => students.find((s) => s.id === id);
    const getGroup = (id: string) => groups.find((g) => g.id === id);

    const next7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toISOString().split("T")[0];
    });

    const dayNameShort = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("uk-UA", { weekday: "short" });

    const getRemaining = (studentId: string) => {
        const student = students.find((s) => s.id === studentId);
        if (!student) return 0;
        const paid = payments
            .filter((p) => p.student_id === studentId)
            .reduce((x, p) => x + p.amount, 0);
        const lp =
            student.price_per_lesson > 0
                ? Math.floor(paid / student.price_per_lesson)
                : 0;
        const done = lessons.filter(
            (l) => l.student_id === studentId && l.status === "completed",
        ).length;
        return lp - done;
    };

    const lowBal = students.filter((s) => getRemaining(s.id) <= 2);

    const getLessonDisplay = (lesson: (typeof lessons)[0]) => {
        if (lesson.is_group && lesson.group_id) {
            const group = getGroup(lesson.group_id);
            return {
                name: group?.name || "Невідома група",
                subject: `${group?.student_ids?.length || 0} учнів`,
                isGroup: true,
            };
        }
        const student = lesson.student_id
            ? getStudent(lesson.student_id)
            : null;
        return {
            name: student?.name || "Невідомий",
            subject: student?.subject || "",
            isGroup: false,
        };
    };

    const stats = [
        { l: "Учнів", v: students.length, s: `${students.length} активних` },
        { l: "Уроки сьогодні", v: todayLessons.length, s: formatDate(td) },
        {
            l: "Дохід за місяць",
            v: formatCurrency(monthIncome),
            s: `${monthPay.length} оплат`,
        },
        { l: "Проведено уроків", v: completedMonth, s: "за цей місяць" },
    ];

    const accentColors = [
        "hsl(var(--foreground))",
        "hsl(var(--mint-dark))",
        "hsl(var(--orange))",
        "hsl(var(--coral))",
    ];

    const statusColor = (status: string) =>
        status === "completed"
            ? "hsl(var(--mint-dark))"
            : status === "cancelled"
              ? "hsl(var(--coral))"
              : "hsl(var(--border))";

    const statusBg = (status: string) =>
        status === "completed"
            ? "hsl(var(--mint-light))"
            : status === "cancelled"
              ? "hsl(var(--coral-light))"
              : "hsl(var(--card))";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Header */}
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
                    Головна
                </h1>
                <p
                    style={{
                        fontSize: 14,
                        color: "hsl(var(--muted-foreground))",
                        marginTop: 4,
                    }}
                >
                    Огляд вашого репетиторського бізнесу
                </p>
            </div>

            {/* Stats */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 14,
                }}
            >
                {stats.map((s, i) => (
                    <div
                        key={i}
                        style={{
                            background: "hsl(var(--card))",
                            borderRadius: 12,
                            border: "1px solid hsl(var(--border))",
                            padding: "20px 22px",
                            boxShadow: "0 1px 3px rgba(15,23,42,.06)",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                background: accentColors[i],
                                borderRadius: "12px 12px 0 0",
                            }}
                        />
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "hsl(var(--muted-foreground))",
                                textTransform: "uppercase",
                                letterSpacing: ".5px",
                                marginBottom: 10,
                            }}
                        >
                            {s.l}
                        </div>
                        <div
                            style={{
                                fontSize: 30,
                                fontWeight: 700,
                                letterSpacing: "-.5px",
                                lineHeight: 1.1,
                                color: "hsl(var(--foreground))",
                            }}
                        >
                            {s.v}
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                color: "hsl(var(--muted-foreground))",
                                marginTop: 6,
                            }}
                        >
                            {s.s}
                        </div>
                    </div>
                ))}
            </div>

            {/* Today's schedule */}
            <div
                style={{
                    background: "hsl(var(--card))",
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    padding: "20px 22px",
                    boxShadow: "0 1px 3px rgba(15,23,42,.06)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 20,
                    }}
                >
                    <div
                        style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "hsl(var(--foreground))",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Розклад на сьогодні
                    </div>
                    <span
                        style={{
                            fontSize: 12,
                            color: "hsl(var(--muted-foreground))",
                        }}
                    >
                        {new Date().toLocaleDateString("uk-UA", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                        })}
                    </span>
                </div>

                {todayLessons.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 20px" }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>☀️</div>
                        <div
                            style={{
                                fontSize: 15,
                                fontWeight: 600,
                                color: "hsl(var(--muted-foreground))",
                                marginBottom: 4,
                            }}
                        >
                            Сьогодні уроків немає
                        </div>
                        <div
                            style={{
                                fontSize: 13,
                                color: "hsl(var(--muted-foreground))",
                                marginBottom: 16,
                            }}
                        >
                            Вільний день або час додати уроки
                        </div>
                        <button
                            onClick={() => navigate("/lessons")}
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
                            <Plus size={14} /> Запланувати
                        </button>
                    </div>
                ) : (
                    <div style={{ position: "relative" }}>
                        <div
                            style={{
                                position: "absolute",
                                left: 19,
                                top: 8,
                                bottom: 8,
                                width: 2,
                                background: "hsl(var(--border))",
                                borderRadius: 1,
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0,
                            }}
                        >
                            {todayLessons.map((l) => {
                                const display = getLessonDisplay(l);
                                return (
                                    <div
                                        key={l.id}
                                        style={{
                                            display: "flex",
                                            gap: 16,
                                            padding: "12px 0",
                                            position: "relative",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: "relative",
                                                zIndex: 2,
                                                flexShrink: 0,
                                                width: 40,
                                                display: "flex",
                                                justifyContent: "center",
                                                paddingTop: 2,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: "50%",
                                                    background: statusColor(
                                                        l.status,
                                                    ),
                                                    transition: "all .3s",
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                width: 52,
                                                flexShrink: 0,
                                                paddingTop: 1,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 15,
                                                    fontWeight: 700,
                                                    color: "hsl(var(--foreground))",
                                                }}
                                            >
                                                {l.time
                                                    ? formatTime(l.time)
                                                    : "—"}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                padding: "12px 16px",
                                                borderRadius: 10,
                                                background: statusBg(l.status),
                                                border: "1px solid hsl(var(--border))",
                                                boxShadow:
                                                    "0 1px 2px rgba(15,23,42,.04)",
                                                transition: "all .2s",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    marginBottom: l.notes
                                                        ? 6
                                                        : 0,
                                                }}
                                            >
                                                {display.isGroup ? (
                                                    <div
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: "50%",
                                                            background:
                                                                "hsl(var(--mint-light))",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            fontSize: 16,
                                                        }}
                                                    >
                                                        👥
                                                    </div>
                                                ) : (
                                                    <Avatar
                                                        name={display.name}
                                                        size={32}
                                                    />
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <div
                                                        style={{
                                                            fontWeight: 700,
                                                            fontSize: 14,
                                                            color: "hsl(var(--foreground))",
                                                        }}
                                                    >
                                                        {display.name}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            color: "hsl(var(--muted-foreground))",
                                                        }}
                                                    >
                                                        {display.subject}
                                                    </div>
                                                </div>
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 5,
                                                        padding: "3px 10px",
                                                        borderRadius: 16,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        background: statusBg(
                                                            l.status,
                                                        ),
                                                        color:
                                                            l.status ===
                                                            "cancelled"
                                                                ? "hsl(var(--coral-dark))"
                                                                : "hsl(var(--foreground))",
                                                        border: "1px solid hsl(var(--border))",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: "50%",
                                                            background:
                                                                statusColor(
                                                                    l.status,
                                                                ),
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    {STATUS_LABELS[l.status]}
                                                </span>
                                            </div>
                                            {l.notes && (
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: "hsl(var(--muted-foreground))",
                                                        marginTop: 4,
                                                        paddingLeft: 42,
                                                    }}
                                                >
                                                    {l.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Week ahead + Low balance */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                }}
            >
                {/* 7-day mini schedule */}
                <div
                    style={{
                        background: "hsl(var(--card))",
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        padding: "20px 22px",
                        boxShadow: "0 1px 3px rgba(15,23,42,.06)",
                    }}
                >
                    <div
                        style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "hsl(var(--foreground))",
                            marginBottom: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
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
                        Тиждень попереду
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        {next7.map((date) => {
                            const dayLessons = lessons
                                .filter(
                                    (l) =>
                                        l.date === date &&
                                        l.status !== "cancelled",
                                )
                                .sort((a, b) =>
                                    (a.time || "").localeCompare(b.time || ""),
                                );
                            const isToday = date === td;
                            const isOpen = selectedDay === date;
                            return (
                                <div key={date}>
                                    <div
                                        onClick={() =>
                                            setSelectedDay(isOpen ? null : date)
                                        }
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "9px 12px",
                                            borderRadius: isOpen
                                                ? "8px 8px 0 0"
                                                : 8,
                                            background:
                                                isOpen || isToday
                                                    ? "hsl(var(--mint-50))"
                                                    : "transparent",
                                            border:
                                                isOpen || isToday
                                                    ? "1px solid hsl(var(--mint-dark) / 0.15)"
                                                    : "1px solid transparent",
                                            borderBottom: isOpen
                                                ? "none"
                                                : undefined,
                                            cursor: "pointer",
                                            transition: "all .15s",
                                        }}
                                    >
                                        <div
                                            style={{ width: 40, flexShrink: 0 }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    color:
                                                        isToday || isOpen
                                                            ? "hsl(var(--foreground))"
                                                            : "hsl(var(--muted-foreground))",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                {dayNameShort(date)}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: 800,
                                                    color:
                                                        isToday || isOpen
                                                            ? "hsl(var(--foreground))"
                                                            : "hsl(var(--foreground))",
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {new Date(date).getDate()}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {dayLessons.length === 0 ? (
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        color: "hsl(var(--muted-foreground) / 0.5)",
                                                    }}
                                                >
                                                    Вільно
                                                </span>
                                            ) : (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 4,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    {dayLessons.map((l) => {
                                                        const display =
                                                            getLessonDisplay(l);
                                                        return (
                                                            <span
                                                                key={l.id}
                                                                style={{
                                                                    display:
                                                                        "inline-flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 4,
                                                                    padding:
                                                                        "3px 8px",
                                                                    borderRadius: 6,
                                                                    fontSize: 11,
                                                                    fontWeight: 600,
                                                                    background:
                                                                        l.status ===
                                                                        "completed"
                                                                            ? "hsl(var(--mint-light))"
                                                                            : "hsl(var(--secondary))",
                                                                    color: "hsl(var(--foreground))",
                                                                }}
                                                            >
                                                                {l.time && (
                                                                    <span
                                                                        style={{
                                                                            color: "hsl(var(--muted-foreground))",
                                                                            fontWeight: 500,
                                                                        }}
                                                                    >
                                                                        {formatTime(
                                                                            l.time,
                                                                        )}
                                                                    </span>
                                                                )}
                                                                {display.name}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {dayLessons.length > 0 && (
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        color: "hsl(var(--foreground))",
                                                    }}
                                                >
                                                    {dayLessons.length}
                                                </div>
                                            )}
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                style={{
                                                    transform: isOpen
                                                        ? "rotate(180deg)"
                                                        : "rotate(0deg)",
                                                    transition: "transform .2s",
                                                    color: isOpen
                                                        ? "hsl(var(--foreground))"
                                                        : "hsl(var(--muted-foreground))",
                                                }}
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    </div>
                                    {isOpen && dayLessons.length > 0 && (
                                        <div
                                            style={{
                                                background:
                                                    "hsl(var(--mint-50))",
                                                border: "1px solid hsl(var(--mint-dark) / 0.15)",
                                                borderTop: "none",
                                                borderRadius: "0 0 8px 8px",
                                                padding: "8px 12px 12px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 6,
                                                }}
                                            >
                                                {dayLessons.map((l) => {
                                                    const display =
                                                        getLessonDisplay(l);
                                                    const rem = display.isGroup
                                                        ? 0
                                                        : l.student_id
                                                          ? getRemaining(
                                                                l.student_id,
                                                            )
                                                          : 0;
                                                    return (
                                                        <div
                                                            key={l.id}
                                                            style={{
                                                                background:
                                                                    "hsl(var(--card))",
                                                                borderRadius: 10,
                                                                padding:
                                                                    "12px 14px",
                                                                border: "1px solid hsl(var(--border))",
                                                                boxShadow:
                                                                    "0 1px 2px rgba(15,23,42,.04)",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 10,
                                                                }}
                                                            >
                                                                {display.isGroup ? (
                                                                    <div
                                                                        style={{
                                                                            width: 34,
                                                                            height: 34,
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
                                                                        size={
                                                                            34
                                                                        }
                                                                    />
                                                                )}
                                                                <div
                                                                    style={{
                                                                        flex: 1,
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            fontWeight: 700,
                                                                            fontSize: 14,
                                                                            color: "hsl(var(--foreground))",
                                                                        }}
                                                                    >
                                                                        {
                                                                            display.name
                                                                        }
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            fontSize: 12,
                                                                            color: "hsl(var(--muted-foreground))",
                                                                            marginTop: 1,
                                                                        }}
                                                                    >
                                                                        {
                                                                            display.subject
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        textAlign:
                                                                            "right",
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            fontSize: 15,
                                                                            fontWeight: 700,
                                                                            color: "hsl(var(--foreground))",
                                                                        }}
                                                                    >
                                                                        {l.time
                                                                            ? formatTime(
                                                                                  l.time,
                                                                              )
                                                                            : "—"}
                                                                    </div>
                                                                    <span
                                                                        style={{
                                                                            display:
                                                                                "inline-flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: 4,
                                                                            padding:
                                                                                "2px 7px",
                                                                            borderRadius: 16,
                                                                            fontSize: 10,
                                                                            fontWeight: 600,
                                                                            marginTop: 2,
                                                                            background:
                                                                                statusBg(
                                                                                    l.status,
                                                                                ),
                                                                            color:
                                                                                l.status ===
                                                                                "cancelled"
                                                                                    ? "hsl(var(--coral-dark))"
                                                                                    : "hsl(var(--foreground))",
                                                                            border: "1px solid hsl(var(--border))",
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                width: 5,
                                                                                height: 5,
                                                                                borderRadius:
                                                                                    "50%",
                                                                                background:
                                                                                    statusColor(
                                                                                        l.status,
                                                                                    ),
                                                                            }}
                                                                        />
                                                                        {
                                                                            STATUS_LABELS[
                                                                                l
                                                                                    .status
                                                                            ]
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {(l.notes ||
                                                                (!display.isGroup &&
                                                                    rem <=
                                                                        2)) && (
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        gap: 8,
                                                                        marginTop: 8,
                                                                        paddingTop: 8,
                                                                        borderTop:
                                                                            "1px solid hsl(var(--border))",
                                                                    }}
                                                                >
                                                                    {l.notes && (
                                                                        <div
                                                                            style={{
                                                                                flex: 1,
                                                                                fontSize: 12,
                                                                                color: "hsl(var(--muted-foreground))",
                                                                            }}
                                                                        >
                                                                            {
                                                                                l.notes
                                                                            }
                                                                        </div>
                                                                    )}
                                                                    {!display.isGroup &&
                                                                        rem <=
                                                                            2 && (
                                                                            <span
                                                                                style={{
                                                                                    fontSize: 11,
                                                                                    padding:
                                                                                        "2px 8px",
                                                                                    borderRadius: 20,
                                                                                    fontWeight: 700,
                                                                                    background:
                                                                                        rem <=
                                                                                        0
                                                                                            ? "hsl(var(--coral-light))"
                                                                                            : "hsl(var(--orange-light))",
                                                                                    color:
                                                                                        rem <=
                                                                                        0
                                                                                            ? "hsl(var(--coral-dark))"
                                                                                            : "hsl(var(--orange-dark))",
                                                                                }}
                                                                            >
                                                                                {
                                                                                    rem
                                                                                }{" "}
                                                                                зал.
                                                                            </span>
                                                                        )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Low balance */}
                <div
                    style={{
                        background: "hsl(var(--card))",
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        padding: "20px 22px",
                        boxShadow: "0 1px 3px rgba(15,23,42,.06)",
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "hsl(var(--foreground))",
                            marginBottom: 20,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="hsl(var(--coral))"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Увага до балансу
                    </div>
                    {lowBal.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "48px 24px",
                                background: "hsl(var(--mint-50))",
                                borderRadius: 10,
                                border: "1px solid hsl(var(--mint-dark) / 0.15)",
                            }}
                        >
                            <div
                                style={{
                                    width: 56,
                                    height: 56,
                                    margin: "0 auto 16px",
                                    background: "hsl(var(--mint-dark))",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow:
                                        "0 4px 12px hsl(var(--mint-dark) / 0.25)",
                                }}
                            >
                                <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="hsl(var(--card))"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div
                                style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: "hsl(var(--foreground))",
                                    marginBottom: 6,
                                }}
                            >
                                Все добре!
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    color: "hsl(var(--muted-foreground))",
                                }}
                            >
                                Усі учні мають достатній баланс
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            {lowBal.map((s) => {
                                const rem = getRemaining(s.id);
                                return (
                                    <div
                                        key={s.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "12px 14px",
                                            background:
                                                rem <= 0
                                                    ? "hsl(var(--coral-light))"
                                                    : "hsl(var(--orange-light))",
                                            borderRadius: 10,
                                            border: `1px solid ${rem <= 0 ? "hsl(var(--coral) / 0.2)" : "hsl(var(--orange) / 0.2)"}`,
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        <Avatar name={s.name} size={40} />
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    fontSize: 14,
                                                    color: "hsl(var(--foreground))",
                                                    marginBottom: 2,
                                                }}
                                            >
                                                {s.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: "hsl(var(--muted-foreground))",
                                                }}
                                            >
                                                {s.subject}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: 700,
                                                    color:
                                                        rem <= 0
                                                            ? "hsl(var(--coral-dark))"
                                                            : "hsl(var(--orange-dark))",
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {rem}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color:
                                                        rem <= 0
                                                            ? "hsl(var(--coral))"
                                                            : "hsl(var(--orange))",
                                                    fontWeight: 600,
                                                    marginTop: 2,
                                                }}
                                            >
                                                {rem <= 0
                                                    ? "уроків"
                                                    : "залишилось"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
