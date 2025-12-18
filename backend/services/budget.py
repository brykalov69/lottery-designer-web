# backend/services/budget.py
from __future__ import annotations

from itertools import combinations
from typing import List, Dict, Optional, Tuple
from collections import Counter
import random

from .config import BALL_COUNT
from .greedy import has_four_in_row, _build_triple_universe


Triplet = Tuple[int, int, int]


def _triplet_counts_from_history(history_rows: List[List[int]]) -> Counter[Triplet]:
    cnt: Counter[Triplet] = Counter()
    for row in history_rows:
        if not row or len(row) < 3:
            continue
        nums = sorted(set(row))
        for t in combinations(nums, 3):
            cnt[t] += 1
    return cnt


# ==========================================================
# Smart Budget — Fixed number of tickets (DUAL MODE)
# ==========================================================

def budget_optimize_fixed_count(
    numbers: List[int],
    max_tickets: int,
    history_rows: Optional[List[List[int]]] = None,
) -> Dict:

    base = sorted(set(numbers))
    if max_tickets <= 0:
        return {
            "mode": "budget",
            "system": [],
            "system_size": 0,
            "coverage": 0.0,
            "triplets_total": 0,
            "triplets_covered": 0,
            "warning": "Ticket limit must be > 0"
        }

    # --------------------------------------------------
    # Generate candidate combinations
    # --------------------------------------------------
    candidates = [
        c for c in combinations(base, BALL_COUNT)
        if not has_four_in_row(c)
    ]

    if not candidates:
        return {
            "mode": "budget",
            "system": [],
            "system_size": 0,
            "coverage": 0.0,
            "triplets_total": 0,
            "triplets_covered": 0,
            "warning": "No valid combinations found"
        }

    # --------------------------------------------------
    # MODE A — History-aware (triplet-frequency ranked)
    # --------------------------------------------------
    if history_rows and len(history_rows) >= 5:
        trip_cnt = _triplet_counts_from_history(history_rows)

        # If history has no usable triplets, fall back to neutral
        if not trip_cnt:
            history_rows = None
        else:
            rng = random.SystemRandom()

            def history_score(combo) -> Tuple[float, int]:
                # score = sum of triplet frequencies found in history
                # tie-breaker = random int (so equal-score combos don't stay deterministic)
                s = 0
                for t in combinations(combo, 3):
                    s += trip_cnt.get(tuple(sorted(t)), 0)
                return (float(s), rng.randrange(1_000_000))

            ranked = sorted(candidates, key=history_score, reverse=True)
            chosen = ranked[:max_tickets]
            mode = "budget_history_ranked"

    # --------------------------------------------------
    # MODE B — Neutral (no history)
    # --------------------------------------------------
    if not history_rows:
        rng = random.SystemRandom()
        shuffled = candidates[:]
        rng.shuffle(shuffled)
        chosen = shuffled[:max_tickets]
        mode = "budget_neutral"

    # --------------------------------------------------
    # Informational coverage metric (NOT optimization goal)
    # --------------------------------------------------
    all_triples, _ = _build_triple_universe(base)
    U = len(all_triples)

    covered = set()
    for c in chosen:
        for t in combinations(c, 3):
            covered.add(tuple(sorted(t)))

    coverage = round(len(covered) / U * 100, 2) if U > 0 else 0.0

    return {
        "mode": mode,
        "system": [list(c) for c in chosen],
        "system_size": len(chosen),
        "coverage": coverage,
        "triplets_total": U,
        "triplets_covered": len(covered),
    }


# ==========================================================
# Budget by Money
# ==========================================================

def budget_optimize_money(
    numbers: List[int],
    budget: float,
    ticket_cost: float,
    history_rows: Optional[List[List[int]]] = None,
) -> Dict:

    if ticket_cost <= 0:
        return {"error": "Ticket cost must be > 0"}

    max_tickets = int(budget // ticket_cost)
    if max_tickets <= 0:
        return {"error": "Budget too small"}

    return budget_optimize_fixed_count(
        numbers=numbers,
        max_tickets=max_tickets,
        history_rows=history_rows
    )


# ==========================================================
# API WRAPPER (for FastAPI)
# ==========================================================

def run_budget(
    numbers: List[int],
    ticket_count: int,
    history_rows: Optional[List[List[int]]] = None
) -> Dict:
    """
    Thin API wrapper for FastAPI.
    History is OPTIONAL.
    """
    return budget_optimize_fixed_count(
        numbers=numbers,
        max_tickets=ticket_count,
        history_rows=history_rows
    )
