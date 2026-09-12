"use client";

/**
 * App Template Contract v1 §5 — route binding.
 *
 * Thin by design: it resolves URL state and hands the L1 screen the props it
 * already took, so screens stay independent of the router.
 */
import { useStoredKey } from "@/lib/fretlab/useStoredKey";
import { useFretLabNav } from "@/app/_screens/useFretLabNav";
import { RoutineDetail } from "@/app/_screens/RoutineDetail";

export default function Page() {
  const nav = useFretLabNav();
  const [selectedKey] = useStoredKey();
  return <RoutineDetail go={nav.go} sessionKey={selectedKey} />;
}
