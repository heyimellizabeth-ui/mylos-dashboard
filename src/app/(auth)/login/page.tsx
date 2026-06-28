"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !cardRef.current) return;
    import("animejs").then(({ animate }) => {
      animate(cardRef.current!, {
        opacity: [0, 1],
        translateY: [-16, 0],
        duration: 480,
        ease: "outQuart",
      });
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Onjuist e-mailadres of wachtwoord.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--background] p-4">
      <div ref={cardRef} className="w-full max-w-sm opacity-0">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-[--primary] flex items-center justify-center">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mylos Rooster</h1>
            <p className="text-sm text-[--muted-foreground]">Restaurant Alkmaar</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[--border] bg-[--card] p-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-1">Inloggen</h2>
          <p className="text-sm text-[--muted-foreground] mb-6">Voer je gegevens in om verder te gaan</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                placeholder="naam@restaurant.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-[--destructive] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Bezig met inloggen…" : "Inloggen"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[--muted-foreground]">
            Geen account? Vraag een beheerder om je toe te voegen.
          </p>
        </div>
      </div>
    </div>
  );
}
