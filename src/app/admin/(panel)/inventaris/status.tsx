import { Badge } from "@/components/ui";
import { CONDITION_INFO, type Condition, type ServiceState } from "@/lib/inventory";
import { formatDate } from "@/lib/utils";

export function ConditionBadge({ c }: { c: Condition }) {
  return <Badge tone={CONDITION_INFO[c].tone}>{CONDITION_INFO[c].label}</Badge>;
}

export function ServiceBadge({ s }: { s: ServiceState }) {
  if (!s) return null;
  if (s.state === "terlambat") return <Badge tone="danger">Servis terlambat {Math.abs(s.days)} hari</Badge>;
  if (s.state === "segera") return <Badge tone="warn">Servis {s.days === 0 ? "hari ini" : `${s.days} hari lagi`}</Badge>;
  return <span className="text-xs text-muted">Servis berikutnya {formatDate(s.due)}</span>;
}
