import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type SurfaceProps<T extends ElementType> = {
  as?: T;
  corner?: "default" | "top-left" | "top-right" | "bottom-left";
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function Surface<T extends ElementType = "section">({ as, corner = "default", className = "", children, ...props }: SurfaceProps<T>) {
  const Component = as ?? "section";
  return <Component className={`ds-surface ds-corner-${corner} ${className}`.trim()} {...props}>{children}</Component>;
}
