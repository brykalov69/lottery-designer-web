# services/ai_engine.py

import itertools
from typing import Optional, List, Dict

from .history import filter_history, build_analysis


def _compute_recent_freq(filtered_hist, window_size: int = 50):
    if not filtered_hist:
        return {}

    window = filtered_hist[-window_size:]
    freq: Dict[int, int] = {}
    for rec in window:
        for n in rec["balls"]:
            freq[n] = freq.get(n, 0) + 1
    return freq


def _compute_ai_numbers(filtered_hist, analysis):
    ball_freq: Dict[int, int] = analysis["balls"]
    if not ball_freq:
        return {}

    total_draws = len(filtered_hist)
    if total_draws == 0:
        return {}

    max_total = max(ball_freq.values()) if ball_freq else 1

    recent_window = min(50, total_draws)
    recent_freq = _compute_recent_freq(filtered_hist, window_size=recent_window)

    ai_numbers: Dict[str, Dict] = {}

    for n, total in ball_freq.items():
        recent = recent_freq.get(n, 0)

        total_norm = total / max_total if max_total > 0 else 0.0
        avg_per_draw = total / total_draws if total_draws > 0 else 0.0
        recent_rate = recent / recent_window if recent_window > 0 else 0.0

        diff = recent_rate - avg_per_draw

        if diff > 0.01 and recent_rate > avg_per_draw * 1.5:
            trend = "hot"
        elif diff > 0.005:
            trend = "rising"
        elif diff < -0.01 and recent_rate < avg_per_draw * 0.5:
            trend = "cold"
        elif diff < -0.005:
            trend = "cooling"
        else:
            trend = "stable"

        base_score = int(total_norm * 80)
        bonus = 0
        if trend == "hot":
            bonus = 15
        elif trend == "rising":
            bonus = 7
        elif trend == "cooling":
            bonus = -5
        elif trend == "cold":
            bonus = -10

        score = max(0, min(100, base_score + bonus))

        ai_numbers[str(n)] = {
            "score": score,
            "trend": trend,
            "total": total,
            "recent": recent,
        }

    return ai_numbers


def _find_recommended_triplets(filtered_hist, triplets_dict, top_n: int = 20):
    if not triplets_dict:
        return []

    items = sorted(triplets_dict.items(), key=lambda x: x[1], reverse=True)
    items = items[:top_n]

    result = []
    for key, hits in items:
        nums = list(map(int, key.split(",")))
        set_nums = set(nums)

        last_seen = None
        for idx_from_end, rec in enumerate(reversed(filtered_hist)):
            if set_nums.issubset(rec["balls"]):
                last_seen = idx_from_end
                break

        result.append(
            {
                "combo": nums,
                "hits": hits,
                "last_draws_ago": last_seen,
            }
        )

    return result


def _compute_patterns(filtered_hist):
    if not filtered_hist:
        return {
            "dominant_ranges": [],
            "sequences": [],
            "avg_sum": 0.0,
            "draws": 0,
        }

    ranges = [
        (1, 10),
        (11, 20),
        (21, 30),
        (31, 40),
        (41, 50),
        (51, 60),
        (61, 70),
        (71, 80),
    ]
    range_counts = {f"{a}-{b}": 0 for (a, b) in ranges}

    seq_freq: Dict[str, int] = {}
    sum_total = 0
    draws = 0

    for rec in filtered_hist:
        balls = sorted(rec["balls"])
        draws += 1
        sum_total += sum(balls)

        for n in balls:
            for (a, b) in ranges:
                if a <= n <= b:
                    range_counts[f"{a}-{b}"] += 1
                    break

        for i in range(len(balls) - 1):
            if balls[i + 1] == balls[i] + 1:
                pair = f"{balls[i]}-{balls[i+1]}"
                seq_freq[pair] = seq_freq.get(pair, 0) + 1

    seq_items = sorted(seq_freq.items(), key=lambda x: x[1], reverse=True)
    seq_items = [{"pair": k, "count": v} for (k, v) in seq_items if v >= 2]

    dom_ranges = sorted(range_counts.items(), key=lambda x: x[1], reverse=True)

    return {
        "dominant_ranges": [
            {"range": r, "count": c} for (r, c) in dom_ranges if c > 0
        ],
        "sequences": seq_items,
        "avg_sum": (sum_total / draws) if draws > 0 else 0.0,
        "draws": draws,
    }


def _compute_risk_numbers(ai_numbers: Dict[str, Dict]):
    overheated = []
    overcold = []

    for s_num, info in ai_numbers.items():
        score = info["score"]
        trend = info["trend"]

        if trend == "hot" and score >= 85:
            overheated.append(int(s_num))
        if trend in ("cold", "cooling") and score <= 20:
            overcold.append(int(s_num))

    return {
        "overheated": sorted(overheated),
        "overcold": sorted(overcold),
    }


def build_ai_insights(
    min_num: Optional[int] = None,
    max_num: Optional[int] = None,
    last_n: Optional[int] = None,
    years: Optional[List[int]] = None,
    range_mode: str = "global",
    per_ball_ranges: Optional[Dict[int, Dict[str, Optional[int]]]] = None,
):
    filtered = filter_history(
        min_num=min_num,
        max_num=max_num,
        last_n=last_n,
        years=years,
        range_mode=range_mode,
        per_ball_ranges=per_ball_ranges,
    )

    if not filtered:
        return {
            "ai_numbers": {},
            "recommended_triplets": [],
            "risk_numbers": {"overheated": [], "overcold": []},
            "patterns": {
                "dominant_ranges": [],
                "sequences": [],
                "avg_sum": 0.0,
                "draws": 0,
            },
        }

    analysis = build_analysis(
        min_num=min_num,
        max_num=max_num,
        last_n=last_n,
        years=years,
        range_mode=range_mode,
        per_ball_ranges=per_ball_ranges,
    )

    ai_numbers = _compute_ai_numbers(filtered, analysis)
    recommended_triplets = _find_recommended_triplets(filtered, analysis["triplets"])
    patterns = _compute_patterns(filtered)
    risk_numbers = _compute_risk_numbers(ai_numbers)

    return {
        "ai_numbers": ai_numbers,
        "recommended_triplets": recommended_triplets,
        "risk_numbers": risk_numbers,
        "patterns": patterns,
    }
