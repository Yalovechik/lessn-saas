import { useState } from "react";

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

const MONTH_NAMES = [
    "Січень",
    "Лютий",
    "Березень",
    "Квітень",
    "Травень",
    "Червень",
    "Липень",
    "Серпень",
    "Вересень",
    "Жовтень",
    "Листопад",
    "Грудень",
];

// ─── Calendar Range Picker ────────────────────────────────────────────────────

export function CalendarPicker({
    value,
    onChange,
    minDate,
}: {
    value: string;
    onChange: (date: string) => void;
    minDate?: string;
}) {
    const today = new Date();
    const initDate = value ? new Date(value + "T12:00:00") : today;
    const [viewYear, setViewYear] = useState(initDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(initDate.getMonth());
    const [open, setOpen] = useState(false);

    const toStr = (d: Date) => d.toISOString().split("T")[0];

    const getDays = () => {
        const firstDay = new Date(viewYear, viewMonth, 1);
        const lastDay = new Date(viewYear, viewMonth + 1, 0);
        const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const days: (string | null)[] = [];
        for (let i = 0; i < startPad; i++) days.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(toStr(new Date(viewYear, viewMonth, d)));
        }
        return days;
    };

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else setViewMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else setViewMonth((m) => m + 1);
    };

    const displayValue = value
        ? new Date(value + "T12:00:00").toLocaleDateString("uk", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : "Оберіть дату";

    return (
        <div style={{ position: "relative" }}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1.5px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    color: value
                        ? "hsl(var(--foreground))"
                        : "hsl(var(--muted-foreground))",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    textAlign: "left",
                    transition: "border-color 0.15s",
                }}
            >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ opacity: 0.5, flexShrink: 0 }}
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
                    {displayValue}
                </span>
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
                        opacity: 0.4,
                        transform: open ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                        flexShrink: 0,
                    }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {open && (
                <>
                    <div
                        style={{ position: "fixed", inset: 0, zIndex: 2998 }}
                        onClick={() => setOpen(false)}
                    />
                    <div
                        style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            left: 0,
                            right: 0,
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 12,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
                            zIndex: 2999,
                            padding: "16px 16px 12px",
                        }}
                    >
                        {/* Month nav */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 12,
                            }}
                        >
                            <button
                                onClick={prevMonth}
                                type="button"
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    color: "hsl(var(--muted-foreground))",
                                    fontSize: 18,
                                    lineHeight: 1,
                                }}
                            >
                                ‹
                            </button>
                            <span
                                style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "hsl(var(--foreground))",
                                }}
                            >
                                {MONTH_NAMES[viewMonth]} {viewYear}
                            </span>
                            <button
                                onClick={nextMonth}
                                type="button"
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    color: "hsl(var(--muted-foreground))",
                                    fontSize: 18,
                                    lineHeight: 1,
                                }}
                            >
                                ›
                            </button>
                        </div>
                        {/* Day headers */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(7, 1fr)",
                                gap: 2,
                                marginBottom: 4,
                            }}
                        >
                            {DAY_NAMES.map((d) => (
                                <div
                                    key={d}
                                    style={{
                                        textAlign: "center",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "hsl(var(--muted-foreground))",
                                        padding: "2px 0",
                                    }}
                                >
                                    {d}
                                </div>
                            ))}
                        </div>
                        {/* Days */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(7, 1fr)",
                                gap: 2,
                            }}
                        >
                            {getDays().map((dateStr, i) => {
                                if (!dateStr) return <div key={`e-${i}`} />;
                                const isSelected = dateStr === value;
                                const isToday = dateStr === toStr(today);
                                const isDisabled = minDate
                                    ? dateStr < minDate
                                    : false;
                                return (
                                    <button
                                        key={dateStr}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => {
                                            onChange(dateStr);
                                            setOpen(false);
                                        }}
                                        style={{
                                            padding: "7px 2px",
                                            border: "none",
                                            borderRadius: 6,
                                            background: isSelected
                                                ? "hsl(var(--foreground))"
                                                : "transparent",
                                            color: isDisabled
                                                ? "hsl(var(--border))"
                                                : isSelected
                                                  ? "hsl(var(--card))"
                                                  : isToday
                                                    ? "hsl(var(--mint-dark))"
                                                    : "hsl(var(--foreground))",
                                            fontWeight:
                                                isSelected || isToday
                                                    ? 700
                                                    : 400,
                                            fontSize: 13,
                                            cursor: isDisabled
                                                ? "not-allowed"
                                                : "pointer",
                                            textAlign: "center",
                                            outline:
                                                isToday && !isSelected
                                                    ? "1.5px solid hsl(var(--mint-dark))"
                                                    : "none",
                                            transition: "background 0.1s",
                                        }}
                                    >
                                        {new Date(
                                            dateStr + "T12:00:00",
                                        ).getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Calendar Single Date Picker ─────────────────────────────────────────────

export function CalendarRangePicker({
    startDate,
    endDate,
    onSelect,
}: {
    startDate: string;
    endDate: string;
    onSelect: (start: string, end: string) => void;
}) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [hoverDate, setHoverDate] = useState<string | null>(null);
    // picking state: null = pick start, "start" = picked start, waiting for end
    const [picking, setPicking] = useState<"start" | null>(
        startDate ? "start" : null,
    );

    const toStr = (d: Date) => d.toISOString().split("T")[0];

    const getDays = () => {
        const firstDay = new Date(viewYear, viewMonth, 1);
        const lastDay = new Date(viewYear, viewMonth + 1, 0);
        const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const days: (string | null)[] = [];
        for (let i = 0; i < startPad; i++) days.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(toStr(new Date(viewYear, viewMonth, d)));
        }
        return days;
    };

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else setViewMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else setViewMonth((m) => m + 1);
    };

    const handleDayClick = (dateStr: string) => {
        if (!picking || !startDate) {
            // picking start
            onSelect(dateStr, "");
            setPicking("start");
        } else {
            // picking end
            if (dateStr < startDate) {
                onSelect(dateStr, startDate);
            } else {
                onSelect(startDate, dateStr);
            }
            setPicking(null);
        }
    };

    const isInRange = (dateStr: string) => {
        const s = startDate;
        const e = picking === "start" ? hoverDate || "" : endDate;
        if (!s || !e) return false;
        const [lo, hi] = s <= e ? [s, e] : [e, s];
        return dateStr > lo && dateStr < hi;
    };

    const days = getDays();

    return (
        <div style={{ padding: "16px 16px 12px", minWidth: 280 }}>
            {/* Month nav */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                }}
            >
                <button
                    onClick={prevMonth}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: 6,
                        color: "hsl(var(--muted-foreground))",
                        fontSize: 16,
                    }}
                >
                    ‹
                </button>
                <span
                    style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "hsl(var(--foreground))",
                    }}
                >
                    {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <button
                    onClick={nextMonth}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: 6,
                        color: "hsl(var(--muted-foreground))",
                        fontSize: 16,
                    }}
                >
                    ›
                </button>
            </div>

            {/* Day headers */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 2,
                    marginBottom: 4,
                }}
            >
                {DAY_NAMES.map((d) => (
                    <div
                        key={d}
                        style={{
                            textAlign: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "hsl(var(--muted-foreground))",
                            padding: "2px 0",
                        }}
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Days grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 2,
                }}
            >
                {days.map((dateStr, i) => {
                    if (!dateStr) return <div key={`empty-${i}`} />;
                    const isStart = dateStr === startDate;
                    const isEnd = dateStr === endDate;
                    const inRange = isInRange(dateStr);
                    const isToday = dateStr === toStr(today);
                    const isSelected = isStart || isEnd;

                    return (
                        <button
                            key={dateStr}
                            onClick={() => handleDayClick(dateStr)}
                            onMouseEnter={() =>
                                picking === "start" && setHoverDate(dateStr)
                            }
                            onMouseLeave={() => setHoverDate(null)}
                            style={{
                                padding: "6px 2px",
                                border: "none",
                                borderRadius: isStart
                                    ? "6px 0 0 6px"
                                    : isEnd
                                      ? "0 6px 6px 0"
                                      : inRange
                                        ? 0
                                        : 6,
                                background: isSelected
                                    ? "hsl(var(--foreground))"
                                    : inRange
                                      ? "hsl(var(--secondary))"
                                      : "transparent",
                                color: isSelected
                                    ? "hsl(var(--card))"
                                    : isToday
                                      ? "hsl(var(--mint-dark))"
                                      : "hsl(var(--foreground))",
                                fontWeight: isSelected || isToday ? 700 : 400,
                                fontSize: 13,
                                cursor: "pointer",
                                textAlign: "center",
                                outline:
                                    isToday && !isSelected
                                        ? "1.5px solid hsl(var(--mint-dark))"
                                        : "none",
                                transition: "background 0.1s",
                            }}
                        >
                            {new Date(dateStr + "T12:00:00").getDate()}
                        </button>
                    );
                })}
            </div>

            {/* Selected range label */}
            {(startDate || endDate) && (
                <div
                    style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px solid hsl(var(--border))",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            color: "hsl(var(--muted-foreground))",
                        }}
                    >
                        {startDate && endDate
                            ? `${startDate} — ${endDate}`
                            : picking === "start"
                              ? "Оберіть кінцеву дату"
                              : "Оберіть початкову дату"}
                    </span>
                    {startDate && (
                        <button
                            onClick={() => {
                                onSelect("", "");
                                setPicking(null);
                            }}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 12,
                                color: "hsl(var(--muted-foreground))",
                                padding: "2px 6px",
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
