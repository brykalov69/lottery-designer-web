# backend/app/main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from services.generator import generate_system
from services.history import (
    apply_history as apply_history_service,
    load_history_from_parsed,
    get_history,
    build_analysis,
    ai_insights,
    compute_heatmap,
    compute_ai_tips,
    compute_adjacency_analysis,
)
from services.greedy import greedy_entry
from services.budget import budget_optimize_fixed_count, budget_optimize_money
from services.ai_predictor import (
    score_system,
    compute_next_draw_candidates,
    compute_ai_tickets,
)
from services.sequential_drift import compute_sequential_drift, pro_to_free_preview
from services.per_ball_positional import compute_per_ball_positional, pro_to_free_preview as per_ball_free_preview
from services.ai_recommended_patterns import (
    compute_ai_recommended_patterns,
    pro_to_free_preview as patterns_free_preview,
)
from services.fusion_engine import compute_fusion_ranking
from services.ai_smart_tips import compute_ai_smart_tips, pro_to_free_preview as smart_tips_free_preview
from services.ai_ticket_generator import generate_ai_tickets, pro_to_free_preview as tickets_free_preview


# ==========================================================
# APP INIT
# ==========================================================

app = FastAPI(
    title="Lottery Designer API",
    description="Backend for Lottery System Designer",
    version="3.2 Stable History",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# ROOT
# ==========================================================

@app.get("/")
def root():
    return {"status": "OK"}

# ==========================================================
# REQUEST MODELS
# ==========================================================

class HistoryApplyRequest(BaseModel):
    text: Optional[str] = None
    file_b64: Optional[str] = None
    filetype: str           # "CSV" | "TXT" | "XLSX"
    main_count: int
    extra_count: int


class GreedyRequest(BaseModel):
    numbers: List[int]
    mode: Optional[str] = "classic"
    attempts: Optional[int] = 5
    sample_size: Optional[int] = 2000


class BudgetRequest(BaseModel):
    numbers: List[int]
    mode: str = "count"
    ticket_count: Optional[int] = None
    budget: Optional[float] = None
    ticket_cost: Optional[float] = None


class AIScoreRequest(BaseModel):
    system: List[List[int]]
    min_num: Optional[int] = None
    max_num: Optional[int] = None
    last: Optional[int] = None
    years: Optional[str] = None


# ==========================================================
# HISTORY APPLY (USED BY FRONTEND)
# ==========================================================

@app.post("/history/apply")
def apply_history(req: HistoryApplyRequest):
    try:
        result = apply_history_service(
            text=req.text,
            file_b64=req.file_b64,
            filetype=req.filetype.upper(),
            main_count=req.main_count,
            extra_count=req.extra_count,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/history")
def history():
    return get_history()

# ==========================================================
# ANALYTICS + AI INSIGHTS
# ==========================================================

@app.get("/analysis")
def analysis(min_num: int = None, max_num: int = None, last: int = None, years: str = None):
    years_list = [int(y) for y in years.split(",")] if years else None
    return build_analysis(min_num=min_num, max_num=max_num, last_n=last, years=years_list)


@app.get("/ai")
def ai(
    mode: str = "global",
    min_num: int = None,
    max_num: int = None,
    last: int = None,
    years: str = None,
):
    years_list = [int(y) for y in years.split(",")] if years else None
    return ai_insights(
        mode=mode,
        min_num=min_num,
        max_num=max_num,
        last_n=last,
        years=years_list,
    )

# ==========================================================
# GREEDY / BUDGET
# ==========================================================

@app.post("/greedy")
def greedy(req: GreedyRequest):
    return greedy_entry(req.numbers, req.mode, req.attempts, req.sample_size)


@app.post("/budget")
def budget(req: BudgetRequest):
    base = sorted(set(req.numbers))
    from services.greedy import _build_triple_universe
    triples, triple_index = _build_triple_universe(base)

    if req.mode == "count":
        return budget_optimize_fixed_count(
            numbers=req.numbers,
            max_tickets=req.ticket_count,
            triple_index=triple_index,
            all_triples=triples,
        )

    if req.mode == "money":
        return budget_optimize_money(
            numbers=req.numbers,
            budget=req.budget,
            ticket_cost=req.ticket_cost,
            triple_index=triple_index,
            all_triples=triples,
        )

    return {"error": "Invalid budget mode"}

# ==========================================================
# AI QUALITY / AI INSIDE
# ==========================================================

@app.post("/ai_score")
def ai_score(req: AIScoreRequest):
    years_list = [int(y) for y in req.years.split(",")] if req.years else None
    return score_system(
        system=req.system,
        min_num=req.min_num,
        max_num=req.max_num,
        last_n=req.last,
        years=years_list,
    )

@app.get("/ai_heatmap")
def ai_heatmap():
    return compute_heatmap(get_history())


@app.get("/ai_adjacency")
def ai_adjacency():
    return compute_adjacency_analysis(get_history())

@app.get("/ai_sequential_drift")
def ai_sequential_drift(
    min_length: int = 3,
    last: int | None = None,
    is_pro: bool = True,
):
    draws = get_history()
    result = compute_sequential_drift(draws, min_length=min_length, last_n=last)

    if not is_pro:
        return pro_to_free_preview(result)

    return result

@app.get("/ai_per_ball_positional")
def ai_per_ball_positional(
    is_pro: bool = True,
    last: int | None = None,
):
    draws = get_history()
    result = compute_per_ball_positional(draws, last_n=last)

    if not is_pro:
        return per_ball_free_preview(result)

    return result

@app.get("/ai_patterns")
def ai_patterns(
    is_pro: bool = True,
    last: int | None = None,
):
    draws = get_history()
    result = compute_ai_recommended_patterns(draws, last_n=last)

    if not is_pro:
        return patterns_free_preview(result)

    return result

@app.get("/ai_predictor")
def ai_predictor():
    draws = get_history()
    return compute_fusion_ranking(draws)

@app.get("/ai_smart_tips")
def ai_smart_tips(is_pro: bool = True):
    if not is_pro:
        return smart_tips_free_preview()

    draws = get_history()
    return compute_ai_smart_tips(draws)

@app.get("/ai_ticket_generator")
def ai_ticket_generator(
    is_pro: bool = True,
    ticket_count: int = 4,
    strategy: str = "balanced",
):
    draws = get_history()

    if not is_pro:
        return tickets_free_preview(draws)

    return generate_ai_tickets(
        draws,
        ticket_count=ticket_count,
        balls_per_ticket=5,
        strategy=strategy,
        top_candidates=10,
    )

@app.get("/ai_tips")
def ai_tips():
    heat = compute_heatmap(get_history())
    if "error" in heat:
        return heat
    return compute_ai_tips(get_history(), heat)


@app.get("/ai_next")
def ai_next(limit: int = 20):
    return compute_next_draw_candidates(limit=limit)


@app.get("/ai_tickets")
def ai_tickets():
    return compute_ai_tickets()
