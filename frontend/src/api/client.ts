export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

import type { DiscoverResponse } from "../types/discovery";

export async function discoverProblem(problem: string): Promise<DiscoverResponse> {
  const res = await fetch(`${API_BASE_URL}/api/discover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem }),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to fetch");

  return result as DiscoverResponse;
}
