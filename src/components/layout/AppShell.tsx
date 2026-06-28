"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import type { Role } from "@/lib/types/database";

export function AppShell({ role, name, children }: { role: Role; name: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[--background]">
      {/* Mobile top header — hidden on lg+ */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-4 bg-[--card] border-b border-[--border]">
        <button
          onClick={() => setOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-[--muted] transition-colors"
          aria-label="Menu openen"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[--primary] flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">Mylos Rooster</span>
        </div>
        {/* Right spacer so title stays centred */}
        <div className="w-9" aria-hidden="true" />
      </header>

      {/* Mobile backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar — desktop: static; mobile: slide-in drawer */}
      <Sidebar role={role} name={name} mobileOpen={open} onMobileClose={() => setOpen(false)} />

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto pt-14 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
