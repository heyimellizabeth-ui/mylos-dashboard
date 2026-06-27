"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X } from "lucide-react";
import type { TimeOffRequest, ShiftSwapRequest, Profile } from "@/lib/types/database";

export default function AdminRequestsPage() {
  const supabase = createClient();
  const [timeOff, setTimeOff] = useState<(TimeOffRequest & { profiles: Profile })[]>([]);
  const [swaps, setSwaps] = useState<(ShiftSwapRequest & { requester: Profile; target_employee: Profile })[]>([]);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [userId, setUserId] = useState<string>("");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? "");
    const [toRes, swRes] = await Promise.all([
      supabase.from("time_off_requests").select("*, profiles(id,name,role)").order("created_at", { ascending: false }),
      supabase
        .from("shift_swap_requests")
        .select("*, requester:profiles!requester_id(id,name,role), target_employee:profiles!target_employee_id(id,name,role)")
        .order("created_at", { ascending: false }),
    ]);
    setTimeOff((toRes.data ?? []) as (TimeOffRequest & { profiles: Profile })[]);
    setSwaps((swRes.data ?? []) as (ShiftSwapRequest & { requester: Profile; target_employee: Profile })[]);
  }

  useEffect(() => { load(); }, []);

  async function reviewTimeOff(id: string, approved: boolean) {
    await supabase.from("time_off_requests").update({
      status: approved ? "approved" : "denied",
      admin_notes: adminNotes || null,
      reviewed_by: userId,
    }).eq("id", id);
    setReviewId(null);
    setAdminNotes("");
    load();
  }

  async function reviewSwap(id: string, approved: boolean) {
    await supabase.from("shift_swap_requests").update({
      status: approved ? "admin_approved" : "admin_denied",
      admin_approved_by: userId,
    }).eq("id", id);
    load();
  }

  const pendingTimeOff = timeOff.filter((r) => r.status === "pending");
  const pastTimeOff = timeOff.filter((r) => r.status !== "pending");
  const pendingSwaps = swaps.filter((s) => s.status === "accepted");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aanvragen beheer</h1>
        <p className="text-[--muted-foreground] mt-1 text-sm">Keur verlof- en ruildienstverzoeken goed of wijs ze af.</p>
      </div>

      {/* Pending time off */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Verlof in behandeling <Badge variant="pending">{pendingTimeOff.length}</Badge>
        </h2>
        {pendingTimeOff.length === 0 ? (
          <p className="text-sm text-[--muted-foreground]">Geen openstaande verlofaanvragen.</p>
        ) : (
          <div className="space-y-2">
            {pendingTimeOff.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium">{r.profiles?.name}</p>
                      <p className="text-sm text-[--muted-foreground]">
                        {new Date(r.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
                        {r.start_date !== r.end_date && <> – {new Date(r.end_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}</>}
                        {r.reason && <> · {r.reason}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => { setReviewId(r.id); }}>
                        <Check className="h-4 w-4" />Goedkeuren
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reviewTimeOff(r.id, false)}>
                        <X className="h-4 w-4" />Afwijzen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Pending swaps awaiting admin */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Ruildiensten wachten op goedkeuring <Badge variant="pending">{pendingSwaps.length}</Badge>
        </h2>
        {pendingSwaps.length === 0 ? (
          <p className="text-sm text-[--muted-foreground]">Geen ruildiensten in behandeling.</p>
        ) : (
          <div className="space-y-2">
            {pendingSwaps.map((s) => (
              <Card key={s.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <p className="text-sm">
                      {s.requester?.name} ({new Date(s.requester_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })})
                      {" "}↔{" "}
                      {s.target_employee?.name} ({new Date(s.target_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })})
                      {" "}— beide akkoord
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => reviewSwap(s.id, true)}><Check className="h-4 w-4" />Goedkeuren</Button>
                      <Button size="sm" variant="outline" onClick={() => reviewSwap(s.id, false)}><X className="h-4 w-4" />Afwijzen</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Verlofhistorie</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[--border] bg-[--muted]">
                    <th className="px-4 py-3 text-left font-medium text-[--muted-foreground]">Medewerker</th>
                    <th className="px-4 py-3 text-left font-medium text-[--muted-foreground]">Periode</th>
                    <th className="px-4 py-3 text-left font-medium text-[--muted-foreground]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border]">
                  {pastTimeOff.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3">{r.profiles?.name}</td>
                      <td className="px-4 py-3 text-[--muted-foreground]">
                        {new Date(r.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                        {r.start_date !== r.end_date && <> – {new Date(r.end_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={r.status === "approved" ? "available" : "off"}>
                          {r.status === "approved" ? "Goedgekeurd" : "Afgewezen"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Approve with notes dialog */}
      <Dialog open={!!reviewId} onOpenChange={(o) => !o && setReviewId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Verlofaanvraag goedkeuren</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Opmerking voor medewerker (optioneel)</Label>
              <Input placeholder="Bijv. Let op: bezettingseisen…" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewId(null)}>Annuleren</Button>
              <Button onClick={() => reviewTimeOff(reviewId!, true)}>Goedkeuren</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
