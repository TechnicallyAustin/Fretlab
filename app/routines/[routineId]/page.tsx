"use client";

/** Dynamic routine detail: the URL and the screen now describe the same plan. */
import { useParams } from "next/navigation";
import { useStoredKey } from "@/lib/fretlab/useStoredKey";
import { useFretLabNav } from "@/app/_screens/useFretLabNav";
import { RoutineDetail } from "@/app/_screens/RoutineDetail";

export default function Page() {
  const nav = useFretLabNav();
  const [selectedKey, setSelectedKey] = useStoredKey();
  const routineId = String(useParams().routineId ?? "");
  return (
    <RoutineDetail
      go={nav.go}
      sessionKey={selectedKey}
      onAdoptKey={setSelectedKey}
      routineId={routineId}
    />
  );
}
