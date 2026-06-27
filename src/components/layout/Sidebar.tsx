"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, ClipboardList, ArrowLeftRight, Users, Settings, LogOut, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types/database";

const staffLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Rooster", icon: Calendar },
  { href: "/requests/time-off", label: "Verlofaanvragen", icon: ClipboardList },
  { href: "/requests/swaps", label: "Ruildiensten", icon: ArrowLeftRight },
];

const adminLinks = [
  { href: "/admin/schedule", label: "Rooster beheer", icon: Calendar },
  { href: "/admin/requests", label: "Aanvragen", icon: ClipboardList },
  { href: "/admin/users", label: "Medewerkers", icon: Users },
  { href: "/admin/announcements", label: "Mededelingen", icon: Megaphone },
];

interface SidebarProps {
  role: Role;
  name: string;
}

export function Sidebar({ role, name }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[--card] border-r border-[--border] shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[--border]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[--primary] flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Mylos Rooster</p>
            <p className="text-[10px] text-[--muted-foreground] leading-tight">Alkmaar</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {staffLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname.startsWith(href) && href !== "/dashboard"
                ? "bg-[--primary] text-white"
                : pathname === href && href === "/dashboard"
                ? "bg-[--primary] text-white"
                : "text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground]"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {role === "admin" && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[--muted-foreground]">Beheer</p>
            </div>
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  pathname.startsWith(href)
                    ? "bg-[--primary] text-white"
                    : "text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-[--border] space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="h-7 w-7 rounded-full bg-[--primary] flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{name}</p>
            <p className="text-[10px] text-[--muted-foreground] capitalize">{role === "kitchen" ? "Keuken" : role === "service" ? "Bediening" : "Admin"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground] transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Uitloggen
        </button>
      </div>
    </aside>
  );
}
