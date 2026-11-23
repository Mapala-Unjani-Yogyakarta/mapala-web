import { redirect } from "next/navigation";
import { getCurrentPeriod } from "@/lib/data";

export default async function PengurusPage() {
  const period = await getCurrentPeriod();
  redirect(period ? `/periode/${period.slug}` : "/periode");
}
