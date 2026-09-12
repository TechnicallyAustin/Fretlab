"use client";

/**
 * App Template Contract v1 §5 — route binding.
 */
import { useFretLabNav } from "@/app/_screens/useFretLabNav";
import { SignIn } from "@/app/_screens/SignIn";

export default function Page() {
  const nav = useFretLabNav();
  return <SignIn go={nav.go} />;
}
