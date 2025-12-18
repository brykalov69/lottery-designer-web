from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any

# =========================
# APP INIT
# =========================

app = FastAPI()

# =========================
# CORS (DEV)
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],   # enables OPTIONS preflight
    allow_headers=["*"],
)

# =========================
# IMPORT SERVICES
# =========================
# ВАЖНО: оставляем как было, но если что-то отсутствует — ты увидишь ошибку в консоли
from services.generator import generate_system
from services.greedy import run_greedy
from services.budget import run_budget

# history service
from services.history import get_history, apply_history

# AI services
from services.ai_recommended_patterns import compute_ai_recommended_patterns
from services.fusion_engine import compute_fusion_ranking
from services.ai_smart_tips import compute_ai_smart_tips
from services.ai_ticket_generator import generate_ai_tickets


# =========================
# REQUEST MODELS
# =========================

class GeneratorRequest(BaseModel):
    numbers: List[int]
    limit: Optional[int] = None

    # snake_case (from Generator.tsx)
    fixed_positions: Optional[Dict[str, List[int]]] = None
    forced_numbers: Optional[List[int]] = None
    group_limits: Optional[Dict[str, Optional[int]]] = None
    range_mode: Optional[str] = "global"
    min_num: Optional[int] = None
    max_num: Optional[int] = None
    per_ball_ranges: Optional[Dict[str, Dict[str, Optional[int]]]] = None

    # camelCase (backward compatibility)
    fixedPosition: Optional[Dict[str, List[int]]] = None
    forcedNumbers: Optional[List[int]] = None
    limits: Optional[Dict[str, Optional[int]]] = None
    rangeMode: Optional[str] = None
    minNum: Optional[int] = None
    maxNum: Optional[int] = None
    perBallRanges: Optional[Dict[str, Dict[str, Optional[int]]]] = None

    # shared
    groups: Optional[Dict[str, List[int]]] = None

    class Config:
        extra = "ignore"


class GreedyRequest(BaseModel):
    numbers: List[int]
    mode: Optional[str] = "classic"
    attempts: Optional[int] = 5
    sample_size: Optional[int] = 2000


class BudgetRequest(BaseModel):
    numbers: List[int]
    ticketCount: Optional[int] = None          # frontend (camelCase)
    ticket_count: Optional[int] = None         # backend style (snake)
    mode: Optional[str] = "count"
    budget: Optional[float] = None
    ticket_cost: Optional[float] = None

    class Config:
        extra = "ignore"


class HistoryApplyRequest(BaseModel):
    # either text (csv/txt) OR file_b64 (xlsx)
    text: Optional[str] = None
    file_b64: Optional[str] = None

    # "CSV" | "TXT" | "XLSX"
    filetype: str = "CSV"

    main_count: int = 5
    extra_count: int = 0

    class Config:
        extra = "ignore"


# =========================
# BASE SYSTEM GENERATOR
# =========================

@app.post("/generate")
def generate(req: GeneratorRequest):
    try:
        fp = req.fixed_positions if req.fixed_positions is not None else req.fixedPosition
        fixed_positions = {int(k): v for k, v in fp.items()} if fp else None

        gl = req.group_limits if req.group_limits is not None else req.limits
        group_limits = gl if gl else None

        forced_numbers = req.forced_numbers if req.forced_numbers is not None else req.forcedNumbers

        pbr = req.per_ball_ranges if req.per_ball_ranges is not None else req.perBallRanges
        per_ball_ranges = {int(k): v for k, v in pbr.items()} if pbr else None

        range_mode = req.range_mode or req.rangeMode or "global"
        min_num = req.min_num if req.min_num is not None else req.minNum
        max_num = req.max_num if req.max_num is not None else req.maxNum

        return generate_system(
            numbers=req.numbers,
            limit=req.limit,
            fixed_positions=fixed_positions,
            groups=req.groups,
            group_limits=group_limits,
            forced_numbers=forced_numbers,
            range_mode=range_mode,
            min_num=min_num,
            max_num=max_num,
            per_ball_ranges=per_ball_ranges,
        )

    except Exception as e:
        print("GENERATOR ERROR:", repr(e))
        raise HTTPException(status_code=400, detail=str(e))


# =========================
# HISTORY
# =========================

@app.post("/history/apply")
def history_apply(req: HistoryApplyRequest):
    try:
        return apply_history(
            text=req.text,
            file_b64=req.file_b64,
            filetype=req.filetype,
            main_count=req.main_count,
            extra_count=req.extra_count,
        )
    except Exception as e:
        print("HISTORY APPLY ERROR:", repr(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/history")
def history_get():
    # удобный endpoint для проверки, что история реально загружена
    return {"rows": get_history(), "count": len(get_history())}


# =========================
# GREEDY OPTIMIZER
# =========================

# ✅ keep BOTH routes so frontend doesn’t break
@app.post("/greedy")
def greedy_endpoint(req: GreedyRequest):
    try:
        return run_greedy(
            numbers=req.numbers,
            mode=req.mode or "classic",
            attempts=req.attempts or 5,
            sample_size=req.sample_size or 2000,
        )
    except Exception as e:
        print("GREEDY ERROR:", repr(e))
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/ai_greedy")
def ai_greedy_endpoint(req: GreedyRequest):
    return greedy_endpoint(req)


# =========================
# SMART BUDGET
# =========================

@app.post("/budget")
def budget_endpoint(req: BudgetRequest):
    try:
        tc = req.ticketCount if req.ticketCount is not None else req.ticket_count
        if tc is None:
            return {"error": "ticketCount is required"}

        return run_budget(
            numbers=req.numbers,
            ticket_count=int(tc),
        )
    except Exception as e:
        print("BUDGET ERROR:", repr(e))
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/ai_budget")
def ai_budget_endpoint(req: BudgetRequest):
    return budget_endpoint(req)


# =========================
# AI PATTERNS / PREDICTOR / TIPS / TICKETS
# =========================

@app.get("/ai_patterns")
def ai_patterns():
    history = get_history()
    if not history:
        raise HTTPException(status_code=400, detail="No history loaded")
    return compute_ai_recommended_patterns(history)

@app.get("/ai_predictor")
def ai_predictor():
    history = get_history()
    if not history:
        raise HTTPException(status_code=400, detail="No history loaded")
    return compute_fusion_ranking(history)

@app.get("/ai_smart_tips")
def ai_smart_tips(is_pro: bool = True):
    if not is_pro:
        return {"mode": "free_preview", "note": "Unlock PRO to view AI Smart Tips."}
    history = get_history()
    if not history:
        raise HTTPException(status_code=400, detail="No history loaded")
    return compute_ai_smart_tips(history)

@app.get("/ai_ticket_generator")
def ai_ticket_generator(
    is_pro: bool = True,
    ticket_count: int = 4,
    strategy: str = "balanced",
):
    history = get_history()
    if not history:
        raise HTTPException(status_code=400, detail="No history loaded")

    if not is_pro:
        return {"mode": "free_preview", "note": "Unlock PRO to generate AI-driven tickets."}

    return generate_ai_tickets(
        history_rows=history,
        ticket_count=ticket_count,
        balls_per_ticket=5,
        strategy=strategy,
        top_candidates=10,
    )
