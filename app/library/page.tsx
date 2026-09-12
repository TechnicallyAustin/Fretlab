"use client";

/** App Template Contract v1 §5 — route binding. */
import { useFretLabNav } from "@/app/_screens/useFretLabNav";
import { Library } from "@/app/_screens/Library";

export default function Page() {
  const { go } = useFretLabNav();
  return <Library go={go} />;
}
