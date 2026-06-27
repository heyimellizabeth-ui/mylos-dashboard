"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { WeekGrid } from "@/components/schedule/WeekGrid";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getWeekDates, toISODate, formatDate } from "@/lib/utils";
import type { Profile, Schedule, ScheduleStatus } from "@/lib/types/database";

export default function AdminSchedulePage() {
  const supabase = createClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCell, setEditCell] = useState<{ employeeId: string; date: string; existing?: Schedule } | null>(null);
  const [form, setForm] = useState<{ status: ScheduleStatus; shift_start: string; shift_end: string; notes: string }>({
    status: "v", shift_start: "", shift_end: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const dates = getWeekDates(weekOffset);
  const start = toISODate(dates[0]);
  const end = toISODate(dates[6]);
  const weekLabel = `${formatDate(dates[0])} – ${formatDate(dates[6])}`;

  async function load() {
    setLoading(true);
    const [{ data: { user } }, empRes, schedRes] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("profiles").select("*").eq("active", true).order("name"),
      supabase.from("schedules").select("*").gte("date", start).lte("date", end),
    ]);
    setUserId(user?.id ?? "");
    setEmployees(empRes.data ?? []);
    setSchedules(schedRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [weekOffset]);

  function openCell(employeeId: string, date: string) {
    const existing = schedules.find((s) => s.employee_id === employeeId && s.date === date);
    setEditCell({ employeeId, date, existing });
    setForm({
      status: existing?.status ?? "v",
      shift_start: existing?.shift_start?.slice(0, 5) ?? "",
      shift_end: existing?.shift_end?.slice(0, 5) ?? "",
      notes: existing?.notes ?? "",
    });
  }

  async function saveCell() {
    if (!editCell) return;
    setSaving(true);
    const payload = {
      employee_id: editCell.employeeId,
      date: editCell.date,
      status: form.status,
      shift_start: form.shift_start || null,
      shift_end: form.shift_end || null,
      notes: form.notes || null,
      created_by: userId,
    };
    if (editCell.existing) {
      await supabase.from("schedules").update(payload).eq("id", editCell.existing.id);
    } else {
      await supabase.from("schedules").insert(payload);
    }
    setSaving(false);
    setEditCell(null);
    load();
  }

  async function deleteCell() {
    if (!editCell?.existing) return;
    await supabase.from("schedules").delete().eq("id", editCell.existing.id);
    setEditCell(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rooster beheer</h1>
          <p className="text-[--muted-foreground] mt-1 text-sm">{weekLabel} · Klik op een cel om te bewerken</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Vandaag</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[--border] bg-[--card] h-64 flex items-center justify-center">
          <p className="text-[--muted-foreground] text-sm">Rooster laden…</p>
        </div>
      ) : (
        <WeekGrid dates={dates} employees={employees} schedules={schedules} isAdmin onCellClick={openCell} />
      )}

      <Dialog open={!!editCell} onOpenChange={(o) => !o && setEditCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCell && employees.find((e) => e.id === editCell.employeeId)?.name}
              {editCell && ` — ${new Date(editCell.date).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ScheduleStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="v">Aanwezig (v)</SelectItem>
                  <SelectItem value="x">Vrij (x)</SelectItem>
                  <SelectItem value="vak">Vakantie (Vak)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.status === "v" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Begintijd dienst</Label>
                  <Input type="time" value={form.shift_start} onChange={(e) => setForm((f) => ({ ...f, shift_start: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Eindtijd dienst</Label>
                  <Input type="time" value={form.shift_end} onChange={(e) => setForm((f) => ({ ...f, shift_end: e.target.value }))} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Notitie (optioneel)</Label>
              <Input placeholder="Bijv. extra afsluiting…" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex justify-between gap-2">
              {editCell?.existing && (
                <Button variant="destructive" size="sm" onClick={deleteCell}>Verwijderen</Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setEditCell(null)}>Annuleren</Button>
                <Button onClick={saveCell} disabled={saving}>{saving ? "Opslaan…" : "Opslaan"}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
