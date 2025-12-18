from __future__ import annotations
from typing import Dict, Any, List, Optional
from itertools import combinations

from services.fusion_engine import compute_fusion_ranking


def _flatten_candidates(candidates: List[Dict[str, Any]]) -> List[int]:
    nums = []
    for c in candidates:
        for n in c.get("pattern", []):
            if n not in nums:
                nums.append(n)
    return nums


def _score_map(candidates: List[Dict[str, Any]]) -> Dict[int, float]:
    """
    Build simple per-number score based on fusion candidates.
    Each time a number appears in higher-ranked patterns, it receives more weight.
    Deterministic.
    """
    score: Dict[int, float] = {}
    for idx, c in enumerate(candidates):
        w = 1.0 / (1 + idx)  # rank weight
        for n in c.get("pattern", []):
            score[n] = score.get(n, 0.0) + w
    return score


def _sorted_by_score(score: Dict[int, float]) -> List[int]:
    return [n for n, _ in sorted(score.items(), key=lambda kv: kv[1], reverse=True)]


def _choose_ticket_deterministic(pool: List[int], k: int, offset: int) -> List[int]:
    """
    Deterministic selection: take k numbers from pool with cyclic offset.
    """
    if not pool:
        return []
    out = []
    i = offset % len(pool)
    while len(out) < k and len(out) < len(pool):
        n = pool[i]
        if n not in out:
            out.append(n)
        i = (i + 1) % len(pool)
    return sorted(out)


def _strategy_balanced(sorted_nums: List[int], k: int, t: int) -> List[int]:
    """
    Balanced:
    - mix top and mid ranked numbers deterministically.
    """
    top = sorted_nums[: max(k * 2, 10)]
    mid = sorted_nums[max(0, len(sorted_nums)//3) : max(0, len(sorted_nums)//3) + max(k * 2, 10)]

    pool = []
    # interleave top + mid
    for i in range(max(len(top), len(mid))):
        if i < len(top):
            pool.append(top[i])
        if i < len(mid):
            pool.append(mid[i])

    return _choose_ticket_deterministic(pool, k, offset=t * 3)


def _strategy_conservative(sorted_nums: List[int], k: int, t: int) -> List[int]:
    """
    Conservative:
    - choose only from top-ranked numbers.
    """
    top = sorted_nums[: max(k * 3, 15)]
    return _choose_ticket_deterministic(top, k, offset=t * 2)


def _strategy_exploratory(sorted_nums: List[int], k: int, t: int) -> List[int]:
    """
    Exploratory:
    - take some top numbers + some lower ranked numbers for diversity.
    """
    top = sorted_nums[: max(k * 2, 10)]
    low = sorted_nums[max(0, len(sorted_nums) - max(k * 3, 15)) :]

    pool = []
    # interleave top + low
    for i in range(max(len(top), len(low))):
        if i < len(top):
            pool.append(top[i])
        if i < len(low):
            pool.append(low[i])

    return _choose_ticket_deterministic(pool, k, offset=t * 5)


def generate_ai_tickets(
    history_rows: List[Dict[str, Any]],
    *,
    ticket_count: int = 4,
    balls_per_ticket: int = 5,
    strategy: str = "balanced",
    top_candidates: int = 10,
) -> Dict[str, Any]:
    """
    AI Ticket Generator (PRO)

    Uses Fusion Engine ranking -> converts to actual tickets.
    Deterministic and explainable.

    strategy:
      - balanced
      - conservative
      - exploratory
    """
    if not history_rows:
        return {"error": "No history loaded."}

    if ticket_count < 1:
        ticket_count = 1
    if ticket_count > 20:
        ticket_count = 20

    # Get fusion candidates
    fusion = compute_fusion_ranking(history_rows, top_k=top_candidates)
    candidates = fusion.get("candidates", [])

    if not candidates:
        return {"error": "No fusion candidates available."}

    # Determine per-number score pool
    score = _score_map(candidates)
    sorted_nums = _sorted_by_score(score)

    # Pick tickets
    tickets = []
    for t in range(ticket_count):
        if strategy == "conservative":
            nums = _strategy_conservative(sorted_nums, balls_per_ticket, t)
        elif strategy == "exploratory":
            nums = _strategy_exploratory(sorted_nums, balls_per_ticket, t)
        else:
            nums = _strategy_balanced(sorted_nums, balls_per_ticket, t)

        tickets.append({
            "ticket": nums,
            "strategy": strategy,
            "source": {
                "top_candidates_used": top_candidates,
                "fusion_based": True,
            }
        })

    return {
        "mode": "pro",
        "ticket_count": ticket_count,
        "balls_per_ticket": balls_per_ticket,
        "strategy": strategy,
        "tickets": tickets,
    }


def pro_to_free_preview(history_rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    FREE preview:
    - only 1 balanced ticket
    - no strategy choice
    """
    if not history_rows:
        return {"error": "No history loaded."}

    res = generate_ai_tickets(
        history_rows,
        ticket_count=1,
        balls_per_ticket=5,
        strategy="balanced",
        top_candidates=6,
    )

    if "error" in res:
        return res

    return {
        "mode": "free_preview",
        "tickets": {
            "balanced": res["tickets"][0]["ticket"]
        },
        "note": "Unlock PRO to generate multiple tickets with strategies (Balanced / Conservative / Exploratory).",
    }
