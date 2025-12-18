// frontend/src/api/greedy.ts
const API_BASE = import.meta.env.VITE_API_URL;

export async function runGreedy(payload: any) {
    const res = await fetch(`${API_BASE}/greedy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Greedy request failed");
    return res.json();
}
