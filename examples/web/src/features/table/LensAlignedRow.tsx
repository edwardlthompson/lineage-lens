import { type ReactNode } from "react";

/** Table body row. Lens-height sync runs once for visible rows from the grid. */
export function LensAlignedRow({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <tr className={className}>{children}</tr>;
}
