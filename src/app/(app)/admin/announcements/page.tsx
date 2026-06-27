"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { Announcement, TargetRole } from "@/lib/types/database";

export default function AnnouncementsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<(Announcement & { author?: { name: string } })[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", target_role: "all" as TargetRole });
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>("");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? "");
    const { data } = await supabase
      .from("announcements")
      .select("*, author:profiles(name)")
      .order("created_at", { ascending: false });
    setItems((data ?? []) as (Announcement & { author?: { name: string } })[]);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from("announcements").insert({ ...form, created_by: userId });
    setSubmitting(false);
    setOpen(false);
    setForm({ title: "", body: "", target_role: "all" });
    load();
  }

  async function remove(id: string) {
    await supabase.from("announcements").delete().eq("id", id);
    load();
  }

  const roleLabel: Record<TargetRole, string> = { all: "Iedereen", kitchen: "Keuken", service: "Bediening" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mededelingen</h1>
          <p className="text-[--muted-foreground] mt-1 text-sm">Publiceer berichten voor keuken, bediening of het hele team.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />Nieuwe mededeling</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Mededeling plaatsen</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Titel</Label>
                <Input required placeholder="Bijv. Vergadering vrijdag 10:00" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Bericht (optioneel)</Label>
                <Input placeholder="Meer details…" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Voor</Label>
                <Select value={form.target_role} onValueChange={(v) => setForm((f) => ({ ...f, target_role: v as TargetRole }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Iedereen</SelectItem>
                    <SelectItem value="kitchen">Keuken</SelectItem>
                    <SelectItem value="service">Bediening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Plaatsen…" : "Plaatsen"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[--muted-foreground]">Nog geen mededelingen.</p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{a.title}</p>
                      <Badge variant={a.target_role === "kitchen" ? "kitchen" : a.target_role === "service" ? "service" : "default"}>
                        {roleLabel[a.target_role]}
                      </Badge>
                    </div>
                    {a.body && <p className="text-sm text-[--muted-foreground]">{a.body}</p>}
                    <p className="text-xs text-[--muted-foreground]">
                      {a.author?.name} · {new Date(a.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(a.id)} aria-label="Verwijderen">
                    <Trash2 className="h-4 w-4 text-[--muted-foreground]" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
