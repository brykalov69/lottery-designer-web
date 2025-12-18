from __future__ import annotations
from typing import Dict, Any, List

# We read results from existing engines (no new calculations)
from services.fusion_engine import compute_fusion_ranking


# -------------------------
# Tip templates (typed)
# -------------------------

def strength_tip(msg: str) -> Dict[str, Any]:
    return {"type": "strength", "message": msg}

def caution_tip(msg: str) -> Dict[str, Any]:
    return {"type": "caution", "message": msg}

def balance_tip(msg: str) -> Dict[str, Any]:
    return {"type": "balance", "message": msg}

def conflict_tip(msg: str) -> Dict[str, Any]:
    return {"type": "conflict", "message": msg}

def guidance_tip(msg: str) -> Dict[str, Any]:
    return {"type": "guidance", "message": msg}


# -------------------------
# Smart Tips generator
# -------------------------

def generate_smart_tips_for_candidate(candidate: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generates human-readable Smart Tips based on fusion breakdown.
    Deterministic and explainable.
    """

    tips: List[Dict[str, Any]] = []
    breakdown = candidate.get("rank_breakdown", {})

    freq = breakdown.get("frequency", 0)
    pos = breakdown.get("positional", 0)
    patt = breakdown.get("pattern_score", 0)
    drift_penalty = breakdown.get("drift_penalty", 0)

    # Strengths
    if freq >= 0.65:
        tips.append(
            strength_tip(
                "This candidate shows strong historical frequency alignment."
            )
        )

    if pos >= 0.65:
        tips.append(
            strength_tip(
                "Positional behavior is stable across historical draws."
            )
        )
    elif 0.45 <= pos < 0.65:
        tips.append(
            caution_tip(
                "Positional stability is moderate, results may vary."
            )
        )
    else:
        tips.append(
            caution_tip(
                "Positional behavior appears unstable historically."
            )
        )

    if patt >= 0.6:
        tips.append(
            strength_tip(
                "Underlying pattern score supports this candidate."
            )
        )

    # Conflicts
    if drift_penalty > 0:
        tips.append(
            conflict_tip(
                "Sequential drift indicates a potential conflict with this pattern."
            )
        )
    else:
        tips.append(
            strength_tip(
                "No conflicting sequential drift detected."
            )
        )

    # Balance / guidance
    if freq >= 0.6 and pos < 0.6:
        tips.append(
            balance_tip(
                "High frequency combined with moderate positional stability suggests using this candidate as part of a balanced selection."
            )
        )

    tips.append(
        guidance_tip(
            "Consider combining this candidate with others to reduce volatility."
        )
    )

    return tips


def compute_ai_smart_tips(history_rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes Smart Tips for top-ranked candidates from Fusion Engine.
    """

    if not history_rows:
        return {"error": "No history loaded."}

    fusion = compute_fusion_ranking(history_rows)
    candidates = fusion.get("candidates", [])

    if not candidates:
        return {"error": "No ranked candidates available."}

    tips_by_candidate = []

    for idx, c in enumerate(candidates):
        tips = generate_smart_tips_for_candidate(c)

        tips_by_candidate.append({
            "rank": idx + 1,
            "pattern": c.get("pattern"),
            "fusion_score": c.get("fusion_score"),
            "tips": tips,
        })

    return {
        "mode": "pro",
        "tips": tips_by_candidate,
        "note": (
            "AI Smart Tips interpret ranking results using deterministic rules. "
            "They do not predict outcomes."
        ),
    }


def pro_to_free_preview() -> Dict[str, Any]:
    """
    FREE preview for Smart Tips.
    """
    return {
        "mode": "free_preview",
        "note": (
            "AI Smart Tips explain the meaning of AI results and highlight strengths "
            "and weaknesses of ranked candidates. Unlock PRO to view real insights."
        ),
    }
