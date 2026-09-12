"use client";

/**
 * Router-backed navigation, supplied to screens as the plain `go` callback they
 * already took.
 *
 * §5 keeps the router in L1. Screens, sections and elements stay portable: they
 * receive a function and call it, exactly as they did when views were state.
 */
import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { View } from "@/lib/fretlab/types";
import { hrefForView, viewForPath } from "@/lib/fretlab/routes";

export type Navigate = (view: View, id?: string) => void;

export function useFretLabNav(): { view: View; go: Navigate } {
  const router = useRouter();
  const pathname = usePathname();

  const go = useCallback<Navigate>(
    (view, id) => {
      router.push(hrefForView(view, id));
      // The frame is a fixed-height phone shell, so each screen starts at the
      // top the way it did when views were swapped in place.
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router],
  );

  return { view: viewForPath(pathname), go };
}
