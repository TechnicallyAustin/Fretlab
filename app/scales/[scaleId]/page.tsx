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
import { ScaleLibraryDetail } from "@/app/_screens/ScaleLibraryDetail";

export default function Page() {
  const nav = useFretLabNav();
  const [selectedKey] = useStoredKey();
  const id = String(useParams().scaleId ?? "");
  return <ScaleLibraryDetail go={nav.go} selectedKey={selectedKey} scaleId={id} />;
}
