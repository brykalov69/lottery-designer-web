const API_BASE = "http://127.0.0.1:8000";

/**
 * Lottery System Generator
 * (used by Generator.tsx)
 */
export async function generateSystem(payload: any) {
  const res = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Generation failed");
  }

  return res.json();
}

/**
 * Smart Budget Optimizer
 */
export async function runBudget(payload: {
  numbers: number[];
  ticketCount: number;
}) {
  const res = await fetch(`${API_BASE}/ai_budget`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Budget optimization failed");
  }

  return res.json();
}
