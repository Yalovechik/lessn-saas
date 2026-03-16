import React, { useState, useRef, useEffect } from "react";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchable?: boolean;
    className?: string;
}

export function CustomSelect({
    options,
    value,
    onChange,
    placeholder = "Обрати…",
    searchable = false,
    className,
}: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // auto-focus search when opened
    useEffect(() => {
        if (open && searchable && searchRef.current) {
            searchRef.current.focus();
        }
    }, [open, searchable]);

    const selected = options.find((o) => o.value === value);
    const filtered = searchable && search
        ? options.filter((o) => !o.disabled && o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    return (
        <div ref={wrapRef} className={className} style={{ position: "relative" }}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => { setOpen((v) => !v); setSearch(""); }}
                style={{
                    width: "100%",
                    padding: "10px 36px 10px 12px",
                    borderRadius: 8,
                    border: "1.5px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    color: selected ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                    position: "relative",
                    outline: "none",
                    transition: "border-color 0.15s",
                }}
            >
                {selected ? selected.label : placeholder}
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)",
                        transition: "transform 0.2s",
                        color: "hsl(var(--muted-foreground))",
                    }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {/* Popover */}
            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        zIndex: 2000,
                        maxHeight: 260,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Search bar */}
                    {searchable && (
                        <div style={{ padding: "8px 10px", borderBottom: "1px solid hsl(var(--border))" }}>
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Пошук…"
                                style={{
                                    width: "100%",
                                    padding: "7px 10px",
                                    borderRadius: 8,
                                    border: "1.5px solid hsl(var(--border))",
                                    background: "hsl(var(--secondary) / 0.3)",
                                    fontSize: 13,
                                    color: "hsl(var(--foreground))",
                                    outline: "none",
                                }}
                            />
                        </div>
                    )}

                    {/* Options */}
                    <div style={{ overflowY: "auto", maxHeight: searchable ? 200 : 260 }}>
                        {filtered.length === 0 && (
                            <div style={{ padding: "14px 16px", fontSize: 13, color: "hsl(var(--muted-foreground))", textAlign: "center" }}>
                                Нічого не знайдено
                            </div>
                        )}
                        {filtered.map((opt) => {
                            if (opt.disabled) {
                                return (
                                    <div
                                        key={opt.value + "-sep"}
                                        style={{
                                            padding: "4px 16px",
                                            fontSize: 11,
                                            color: "hsl(var(--muted-foreground))",
                                            borderTop: "1px solid hsl(var(--border) / 0.5)",
                                            userSelect: "none",
                                        }}
                                    />
                                );
                            }
                            const isActive = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "11px 16px",
                                        background: isActive ? "hsl(var(--secondary))" : "transparent",
                                        border: "none",
                                        textAlign: "left",
                                        fontSize: 14,
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        transition: "background 0.1s",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) e.currentTarget.style.background = "hsl(var(--secondary) / 0.5)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isActive ? "hsl(var(--secondary))" : "transparent";
                                    }}
                                >
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {opt.label}
                                    </span>
                                    {isActive && (
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ flexShrink: 0, marginLeft: 8 }}
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
