import { NavLink } from "react-router-dom";
import { Home, Users, BookOpen, Wallet, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
    { path: "/", label: "Головна", icon: Home },
    { path: "/students", label: "Учні", icon: Users },
    { path: "/groups", label: "Групи", icon: Users },
    { path: "/lessons", label: "Уроки", icon: BookOpen },
    { path: "/schedule", label: "Розклад", icon: Calendar },
    { path: "/payments", label: "Оплати", icon: Wallet },
];

export function LessnSidebar() {
    const { teacher, signOut } = useAuth();

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar flex flex-col z-50">
            {/* Brand */}
            <div className="px-5 py-5 border-b border-white/[0.06]">
                <div className="flex items-center">
                    <svg
                        width="35"
                        height="35"
                        viewBox="0 0 30 30"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* <rect
                            width="32"
                            height="32"
                            rx="7"
                            fill="#7FFFD4"
                            fillOpacity="0.15"
                        /> */}
                        <path
                            d="M7 21V9h3.5v11"
                            stroke="#7FFFD4"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M5 16l5 6 8-11"
                            stroke="#7FFFD4"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.7"
                        />
                    </svg>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[22px] font-extrabold text-white tracking-tight leading-none">
                            LESS
                        </span>
                        <span className="text-[22px] font-extrabold text-sidebar-primary tracking-tight leading-none">
                            N
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="px-2.5 py-4 flex-1 flex flex-col gap-0.5">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/"}
                        className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-[13.5px] font-medium transition-all relative ${
                                isActive
                                    ? "bg-sidebar-primary/[0.08] text-sidebar-primary"
                                    : "text-white/45 hover:bg-white/[0.06] hover:text-white/75"
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-sidebar-primary" />
                                )}
                                <item.icon
                                    className={`h-[18px] w-[18px] ${isActive ? "text-sidebar-primary" : "opacity-60"}`}
                                />
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            {teacher && (
                <div className="px-3.5 py-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-8 h-8 rounded-full bg-mint-dark flex items-center justify-center text-[13px] font-bold text-navy flex-shrink-0">
                            {teacher.name[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[13px] font-semibold text-white truncate">
                                {teacher.name}
                            </p>
                            <p className="text-[11px] text-white/35">
                                {teacher.subject}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full px-3.5 py-2 text-[11px] text-white/25 hover:text-white/50 transition-colors bg-transparent border-none cursor-pointer"
                    >
                        Вийти
                    </button>
                </div>
            )}
        </aside>
    );
}
