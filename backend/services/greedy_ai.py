# services/greedy_ai.py

from typing import List, Dict, Tuple
from services.history import build_analysis
from services.greedy import has_four_in_row


def ai_rank_greedy(system: List[List[int]], history_analysis: Dict) -> List[Dict]:
    """
    Assign AI scores to greedy combinations using:
    - frequency score
    - hot bonuses
    - cold penalties
    - synergy (triplets, quads)
    - penalty for 4-in-row
    """

    balls_freq = history_analysis["balls"]              # {number: count}
    triplets = history_analysis["triplets"]             # {"1,3,11": 2}
    quads = history_analysis["quads"]                   # {"3,11,24,30": 3}

    # Identify hot numbers (top 5)
    sorted_freq = sorted(balls_freq.items(), key=lambda x: x[1], reverse=True)
    hot_nums = {n for n, c in sorted_freq[:5]}

    # Identify cold numbers
    cold_nums = {n for n, c in balls_freq.items() if c == 1}

    # Convert triplets and quads to tuple form
    synergy_triplets = {tuple(map(int, k.split(","))) for k, v in triplets.items() if v >= 2}
    synergy_quads = {tuple(map(int, k.split(","))) for k, v in quads.items() if v >= 2}

    ranked = []

    for combo in system:
        combo_set = set(combo)
        score = 0
        reasons = []

        # 1. Frequency score
        freq_s = sum(balls_freq.get(n, 0) for n in combo)
        score += freq_s
        reasons.append(f"frequency={freq_s}")

        # 2. Hot bonus
        hot_in_combo = hot_nums & combo_set
        if hot_in_combo:
            score += len(hot_in_combo) * 10
            reasons.append(f"hot={list(hot_in_combo)}")

        # 3. Cold penalty
        cold_in_combo = cold_nums & combo_set
        if cold_in_combo:
            score -= len(cold_in_combo) * 8
            reasons.append(f"cold={list(cold_in_combo)}")

        # 4. Synergy triplets
        synerg_trip_score = 0
        for t in synergy_triplets:
            if set(t).issubset(combo_set):
                synerg_trip_score += 12
        score += synerg_trip_score
        if synerg_trip_score > 0:
            reasons.append(f"synergy_triplets={synerg_trip_score}")

        # 5. Synergy quads
        synerg_quad_score = 0
        for q in synergy_quads:
            if set(q).issubset(combo_set):
                synerg_quad_score += 20
        score += synerg_quad_score
        if synerg_quad_score > 0:
            reasons.append(f"synergy_quads={synerg_quad_score}")

        # 6. Penalty: four in a row
        if has_four_in_row(combo):
            score -= 25
            reasons.append("penalty=4-in-row")

        # Normalize (simple)
        ai_score = max(0, min(100, int(score / 3)))

        ranked.append({
            "combo": combo,
            "ai_score": ai_score,
            "reason": "; ".join(reasons)
        })

    # Sort highest first
    ranked_sorted = sorted(ranked, key=lambda x: x["ai_score"], reverse=True)

    return ranked_sorted
