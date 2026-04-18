"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function BrainDumpError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[brain dump error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <h2 className="font-cinzel text-xl text-foreground">Brain dump unavailable</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        {error.message || "The brain dump pipeline encountered an error. Check that AllKnower is running."}
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
