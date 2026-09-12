"use client";

/**
 * App Template Contract v1 §5 — route binding.
 *
 * Thin by design: it resolves URL state and hands the L1 screen the props it
 * already took, so screens stay independent of the router.
 */
import { useParams } from "next/navigation";
import { useFretLabNav } from "@/app/_screens/useFretLabNav";
import { ChordDetail } from "@/app/_screens/ChordDetail";

export default function Page() {
  const nav = useFretLabNav();
  const id = String(useParams().chordId ?? "");
  return <ChordDetail go={nav.go} chordId={id} />;
}
