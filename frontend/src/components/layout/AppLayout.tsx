import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, List, Sparkles, Calendar,
  TrendingUp, Bell, LogOut, Menu, Crown, Zap,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { NotificationBell } from "./NotificationBell";
import { SessionTimer } from "@/components/dashboard/SessionTimer";
import { cn } from "@/lib/utils";

const nav = [
  {
    group: "OVERVIEW",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/subjects", label: "Subjects", icon: BookOpen },
      { to: "/topics", label: "Topics", icon: List },
    ],
  },
  {
    group: "AI TOOLS",
    items: [
      { to: "/ai", label: "Upload Syllabus", icon: Zap },
      { to: "/plans", label: "AI Planner", icon: Sparkles },
    ],
  },
  {
    group: "TRACKING",
    items: [
      { to: "/progress", label: "Progress", icon: TrendingUp },
      { to: "/reminders", label: "Reminders", icon: Bell },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-border">
        <span className="font-mono font-semibold text-lg text-foreground tracking-tight">Sylla</span>
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-0.5">AI SYLLABUS TRACKER</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {nav.map((section) => (
          <div key={section.group}>
            <p className="font-mono text-[9px] text-muted-foreground tracking-widest px-2 mb-2">{section.group}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={(item as any).exact}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-accent text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )
                  }
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3 space-y-2">
        {user?.plan === "FREE" && (
          <button
            onClick={() => { navigate("/pricing"); onNavigate?.(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md bg-secondary hover:bg-accent transition-colors"
          >
            <Crown size={13} className="text-muted-foreground" />
            <div className="flex-1 text-left">
              <p className="text-xs text-foreground font-medium">Free plan</p>
              <p className="font-mono text-[10px] text-muted-foreground">Upgrade to Pro →</p>
            </div>
            <span className="font-mono text-[9px] border border-border rounded px-1 py-0.5 text-muted-foreground">FREE</span>
          </button>
        )}
        {user?.plan === "PRO" && (
          <div className="flex items-center gap-2 px-3 py-2">
            <Crown size={13} className="text-primary" />
            <span className="font-mono text-[10px] text-primary">PRO PLAN</span>
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-2 rounded-md">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-primary text-xs font-mono font-semibold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground font-medium truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate font-mono">{user?.email}</p>
          </div>
          <button onClick={() => { logout(); onNavigate?.(); }} className="text-muted-foreground hover:text-foreground transition-colors" title="Logout">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const pageTitle = (() => {
    const p = location.pathname;
    if (p === "/") return "Dashboard";
    if (p.startsWith("/subjects")) return "Subjects";
    if (p.startsWith("/topics")) return "Topics";
    if (p.startsWith("/ai")) return "AI Tools";
    if (p.startsWith("/plans")) return "AI Planner";
    if (p.startsWith("/progress")) return "Progress";
    if (p.startsWith("/reminders")) return "Reminders";
    if (p.startsWith("/pricing")) return "Plans";
    return "Sylla";
  })();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden md:flex w-[260px] flex-shrink-0 flex-col border-r border-border bg-card">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed left-0 top-0 bottom-0 z-50 w-[260px] bg-card border-r border-border md:hidden">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors"><Menu size={18} /></button>
          <span className="font-mono text-sm font-semibold">{pageTitle}</span>
          <NotificationBell />
        </header>

        <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 shrink-0">
          <span className="font-mono text-xs text-muted-foreground tracking-widest">{pageTitle.toUpperCase()}</span>
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="min-h-full">
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <SessionTimer />
    </div>
  );
}
