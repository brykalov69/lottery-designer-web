# backend/services/ai_predictor.py
from __future__ import annotations
from typing import List, Dict, Optional
from math import sqrt
from services.history import filter_history
import random


def _build_number_stats(draws) -> Dict[int, Dict[str, float]]:
    """
    Build number statistics based on MAIN numbers in history.
    History format:
        { "date": "...", "year": 2025, "main": [...], "extra": [...] }
    """
    stats: Dict[int, Dict[str, float]] = {}
    total_draws = len(draws)

    if total_draws == 0:
        return stats

    for idx, d in enumerate(draws):
        main_numbers = d.get("main", [])
        for n in main_numbers:
            if n not in stats:
                stats[n] = {
                    "freq": 0,
                    "last_seen": -1,
                    "gap_sum": 0,
                    "gap_count": 0,
                    "prev_index": None,
                }

            s = stats[n]
            s["freq"] += 1

            if s["prev_index"] is not None:
                gap = idx - s["prev_index"]
                s["gap_sum"] += gap
                s["gap_count"] += 1

            s["prev_index"] = idx
            s["last_seen"] = idx

    # finalize stats
    for n, s in stats.items():
        if s["gap_count"] > 0:
            s["avg_gap"] = s["gap_sum"] / s["gap_count"]
        else:
            s["avg_gap"] = float("inf")

        if s["last_seen"] >= 0:
            s["recency_score"] = (s["last_seen"] + 1) / total_draws
        else:
            s["recency_score"] = 0.0

    return stats


def _normalize(values: List[float]) -> List[float]:
    if not values:
        return []
    mx = max(values)
    mn = min(values)
    if mx == mn:
        return [0.5] * len(values)
    return [(v - mn) / (mx - mn) for v in values]


def _combo_pattern_penalty(combo: List[int]) -> float:
    """
    Penalize bad patterns: too consecutive, small span, clustered.
    """
    c = sorted(combo)
    penalty = 0.0

    # 4 consecutive numbers → penalize strongly
    for i in range(len(c) - 3):
        if c[i+1] == c[i]+1 and c[i+2] == c[i]+2 and c[i+3] == c[i]+3:
            penalty += 2.0

    # Span-based penalty
    span = c[-1] - c[0]
    if span < 8:
        penalty += 1.0
    if span > 30:
        penalty += 0.5

    # low standard deviation → too clustered
    mean = sum(c) / len(c)
    var = sum((x - mean) ** 2 for x in c) / len(c)
    std = sqrt(var)
    if std < 3:
        penalty += 0.5

    return penalty


def score_combination(
    combo: List[int],
    number_stats: Dict[int, Dict[str, float]],
    global_min_freq: int,
    global_max_freq: int,
):
    freq_vals = []
    rarity_vals = []
    recency_vals = []
    gap_vals = []

    for n in combo:
        s = number_stats.get(n)

        if not s:
            # never appeared → very rare
            freq_vals.append(0.0)
            rarity_vals.append(1.0)
            recency_vals.append(0.0)
            gap_vals.append(1.0)
        else:
            f = s["freq"]
            freq_vals.append(float(f))

            rarity_vals.append(1.0 / (1.0 + float(f)))
            recency_vals.append(float(s["recency_score"]))

            if s["avg_gap"] == float("inf"):
                gap_vals.append(1.0)
            else:
                gap_vals.append(float(s["avg_gap"]))

    norm_freq   = _normalize(freq_vals)
    norm_rarity = rarity_vals
    norm_rec    = _normalize(recency_vals)
    norm_gap    = _normalize(gap_vals)

    hot_score     = sum(norm_freq) / len(norm_freq)
    rarity_score  = sum(norm_rarity) / len(norm_rarity)
    recency_score = sum(norm_rec) / len(norm_rec)
    gap_score     = sum(norm_gap) / len(norm_gap)

    pattern_penalty = _combo_pattern_penalty(combo)

    total_score = (
        0.4 * rarity_score +
        0.3 * recency_score +
        0.2 * gap_score +
        0.1 * (1 - pattern_penalty * 0.2)
    )

    return {
        "hot_score": hot_score,
        "rarity_score": rarity_score,
        "recency_score": recency_score,
        "gap_score": gap_score,
        "pattern_penalty": pattern_penalty,
        "total_score": total_score,
    }


def score_system(
    system: List[List[int]],
    min_num: Optional[int] = None,
    max_num: Optional[int] = None,
    last_n: Optional[int] = None,
    years: Optional[List[int]] = None,
):
    """
    Evaluate system using MAIN-number history.
    """
    draws = filter_history(
        min_num=min_num,
        max_num=max_num,
        last_n=last_n,
        years=years,
    )

    if not draws:
        return {"error": "No history data for given filters.", "combos": []}

    number_stats = _build_number_stats(draws)

    freqs = [s["freq"] for s in number_stats.values()] or [0]
    global_min_freq = min(freqs)
    global_max_freq = max(freqs)

    combo_results = []

    for combo in system:
        metrics = score_combination(
            combo,
            number_stats,
            global_min_freq,
            global_max_freq
        )
        combo_results.append({
            "combo": combo,
            **metrics,
        })

    combo_results_sorted = sorted(
        combo_results,
        key=lambda x: x["total_score"],
        reverse=True
    )

    return {
        "combos": combo_results_sorted,
        "stats": {
            "global_min_freq": global_min_freq,
            "global_max_freq": global_max_freq,
            "history_draws_used": len(draws),
        },
    }

# ==========================================================
# NEXT DRAW PREDICTOR (PHASE 7A: Fusion Engine)
# ==========================================================

from services.history import filter_history, compute_heatmap, compute_adjacency_analysis  # ensure these imports exist

def compute_next_draw_candidates(
    min_num: Optional[int] = None,
    max_num: Optional[int] = None,
    last_n: Optional[int] = None,
    years: Optional[List[int]] = None,
    limit: int = 20
) -> Dict:
    """
    Compute next-draw number candidates using fusion of:
      - global frequency (hotness)
      - rarity
      - recency
      - adjacency index
      - regional heatmap score

    Returns:
    {
      "candidates": [
         {
           "number": 23,
           "fusion_score": 0.812,
           "components": {
             "hot": ...,
             "rarity": ...,
             "recency": ...,
             "adjacency": ...,
             "region": ...
           }
         },
         ...
      ],
      "params": {...},
      "draws_used": N
    }
    """

    draws = filter_history(
        min_num=min_num,
        max_num=max_num,
        last_n=last_n,
        years=years,
    )

    if not draws:
        return {
            "error": "No history for next-draw prediction.",
            "candidates": []
        }

    # 1) Base number stats (freq, recency, avg_gap, etc.) on MAIN numbers
    number_stats = _build_number_stats(draws)
    if not number_stats:
        return {
            "error": "No MAIN numbers in history for prediction.",
            "candidates": []
        }

    # global min/max freq for normalization
    all_freqs = [s["freq"] for s in number_stats.values()] or [0]
    f_min, f_max = min(all_freqs), max(all_freqs)

    def norm_freq(f: float) -> float:
        if f_max == f_min:
            return 0.5
        return (f - f_min) / (f_max - f_min)

    # 2) Heatmap region scores
    heat = compute_heatmap(draws)
    region_scores: Dict[int, float] = {}

    if "segments" in heat:
        segments = heat["segments"]
        # Pre-fill region score for each number based on segment
        for seg in segments:
            a, b = seg["range"]
            sc = seg["score"]
            for n in range(a, b + 1):
                region_scores[n] = sc

    # 3) Adjacency index
    adj_data = compute_adjacency_analysis(draws)
    adj_index = adj_data.get("adjacency_index", {}) if isinstance(adj_data, dict) else {}

    # 4) Fusion scoring for each number
    fusion_list = []

    total_draws = len(draws)

    for n, s in number_stats.items():
        f = float(s["freq"])
        hot = norm_freq(f)  # 0..1
        rarity = 1.0 / (1.0 + f)       # чем меньше freq, тем выше rarity
        recency = float(s["recency_score"])  # уже 0..1
        region = region_scores.get(n, 0.5)   # если зона не найдена → нейтрально
        adjacency = float(adj_index.get(n, 0.5))

        # SIMPLE FUSION WEIGHTS (можно будет тюнить позже)
        # balanced profile: hot + recency + rarity + adjacency + region
        fusion_score = (
            0.20 * hot +
            0.20 * recency +
            0.20 * rarity +
            0.20 * adjacency +
            0.20 * region
        )

        fusion_list.append({
            "number": n,
            "fusion_score": round(fusion_score, 4),
            "components": {
                "hot": round(hot, 3),
                "recency": round(recency, 3),
                "rarity": round(rarity, 3),
                "adjacency": round(adjacency, 3),
                "region": round(region, 3),
            }
        })

    # sort by fusion_score desc
    fusion_sorted = sorted(fusion_list, key=lambda x: x["fusion_score"], reverse=True)

    # truncate limit
    if limit and limit > 0:
        fusion_sorted = fusion_sorted[:limit]

    return {
        "candidates": fusion_sorted,
        "params": {
            "min_num": min_num,
            "max_num": max_num,
            "last_n": last_n,
            "years": years,
            "limit": limit,
        },
        "draws_used": len(draws),
    }
# ==========================================================
# PHASE 7B — AI TICKET GENERATOR (DYNAMIC BALL_COUNT)
# ==========================================================

def compute_ai_tickets(
    min_num: Optional[int] = None,
    max_num: Optional[int] = None,
    last_n: Optional[int] = None,
    years: Optional[List[int]] = None,
) -> Dict:
    """
    Build AI-generated tickets using fusion-ranked candidates.
    Supports dynamic BALL_COUNT (based on history main length).

    Returns:
      {
        "tickets": {
            "aggressive": [...],
            "balanced": [...],
            "conservative": [...],
            "wildcard": [...]
        },
        "ball_count": BALL_COUNT,
        "draws_used": N
      }
    """

    # 1) Load draws to determine BALL_COUNT
    from services.history import filter_history

    draws = filter_history(min_num=min_num, max_num=max_num, last_n=last_n, years=years)
    if not draws:
        return {
            "error": "No history available for ticket generation.",
            "tickets": {}
        }

    first_main = draws[0].get("main", [])
    if not first_main:
        return {
            "error": "History has no main numbers for ticket generation.",
            "tickets": {}
        }

    BALL_COUNT = len(first_main)

    # 2) Get fusion candidates (reuse compute_next_draw_candidates)
    next_data = compute_next_draw_candidates(
        min_num=min_num,
        max_num=max_num,
        last_n=last_n,
        years=years,
        limit=80  # bigger pool for more diversity
    )

    if "error" in next_data and not next_data.get("candidates"):
        return {
            "error": next_data["error"],
            "tickets": {}
        }

    candidates = next_data.get("candidates", [])
    if not candidates:
        return {
            "error": "No fusion candidates found for ticket generation.",
            "tickets": {}
        }

    # Extract just numbers sorted by fusion_score desc
    numbers_sorted = [c["number"] for c in candidates]

    # Split into hot / mid / cold bands
    n_total = len(numbers_sorted)
    if n_total < BALL_COUNT:
        # fallback: use top BALL_COUNT numbers directly
        base_ticket = sorted(numbers_sorted[:BALL_COUNT])
        return {
            "tickets": {
                "aggressive": base_ticket,
                "balanced": base_ticket,
                "conservative": base_ticket,
                "wildcard": base_ticket,
            },
            "ball_count": BALL_COUNT,
            "draws_used": len(draws),
        }

    # define indices
    hot_cut = max(1, n_total // 3)       # top 1/3
    cold_cut = max(1, n_total // 3)      # bottom 1/3

    hot_pool = numbers_sorted[:hot_cut]
    mid_pool = numbers_sorted[hot_cut:n_total - cold_cut] if n_total - hot_cut - cold_cut > 0 else numbers_sorted[hot_cut:]
    cold_pool = numbers_sorted[-cold_cut:] if cold_cut > 0 else []

    def pick_unique_from(pool: List[int], k: int) -> List[int]:
        if not pool:
            return []
        if len(pool) <= k:
            return sorted(list(set(pool)))
        return sorted(random.sample(list(set(pool)), k))

    # 3) Build different ticket types

    # Aggressive: mostly hot numbers, slight mid
    k_hot = max(1, BALL_COUNT - 1)
    k_mid = BALL_COUNT - k_hot
    aggressive_ticket = pick_unique_from(hot_pool, k_hot)
    if len(aggressive_ticket) < BALL_COUNT and mid_pool:
        fill = pick_unique_from(mid_pool, BALL_COUNT - len(aggressive_ticket))
        aggressive_ticket = sorted(list(set(aggressive_ticket + fill)))

    aggressive_ticket = aggressive_ticket[:BALL_COUNT]

    # Balanced: mix hot / mid / cold
    if BALL_COUNT >= 5:
        b_hot = max(2, BALL_COUNT // 3)
        b_mid = max(1, BALL_COUNT // 3)
        b_cold = BALL_COUNT - b_hot - b_mid
        if b_cold < 0:
            b_cold = 0
    else:
        b_hot = max(1, BALL_COUNT - 2)
        b_mid = 1
        b_cold = BALL_COUNT - b_hot - b_mid
        if b_cold < 0:
            b_cold = 0

    balanced_ticket = (
        pick_unique_from(hot_pool, b_hot) +
        pick_unique_from(mid_pool, b_mid) +
        pick_unique_from(cold_pool, b_cold)
    )
    balanced_ticket = sorted(list(set(balanced_ticket)))[:BALL_COUNT]

    # Conservative: mostly mid + some cold, avoid extreme hot
    c_mid = max(1, BALL_COUNT - 1)
    c_cold = BALL_COUNT - c_mid
    conservative_ticket = (
        pick_unique_from(mid_pool if mid_pool else numbers_sorted, c_mid) +
        pick_unique_from(cold_pool, c_cold)
    )
    conservative_ticket = sorted(list(set(conservative_ticket)))[:BALL_COUNT]

    # Wildcard: draw from cold / rare zone + a couple from entire pool
    w_cold = max(1, BALL_COUNT // 2)
    w_any = BALL_COUNT - w_cold
    wildcard_ticket = (
        pick_unique_from(cold_pool if cold_pool else numbers_sorted, w_cold) +
        pick_unique_from(numbers_sorted, w_any)
    )
    wildcard_ticket = sorted(list(set(wildcard_ticket)))[:BALL_COUNT]

    tickets = {
        "aggressive": aggressive_ticket,
        "balanced": balanced_ticket,
        "conservative": conservative_ticket,
        "wildcard": wildcard_ticket,
    }

    return {
        "tickets": tickets,
        "ball_count": BALL_COUNT,
        "draws_used": len(draws),
    }

