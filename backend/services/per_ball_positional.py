from __future__ import annotations
from typing import Dict, Any, List, Optional
from collections import Counter, defaultdict
from statistics import pstdev

def compute_per_ball_positional(
    history_rows: List[Dict[str, Any]],
    *,
    top_k: int = 3,
    hot_quantile: float = 0.75,  # верхний квартиль как "hot band"
    last_n: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Per-Ball Positional AI:
    - analyzes number behavior by position within a draw
    - draws are assumed to contain MAIN balls only
    - positions are 1-based (Position 1, Position 2, ...)

    Returns for each position:
      - hot_range (min/max of numbers in hot band)
      - top_numbers (top_k frequent)
      - stability (low/medium/high) based on dispersion
      - stats (counts)
    """

    if not history_rows:
        return {"error": "No history loaded."}

    # Order rows as-is (history already stabilized earlier)
    rows = history_rows
    if last_n and last_n > 0 and len(rows) > last_n:
        rows = rows[-last_n:]

    # Build positional buckets
    # pos_index -> list of numbers seen at that position
    buckets: Dict[int, List[int]] = defaultdict(list)

    for r in rows:
        nums = r.get("main", [])
        for idx, val in enumerate(nums):
            if isinstance(val, int):
                buckets[idx].append(val)

    if not buckets:
        return {"error": "No positional data found."}

    result_positions = []

    for pos_idx in sorted(buckets.keys()):
        values = buckets[pos_idx]
        if not values:
            continue

        freq = Counter(values)
        total = sum(freq.values())

        # Top-K numbers
        top_numbers = [n for n, _ in freq.most_common(top_k)]

        # Hot band by quantile on frequency
        counts = list(freq.values())
        counts_sorted = sorted(counts)
        q_index = int(len(counts_sorted) * hot_quantile)
        q_index = min(q_index, len(counts_sorted) - 1)
        hot_threshold = counts_sorted[q_index]

        hot_nums = [n for n, c in freq.items() if c >= hot_threshold]
        hot_range = {
            "min": min(hot_nums) if hot_nums else None,
            "max": max(hot_nums) if hot_nums else None,
        }

        # Stability: based on dispersion (population std dev)
        # lower std dev => more stable positional behavior
        stdev = pstdev(values) if len(values) > 1 else 0.0
        if stdev < 5:
            stability = "high"
        elif stdev < 9:
            stability = "medium"
        else:
            stability = "low"

        result_positions.append({
            "position": pos_idx + 1,  # 1-based
            "total_draws": total,
            "top_numbers": top_numbers,
            "hot_range": hot_range,
            "stability": stability,
            "stats": {
                "unique_numbers": len(freq),
                "std_dev": round(stdev, 2),
            },
        })

    return {
        "mode": "pro",
        "positions": result_positions,
        "top_k": top_k,
        "hot_quantile": hot_quantile,
        "draws_used": len(rows),
    }


def pro_to_free_preview(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    FREE preview:
    - show only Position 1
    - hide detailed stats
    """
    if "error" in result:
        return result

    positions = result.get("positions", [])
    if not positions:
        return {"error": "No positional data available."}

    p1 = positions[0]

    return {
        "mode": "free_preview",
        "draws_used": result.get("draws_used"),
        "position": {
            "position": p1["position"],
            "hot_range": p1["hot_range"],
            "top_numbers": p1["top_numbers"][:1],  # single example
            "stability": p1["stability"],
        },
        "note": "Unlock PRO to analyze all positions and detailed stability metrics.",
    }
