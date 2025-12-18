// frontend/src/api/history.ts

const API_BASE = import.meta.env.VITE_API_URL;

export async function uploadHistory(payload: {
  text: string;
  file_b64?: string | null;
  filetype?: string | null;
  main_count: number;
  extra_count: number;
  has_extra: boolean;
}) {
  const res = await fetch(`${API_BASE}/history/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "History upload failed");
  }

  return await res.json();
}
