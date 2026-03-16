import type { ReactNode } from "react";

// ── Column Definition ────────────────────────────────────────────────────────

export interface Column<T> {
    /** Header label text */
    header: string;
    /** Render cell content for a given row */
    render: (row: T) => ReactNode;
    /** Optional fixed width (px or CSS string) */
    width?: number | string;
}

// ── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationProps {
    page: number;
    setPage: (page: number) => void;
    pageSize: number;
    total: number;
}

// ── DataTable Props ──────────────────────────────────────────────────────────

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (row: T) => string;
    onRowClick?: (row: T) => void;
    pagination?: PaginationProps;
    emptyState?: ReactNode;
}

// ── Styles ───────────────────────────────────────────────────────────────────

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

const tdStyle: React.CSSProperties = {
    padding: "14px 16px",
};

const rowStyle: React.CSSProperties = {
    borderBottom: "1px solid hsl(var(--border) / 0.5)",
    transition: "background .15s",
};

const navBtnBase: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    background: "transparent",
    fontSize: 13,
    fontWeight: 600,
    color: "hsl(var(--foreground))",
    display: "flex",
    alignItems: "center",
    gap: 4,
};

// ── Chevron Icons ────────────────────────────────────────────────────────────

function ChevronLeft() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}

function ChevronRight() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

// ── Action Button Icons ──────────────────────────────────────────────────────

export function EditIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

export function DeleteIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    );
}

export function CalendarIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

export function CheckIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

export function XIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

// ── Action Button Wrapper ────────────────────────────────────────────────────

export const actionBtnStyle: React.CSSProperties = {
    padding: "6px",
    borderRadius: 6,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
};

export const actionBtnFilledStyle = (bg: string, color: string): React.CSSProperties => ({
    padding: "6px 12px",
    minWidth: 36,
    minHeight: 36,
    background: bg,
    color: color,
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
});

// ── DataTable Component ──────────────────────────────────────────────────────

export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    onRowClick,
    pagination,
    emptyState,
}: DataTableProps<T>) {
    const totalPages = pagination
        ? Math.ceil(pagination.total / pagination.pageSize)
        : 0;

    return (
        <div
            style={{
                background: "hsl(var(--card))",
                borderRadius: 12,
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 1px 3px rgba(15,23,42,.06)",
                overflow: "hidden",
            }}
        >
            {data.length === 0 && emptyState ? (
                emptyState
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                {columns.map((col, i) => {
                                    const isLast = i === columns.length - 1;
                                    return (
                                        <th
                                            key={i}
                                            style={{
                                                ...thStyle,
                                                ...(col.width != null ? { width: col.width } : {}),
                                                ...(isLast ? { textAlign: "right" } : {}),
                                            }}
                                        >
                                            {col.header}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => (
                                <tr
                                    key={keyExtractor(row)}
                                    style={{
                                        ...rowStyle,
                                        cursor: onRowClick ? "pointer" : undefined,
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background =
                                            "hsl(var(--secondary) / 0.3)")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = "transparent")
                                    }
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                >
                                    {columns.map((col, i) => {
                                        const isLast = i === columns.length - 1;
                                        return (
                                            <td key={i} style={{ ...tdStyle, ...(isLast ? { textAlign: "right", display: "flex", justifyContent: "flex-end" } : {}) }}>
                                                {col.render(row)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {pagination && totalPages > 1 && (
                <div
                    style={{
                        padding: "16px 20px",
                        borderTop: "1px solid hsl(var(--border))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
                        Показано{" "}
                        {(pagination.page - 1) * pagination.pageSize + 1}–
                        {Math.min(pagination.page * pagination.pageSize, pagination.total)}{" "}
                        з {pagination.total}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                        <button
                            onClick={() => pagination.setPage(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page === 1}
                            style={{
                                ...navBtnBase,
                                cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                                opacity: pagination.page === 1 ? 0.4 : 1,
                            }}
                        >
                            <ChevronLeft /> Назад
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => pagination.setPage(i + 1)}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: 6,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    border: "none",
                                    background:
                                        pagination.page === i + 1
                                            ? "hsl(var(--foreground))"
                                            : "transparent",
                                    color:
                                        pagination.page === i + 1
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
                                pagination.setPage(Math.min(totalPages, pagination.page + 1))
                            }
                            disabled={pagination.page === totalPages}
                            style={{
                                ...navBtnBase,
                                cursor: pagination.page === totalPages ? "not-allowed" : "pointer",
                                opacity: pagination.page === totalPages ? 0.4 : 1,
                            }}
                        >
                            Вперед <ChevronRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
