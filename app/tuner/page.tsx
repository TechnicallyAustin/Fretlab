"use client";

/**
 * App Template Contract v1 §5 — route binding.
 *
 * Thin by design: it resolves URL state and hands the L1 screen the props it
 * already took, so screens stay independent of the router.
 */
import { useFretLabNav } from "@/app/_screens/useFretLabNav";
import { Tuner } from "@/app/_screens/Tuner";

export default function Page() {
  const nav = useFretLabNav();
  return <Tuner go={nav.go} />;
}
