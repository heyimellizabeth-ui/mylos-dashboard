import { Badge } from "@/components/ui/badge";
import type { Schedule } from "@/lib/types/database";

interface ShiftCellProps {
  schedule?: Schedule;
  isAdmin?: boolean;
  onClick?: () => void;
}

export function ShiftCell({ schedule, isAdmin, onClick }: ShiftCellProps) {
  if (!schedule) {
    return (
      <td
        className={`px-2 py-3 text-center ${isAdmin ? "cursor-pointer hover:bg-[--muted]" : ""}`}
        onClick={onClick}
      >
        <span className="text-xs text-[--muted-foreground]">—</span>
      </td>
    );
  }

  const { status, shift_start, shift_end } = schedule;

  let badge;
  if (status === "v") {
    if (shift_start) {
      const label = shift_end
        ? `${shift_start.slice(0, 5)}–${shift_end.slice(0, 5)}`
        : shift_start.slice(0, 5);
      badge = <Badge variant="shift" className="font-mono tracking-tight">{label}</Badge>;
    } else {
      badge = <Badge variant="available">Aanwezig</Badge>;
    }
  } else if (status === "x") {
    badge = <Badge variant="off">Vrij</Badge>;
  } else if (status === "vak") {
    badge = <Badge variant="vacation">Vakantie</Badge>;
  }

  return (
    <td
      className={`px-2 py-3 text-center whitespace-nowrap ${isAdmin ? "cursor-pointer hover:bg-[--muted]" : ""}`}
      onClick={onClick}
    >
      {badge}
    </td>
  );
}
