// frontend/src/api/budget.ts
const API = "http://localhost:8000";

export async function runBudget(payload: any) {
    const res = await fetch(`${API}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        throw new Error("Budget request failed");
    }
    return res.json();
}
