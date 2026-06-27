import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { email, name, password, role } = await req.json();

  if (!email || !name || !password || !role) {
    return NextResponse.json({ error: "Alle velden zijn verplicht." }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });

  const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (caller?.role !== "admin") return NextResponse.json({ error: "Onvoldoende rechten." }, { status: 403 });

  // Create auth user
  const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authErr || !newUser.user) {
    return NextResponse.json({ error: authErr?.message ?? "Aanmaken mislukt." }, { status: 500 });
  }

  // Create profile
  const { error: profileErr } = await supabase.from("profiles").insert({
    id: newUser.user.id,
    name,
    role,
  });
  if (profileErr) {
    return NextResponse.json({ error: "Profiel aanmaken mislukt." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
