"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AIToolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ai tools error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <h2 className="font-cinzel text-xl text-foreground">AI tools unavailable</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        {error.message || "Could not load this AI tool. Verify that AllKnower is connected in Settings."}
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
