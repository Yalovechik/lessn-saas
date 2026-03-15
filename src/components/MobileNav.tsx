import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LayoutDashboard, Layers, CheckSquare, FileText, Settings, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/components", label: "Components", icon: Layers },
  { to: "/checklist", label: "Refactor Checklist", icon: CheckSquare },
  { to: "/styleguide", label: "Style Guide", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground text-sm">Migration Hub</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-b border-border bg-card px-2 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default MobileNav;
