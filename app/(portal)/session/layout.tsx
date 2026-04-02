import type { ReactNode } from "react";

export default function SessionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full flex flex-col">
      {children}
    </div>
  );
}
