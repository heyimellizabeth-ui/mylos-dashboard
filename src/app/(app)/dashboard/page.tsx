import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ClipboardList, ArrowLeftRight, Megaphone } from "lucide-react";
import { getWeekDates, toISODate, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, schedulesRes, timeOffRes, swapsRes, announcementsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("schedules").select("*").eq("employee_id", user.id).gte("date", toISODate(new Date())).order("date").limit(7),
    supabase.from("time_off_requests").select("*").eq("employee_id", user.id).eq("status", "pending").order("created_at", { ascending: false }),
    supabase.from("shift_swap_requests").select("*").or(`requester_id.eq.${user.id},target_employee_id.eq.${user.id}`).eq("status", "pending"),
    supabase.from("announcements").select("*, author:profiles(name)").order("created_at", { ascending: false }).limit(3),
  ]);

  const profile = profileRes.data;
  const upcomingShifts = schedulesRes.data ?? [];
  const pendingTimeOff = timeOffRes.data ?? [];
  const pendingSwaps = swapsRes.data ?? [];
  const announcements = announcementsRes.data ?? [];

  const weekDates = getWeekDates();
  const todayStr = toISODate(new Date());
  const todayShift = upcomingShifts.find((s) => s.date === todayStr);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Goedemorgen, {profile?.name?.split(" ")[0]} 👋</h1>
        <p className="text-[--muted-foreground] mt-1">Hier is je overzicht voor vandaag.</p>
      </div>

      {/* Today's shift */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[--primary]" />
            <CardTitle>Vandaag</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {todayShift ? (
            <div className="flex items-center gap-3">
              {todayShift.status === "v" && todayShift.shift_start ? (
                <Badge variant="shift" className="text-sm px-3 py-1">
                  {todayShift.shift_start.slice(0, 5)}{todayShift.shift_end ? `–${todayShift.shift_end.slice(0, 5)}` : ""}
                </Badge>
              ) : todayShift.status === "v" ? (
                <Badge variant="available" className="text-sm px-3 py-1">Aanwezig</Badge>
              ) : todayShift.status === "x" ? (
                <Badge variant="off" className="text-sm px-3 py-1">Vrije dag</Badge>
              ) : (
                <Badge variant="vacation" className="text-sm px-3 py-1">Vakantie</Badge>
              )}
              {todayShift.notes && <p className="text-sm text-[--muted-foreground]">{todayShift.notes}</p>}
            </div>
          ) : (
            <p className="text-[--muted-foreground] text-sm">Geen rooster ingevoerd voor vandaag.</p>
          )}
        </CardContent>
      </Card>

      {/* This week */}
      <Card>
        <CardHeader>
          <CardTitle>Deze week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((d) => {
              const ds = toISODate(d);
              const s = upcomingShifts.find((x) => x.date === ds);
              const isToday = ds === todayStr;
              return (
                <div key={ds} className={`rounded-lg p-2 text-center ${isToday ? "bg-[--primary]/10 ring-1 ring-[--primary]" : "bg-[--muted]"}`}>
                  <p className="text-[10px] text-[--muted-foreground]">{formatDate(d).split(" ")[0]}</p>
                  <p className="text-sm font-semibold">{d.getDate()}</p>
                  <div className="mt-1">
                    {s?.status === "v" ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mx-auto" />
                    ) : s?.status === "x" ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-red-400 mx-auto" />
                    ) : s?.status === "vak" ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mx-auto" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-[--border] mx-auto" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-[--muted-foreground]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Aanwezig</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" />Vrij</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />Vakantie</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTimeOff.length}</p>
                <p className="text-xs text-[--muted-foreground]">Verlof in behandeling</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <ArrowLeftRight className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingSwaps.length}</p>
                <p className="text-xs text-[--muted-foreground]">Ruildiensten open</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[--primary]" />
              <CardTitle>Mededelingen</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.map((a) => (
              <div key={a.id} className="border-l-2 border-[--primary] pl-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{a.title}</p>
                  {a.target_role !== "all" && (
                    <Badge variant={a.target_role as "kitchen" | "service"} className="shrink-0">
                      {a.target_role === "kitchen" ? "Keuken" : "Bediening"}
                    </Badge>
                  )}
                </div>
                {a.body && <p className="text-sm text-[--muted-foreground] mt-1">{a.body}</p>}
                <p className="text-xs text-[--muted-foreground] mt-1">
                  {(a as { author?: { name: string } }).author?.name} · {new Date(a.created_at).toLocaleDateString("nl-NL")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
