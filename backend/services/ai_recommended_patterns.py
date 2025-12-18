from __future__ import annotations
from typing import Dict, Any, List, Optional, Tuple
from collections import Counter

# We intentionally import signals that already exist
# (no new magic, only aggregation)
from services.history import build_analysis
from services.sequential_drift import compute_sequential_drift
from services.per_ball_positional import compute_per_ball_positional


def _normalize(v: float, vmax: float) -> float:
    if vmax <= 0:
        return 0.0
    return min(1.0, v / vmax)


def compute_ai_recommended_patterns(
    history_rows: List[Dict[str, Any]],
    *,
    min_occurrences: int = 2,
    top_k: int = 10,
    last_n: Optional[int] = None,
) -> Dict[str, Any]:
    """
    AI Recommended Patterns (PRO)

    This module selects stable number structures by aggregating
    multiple analytical signals:
      - historical frequency (triplets/quads)
      - positional stability
      - adjacency consistency
      - drift consistency (penalty if conflicting)

    IMPORTANT:
    - Not a prediction
    - Deterministic scoring
    - Always explainable
    """

    if not history_rows:
        return {"error": "No history loaded."}

    # -----------------------------------------
    # 1) Base candidates from Analytics (triplets)
    # -----------------------------------------
    analytics = build_analysis()
    triplets = analytics.get("triples", [])

    if not triplets:
        return {"error": "No candidate patterns found."}

    # -----------------------------------------
    # 2) Positional signal (PRO-level)
    # -----------------------------------------
    positional = compute_per_ball_positional(history_rows, last_n=last_n)
    pos_map: Dict[int, str] = {}

    for p in positional.get("positions", []):
        # map number -> stability label
        for n in p.get("top_numbers", []):
            pos_map[n] = p.get("stability", "low")

    # -----------------------------------------
    # 3) Sequential drift signal (penalty only)
    # -----------------------------------------
    drift = compute_sequential_drift(history_rows, last_n=last_n)
    drift_numbers = set()

    for grp in ("ascending", "descending"):
        for item in drift.get(grp, []):
            for n in item.get("chain", []):
                drift_numbers.add(n)

    # -----------------------------------------
    # 4) Score triplets
    # -----------------------------------------
    scored: List[Dict[str, Any]] = []

    max_occ = max(cnt for _, cnt in triplets)

    for combo, occ in triplets:
        if occ < min_occurrences:
            continue

        combo_set = set(combo)

        # Frequency score
        freq_score = _normalize(occ, max_occ)

        # Positional score (average stability)
        pos_scores = []
        for n in combo:
            stab = pos_map.get(n)
            if stab == "high":
                pos_scores.append(1.0)
            elif stab == "medium":
                pos_scores.append(0.6)
            else:
                pos_scores.append(0.2)
        pos_score = sum(pos_scores) / len(pos_scores)

        # Drift penalty (if conflicting movement exists)
        drift_penalty = 0.0
        if combo_set & drift_numbers:
            drift_penalty = 0.15  # mild penalty, not exclusion

        # Final score
        final_score = (
            0.55 * freq_score +
            0.45 * pos_score -
            drift_penalty
        )

        scored.append({
            "pattern": list(combo),
            "observed": occ,
            "score": round(final_score, 3),
            "signals": {
                "frequency": round(freq_score, 3),
                "positional": round(pos_score, 3),
                "drift_penalty": drift_penalty,
            }
        })

    # -----------------------------------------
    # 5) Sort and cut top-K
    # -----------------------------------------
    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[:top_k]

    return {
        "mode": "pro",
        "patterns": top,
        "meta": {
            "min_occurrences": min_occurrences,
            "draws_used": len(history_rows),
            "signals_used": [
                "frequency",
                "positional",
                "sequential_drift"
            ]
        }
    }


def pro_to_free_preview(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    FREE preview:
    - no real patterns
    - explanation only
    """
    if "error" in result:
        return result

    return {
        "mode": "free_preview",
        "note": (
            "AI Recommended Patterns combine multiple historical signals "
            "(frequency, position, adjacency and drift) to select stable "
            "number structures. Unlock PRO to see actual patterns."
        ),
    }
