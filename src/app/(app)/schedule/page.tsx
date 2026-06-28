"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { WeekGrid } from "@/components/schedule/WeekGrid";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getWeekDates, toISODate, formatDate } from "@/lib/utils";
import type { Profile, Schedule } from "@/lib/types/database";

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const gridRef = useRef<HTMLDivElement>(null);

  const dates = getWeekDates(weekOffset);
  const start = toISODate(dates[0]);
  const end = toISODate(dates[6]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [empRes, schedRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("active", true).order("name"),
        supabase.from("schedules").select("*").gte("date", start).lte("date", end),
      ]);
      setEmployees(empRes.data ?? []);
      setSchedules(schedRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [weekOffset]);

  useEffect(() => {
    if (loading || !gridRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    import("animejs").then(({ animate }) => {
      animate(gridRef.current!, { opacity: [0, 1], translateY: [8, 0], ease: "out(3)", duration: 360 });
    });
  }, [loading]);

  const weekLabel = `${formatDate(dates[0])} – ${formatDate(dates[6])}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rooster</h1>
          <p className="text-[--muted-foreground] mt-1 text-sm">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o - 1)} aria-label="Vorige week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Vandaag</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o + 1)} aria-label="Volgende week">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[--border] bg-[--card] h-64 flex items-center justify-center">
          <p className="text-[--muted-foreground] text-sm">Rooster laden…</p>
        </div>
      ) : (
        <div ref={gridRef}>
          <WeekGrid dates={dates} employees={employees} schedules={schedules} isAdmin={false} />
        </div>
      )}
    </div>
  );
}
