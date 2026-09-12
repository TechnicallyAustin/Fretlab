"use client";

/**
 * App Template Contract v1 §5 — route binding.
 *
 * Thin by design: it resolves URL state and hands the L1 screen the props it
 * already took, so screens stay independent of the router.
 */
import { useParams } from "next/navigation";
import { useStoredKey } from "@/lib/fretlab/useStoredKey";
import { useFretLabNav } from "@/app/_screens/useFretLabNav";
import { DrillDetail } from "@/app/_screens/DrillDetail";

export default function Page() {
  const nav = useFretLabNav();
  const [selectedKey] = useStoredKey();
  const id = String(useParams().drillId ?? "");
  return <DrillDetail go={nav.go} sessionKey={selectedKey} drillId={id} />;
}
