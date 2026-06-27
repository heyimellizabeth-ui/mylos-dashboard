"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserX, UserCheck } from "lucide-react";
import type { Profile, Role } from "@/lib/types/database";

const roleLabel: Record<Role, string> = { kitchen: "Keuken", service: "Bediening", admin: "Beheerder" };

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "service" as Role });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    const { data } = await supabase.from("profiles").select("*").order("name");
    setUsers(data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    setSubmitting(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(json.error ?? "Er is een fout opgetreden."); return; }
    setSuccess(`${form.name} is aangemaakt.`);
    setForm({ email: "", name: "", password: "", role: "service" });
    setOpen(false);
    load();
  }

  async function toggleActive(user: Profile) {
    await supabase.from("profiles").update({ active: !user.active }).eq("id", user.id);
    load();
  }

  async function changeRole(id: string, role: Role) {
    await supabase.from("profiles").update({ role }).eq("id", id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medewerkers</h1>
          <p className="text-[--muted-foreground] mt-1 text-sm">Beheer accounts, rollen en toegang.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />Medewerker toevoegen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nieuwe medewerker</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Naam</Label>
                <Input placeholder="Voor- en achternaam" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>E-mailadres</Label>
                <Input type="email" placeholder="naam@voorbeeld.nl" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Tijdelijk wachtwoord</Label>
                <Input type="password" placeholder="Min. 8 tekens" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Bediening</SelectItem>
                    <SelectItem value="kitchen">Keuken</SelectItem>
                    <SelectItem value="admin">Beheerder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-[--destructive]">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Aanmaken…" : "Aanmaken"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">{success}</p>}

      <Card>
        <CardHeader><CardTitle>{users.length} medewerkers</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[--border] bg-[--muted]">
                  <th className="px-4 py-3 text-left font-medium text-[--muted-foreground]">Naam</th>
                  <th className="px-4 py-3 text-left font-medium text-[--muted-foreground]">Rol</th>
                  <th className="px-4 py-3 text-left font-medium text-[--muted-foreground]">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-[--muted-foreground]">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {users.map((u) => (
                  <tr key={u.id} className={`${!u.active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[--primary] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {u.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={u.role} onValueChange={(v) => changeRole(u.id, v as Role)}>
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service">Bediening</SelectItem>
                          <SelectItem value="kitchen">Keuken</SelectItem>
                          <SelectItem value="admin">Beheerder</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.active ? "available" : "off"}>{u.active ? "Actief" : "Inactief"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(u)} title={u.active ? "Deactiveren" : "Activeren"}>
                        {u.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
