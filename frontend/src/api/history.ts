// frontend/src/api/history.ts

const API_BASE = import.meta.env.VITE_API_URL;

export async function uploadHistory(payload: {
  text: string;
  fmt: string;          // "txt" | "csv" | "xlsx"
  main_count: number;
  extra_count: number;
}) {
  const res = await fetch(`${API_BASE}/history/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("History upload failed");
  return await res.json();
}

export async function fetchHistory() {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error("History fetch failed");
  return await res.json();
}
