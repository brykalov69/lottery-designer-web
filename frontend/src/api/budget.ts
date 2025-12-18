// frontend/src/api/budget.ts
const API_BASE = import.meta.env.VITE_API_URL;

export async function runBudget(payload: any) {
    const res = await fetch(`${API_BASE}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        throw new Error("Budget request failed");
    }
    return res.json();
}
