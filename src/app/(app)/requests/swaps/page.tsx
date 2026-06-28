"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, Plus } from "lucide-react";
import type { Profile, ShiftSwapRequest } from "@/lib/types/database";

const statusLabel: Record<string, string> = {
  pending: "Wacht op reactie collega",
  accepted: "Geaccepteerd — wacht op beheerder",
  declined: "Geweigerd door collega",
  admin_approved: "Goedgekeurd",
  admin_denied: "Afgewezen door beheerder",
  cancelled: "Geannuleerd",
};
const statusVariant: Record<string, "pending" | "available" | "off" | "vacation" | "shift"> = {
  pending: "pending",
  accepted: "shift",
  declined: "off",
  admin_approved: "available",
  admin_denied: "off",
  cancelled: "off",
};

export default function SwapsPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string>("");
  const [swaps, setSwaps] = useState<(ShiftSwapRequest & { requester: Profile; target_employee: Profile })[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const [colleagues, setColleagues] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ target_employee_id: "", requester_date: "", target_date: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const [swapRes, empRes] = await Promise.all([
      supabase
        .from("shift_swap_requests")
        .select("*, requester:profiles!requester_id(id,name,role), target_employee:profiles!target_employee_id(id,name,role)")
        .or(`requester_id.eq.${user.id},target_employee_id.eq.${user.id}`)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("active", true).neq("id", user.id).order("name"),
    ]);
    setSwaps((swapRes.data ?? []) as (ShiftSwapRequest & { requester: Profile; target_employee: Profile })[]);
    setColleagues(empRes.data ?? []);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!swaps.length || !listRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const cards = Array.from(listRef.current.children) as HTMLElement[];
    import("animejs").then(({ animate, stagger }) => {
      animate(cards, { opacity: [0, 1], translateY: [10, 0], ease: "out(3)", duration: 320, delay: stagger(40) });
    });
  }, [swaps]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: err } = await supabase.from("shift_swap_requests").insert({
      requester_id: userId,
      target_employee_id: form.target_employee_id,
      requester_date: form.requester_date,
      target_date: form.target_date,
    });
    setSubmitting(false);
    if (err) { setError("Er is een fout opgetreden."); return; }
    setOpen(false);
    setForm({ target_employee_id: "", requester_date: "", target_date: "" });
    load();
  }

  async function respond(id: string, accept: boolean) {
    await supabase.from("shift_swap_requests").update({ status: accept ? "accepted" : "declined" }).eq("id", id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ruildiensten</h1>
          <p className="text-[--muted-foreground] mt-1 text-sm">Wissel een dienst met een collega. Na acceptatie keurt een beheerder goed.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />Ruil aanvragen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ruildienst aanvragen</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Collega</Label>
                <Select onValueChange={(v) => setForm((f) => ({ ...f, target_employee_id: v }))} value={form.target_employee_id}>
                  <SelectTrigger><SelectValue placeholder="Kies een collega" /></SelectTrigger>
                  <SelectContent>
                    {colleagues.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Mijn dienst (datum)</Label>
                  <Input type="date" required value={form.requester_date} onChange={(e) => setForm((f) => ({ ...f, requester_date: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gewenste dienst (datum)</Label>
                  <Input type="date" required value={form.target_date} onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))} />
                </div>
              </div>
              {error && <p className="text-sm text-[--destructive]">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
                <Button type="submit" disabled={submitting || !form.target_employee_id}>{submitting ? "Verzenden…" : "Aanvragen"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {swaps.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-[--muted-foreground] text-sm py-8">Geen ruildienstaanvragen gevonden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" ref={listRef}>
          {swaps.map((s) => {
            const isTarget = s.target_employee_id === userId;
            const canRespond = isTarget && s.status === "pending";
            return (
              <Card key={s.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <ArrowLeftRight className="h-4 w-4 text-[--muted-foreground] shrink-0" />
                      <div>
                        <p className="font-medium text-sm">
                          {s.requester?.name} ({new Date(s.requester_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })})
                          {" "}↔{" "}
                          {s.target_employee?.name} ({new Date(s.target_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })})
                        </p>
                        <p className="text-xs text-[--muted-foreground] mt-0.5">
                          Aangevraagd op {new Date(s.created_at).toLocaleDateString("nl-NL")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={(statusVariant[s.status] ?? "pending") as "pending" | "available" | "off" | "vacation" | "shift"}>{statusLabel[s.status]}</Badge>
                      {canRespond && (
                        <>
                          <Button size="sm" onClick={() => respond(s.id, true)}>Accepteren</Button>
                          <Button size="sm" variant="outline" onClick={() => respond(s.id, false)}>Weigeren</Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
