// frontend/src/api/history.ts

const API = "http://localhost:8000";

export async function uploadHistory(payload: {
    text: string;
    fmt: string;          // "txt" | "csv" | "xlsx"
    main_count: number;
    extra_count: number;
}) {
    const res = await fetch(`${API}/upload_history`, {
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
    const res = await fetch(`${API}/history`);
    if (!res.ok) throw new Error("History fetch failed");
    return await res.json();
}
