import { NavLink } from "react-router-dom";
import { Home, Users, BookOpen, Wallet, Calendar } from "lucide-react";

const navItems = [
    { path: "/", label: "Головна", icon: Home },
    { path: "/students", label: "Учні", icon: Users },
    { path: "/groups", label: "Групи", icon: Users },
    { path: "/lessons", label: "Уроки", icon: BookOpen },
    { path: "/schedule", label: "Розклад", icon: Calendar },
    { path: "/payments", label: "Оплати", icon: Wallet },
];

export function LessnMobileNav() {
    return (
        <nav className="fixed left-0 right-0 bottom-0 h-[62px] bg-sidebar flex items-center justify-around z-50 border-t border-white/[0.08]">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-[2px] px-1 py-1.5 text-[9px] font-medium transition-all ${
                            isActive ? "text-sidebar-primary" : "text-white/35"
                        }`
                    }
                >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );
}
