"use client";

type TrackProperties = Record<string, string | number | boolean | null | undefined>;

export function useTrack() {
  return function track(
    event: string,
    properties?: TrackProperties
  ): void {
    if (typeof event !== "string" || !event.trim()) return;
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        event: event.trim(),
        properties: properties && typeof properties === "object" ? properties : undefined,
      }),
    }).catch(() => {});
  };
}
