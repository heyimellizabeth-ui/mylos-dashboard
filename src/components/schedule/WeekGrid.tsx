"use client";
import { useEffect, useRef } from "react";
import { ShiftCell } from "./ShiftCell";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Profile, Schedule } from "@/lib/types/database";

interface WeekGridProps {
  dates: Date[];
  employees: Profile[];
  schedules: Schedule[];
  isAdmin?: boolean;
  onCellClick?: (employeeId: string, date: string) => void;
}

export function WeekGrid({ dates, employees, schedules, isAdmin, onCellClick }: WeekGridProps) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !tbodyRef.current) return;

    import("animejs").then(({ animate, stagger }) => {
      const rows = tbodyRef.current!.querySelectorAll("tr");
      animate(rows, {
        opacity: [0, 1],
        translateY: [-8, 0],
        duration: 320,
        ease: "outQuart",
        delay: stagger(30),
      });
    });
  }, [dates]);

  const scheduleMap = new Map<string, Schedule>();
  schedules.forEach((s) => scheduleMap.set(`${s.employee_id}:${s.date}`, s));

  const dayLabels = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  return (
    <div className="overflow-x-auto rounded-xl border border-[--border]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[--border] bg-[--muted]">
            <th className="px-4 py-3 text-left font-medium text-[--muted-foreground] min-w-[140px]">Medewerker</th>
            {dates.map((d, i) => (
              <th key={d.toISOString()} className="px-2 py-3 text-center font-medium text-[--muted-foreground] min-w-[110px]">
                <span className="block text-xs">{dayLabels[i]}</span>
                <span className="block text-[10px] font-normal">{formatDate(d).split(" ").slice(1).join(" ")}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody ref={tbodyRef} className="divide-y divide-[--border]">
          {employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-[--muted]/40 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[--primary] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {emp.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium leading-tight">{emp.name}</p>
                    <Badge variant={emp.role as "kitchen" | "service" | "admin"} className="mt-0.5 text-[10px]">
                      {emp.role === "kitchen" ? "Keuken" : emp.role === "service" ? "Bediening" : "Admin"}
                    </Badge>
                  </div>
                </div>
              </td>
              {dates.map((d) => {
                const dateStr = d.toISOString().split("T")[0];
                const sched = scheduleMap.get(`${emp.id}:${dateStr}`);
                return (
                  <ShiftCell
                    key={dateStr}
                    schedule={sched}
                    isAdmin={isAdmin}
                    onClick={isAdmin && onCellClick ? () => onCellClick(emp.id, dateStr) : undefined}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
