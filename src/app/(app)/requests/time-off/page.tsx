"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { TimeOffRequest } from "@/lib/types/database";

const statusLabel: Record<string, string> = { pending: "In behandeling", approved: "Goedgekeurd", denied: "Afgewezen" };
const statusVariant: Record<string, "pending" | "available" | "off"> = { pending: "pending", approved: "available", denied: "off" };

export default function TimeOffPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ start_date: "", end_date: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("time_off_requests")
      .select("*")
      .eq("employee_id", user.id)
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.end_date < form.start_date) { setError("Einddatum moet na startdatum liggen."); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error: err } = await supabase.from("time_off_requests").insert({
      employee_id: user!.id,
      start_date: form.start_date,
      end_date: form.end_date,
      reason: form.reason || null,
    });
    setSubmitting(false);
    if (err) { setError("Er is een fout opgetreden."); return; }
    setOpen(false);
    setForm({ start_date: "", end_date: "", reason: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verlofaanvragen</h1>
          <p className="text-[--muted-foreground] mt-1 text-sm">Vraag verlof aan of bekijk de status van je aanvragen.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />Verlof aanvragen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Verlofaanvraag indienen</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="start">Startdatum</Label>
                  <Input id="start" type="date" required value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end">Einddatum</Label>
                  <Input id="end" type="date" required value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reason">Reden (optioneel)</Label>
                <Input id="reason" placeholder="Bijv. vakantie, persoonlijke reden…" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
              </div>
              {error && <p className="text-sm text-[--destructive]">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Indienen…" : "Indienen"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-[--muted-foreground] text-sm py-8">Je hebt nog geen verlofaanvragen ingediend.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium">
                      {new Date(r.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                      {r.start_date !== r.end_date && (
                        <> – {new Date(r.end_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</>
                      )}
                    </p>
                    {r.reason && <p className="text-sm text-[--muted-foreground] mt-0.5">{r.reason}</p>}
                    {r.admin_notes && (
                      <p className="text-sm text-[--muted-foreground] mt-1 italic">&ldquo;{r.admin_notes}&rdquo;</p>
                    )}
                    <p className="text-xs text-[--muted-foreground] mt-1">
                      Ingediend op {new Date(r.created_at).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                  <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
