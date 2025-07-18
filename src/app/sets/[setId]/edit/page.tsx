"use client";

import { useParams } from "next/navigation";

// Placeholder for Set Editor
export default function SetEditor() {
  const { setId } = useParams() as { setId: string };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Set Editor</h1>
      <p className="text-muted-foreground">
        This will be the focused editing interface. Set ID: {setId}
      </p>
    </main>
  );
}
