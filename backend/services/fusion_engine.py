from __future__ import annotations
from typing import Dict, Any, List
from statistics import mean

# Import existing signals
from services.ai_recommended_patterns import compute_ai_recommended_patterns
from services.per_ball_positional import compute_per_ball_positional
from services.sequential_drift import compute_sequential_drift
from services.history import build_analysis


def compute_fusion_ranking(
    history_rows: List[Dict[str, Any]],
    *,
    top_k: int = 10,
) -> Dict[str, Any]:
    """
    Fusion Engine for Next Draw Predictor (PRO)

    Produces a ranked list of candidates using multiple AI signals.
    Deterministic, explainable, and composable.
    """

    if not history_rows:
        return {"error": "No history loaded."}

    # -----------------------------------------
    # 1) Base candidates (AI Recommended Patterns)
    # -----------------------------------------
    patterns_res = compute_ai_recommended_patterns(history_rows)
    patterns = patterns_res.get("patterns", [])

    if not patterns:
        return {"error": "No candidate patterns available."}

    # -----------------------------------------
    # 2) Positional signal
    # -----------------------------------------
    positional_res = compute_per_ball_positional(history_rows)
    pos_map = {}

    for p in positional_res.get("positions", []):
        for n in p.get("top_numbers", []):
            if p["stability"] == "high":
                pos_map[n] = 1.0
            elif p["stability"] == "medium":
                pos_map[n] = 0.6
            else:
                pos_map[n] = 0.3

    # -----------------------------------------
    # 3) Drift signal (penalty)
    # -----------------------------------------
    drift_res = compute_sequential_drift(history_rows)
    drift_numbers = set()

    for grp in ("ascending", "descending"):
        for item in drift_res.get(grp, []):
            for n in item.get("chain", []):
                drift_numbers.add(n)

    # -----------------------------------------
    # 4) Frequency baseline
    # -----------------------------------------
    analytics = build_analysis()
    freq_map = {}

    for combo, occ in analytics.get("triples", []):
        for n in combo:
            freq_map[n] = freq_map.get(n, 0) + occ

    max_freq = max(freq_map.values()) if freq_map else 1

    # -----------------------------------------
    # 5) Fuse scores
    # -----------------------------------------
    ranked = []

    for item in patterns:
        combo = item["pattern"]

        # Frequency score (normalized)
        freq_scores = [_safe_norm(freq_map.get(n, 0), max_freq) for n in combo]
        freq_score = mean(freq_scores)

        # Positional score
        pos_scores = [pos_map.get(n, 0.3) for n in combo]
        pos_score = mean(pos_scores)

        # Drift penalty
        drift_penalty = 0.0
        if set(combo) & drift_numbers:
            drift_penalty = 0.15

        # Final fusion score
        fusion_score = (
            0.45 * freq_score +
            0.35 * pos_score +
            0.20 * item["score"] -
            drift_penalty
        )

        ranked.append({
            "pattern": combo,
            "fusion_score": round(fusion_score, 3),
            "rank_breakdown": {
                "frequency": round(freq_score, 3),
                "positional": round(pos_score, 3),
                "pattern_score": round(item["score"], 3),
                "drift_penalty": drift_penalty,
            }
        })

    # -----------------------------------------
    # 6) Sort and return
    # -----------------------------------------
    ranked.sort(key=lambda x: x["fusion_score"], reverse=True)

    return {
        "mode": "pro",
        "candidates": ranked[:top_k],
        "signals_used": [
            "frequency",
            "heatmap",
            "adjacency",
            "sequential_drift",
            "per_ball_positional",
            "ai_patterns"
        ],
    }


def _safe_norm(v: float, vmax: float) -> float:
    if vmax <= 0:
        return 0.0
    return min(1.0, v / vmax)
