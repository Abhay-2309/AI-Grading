from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# ─────────────────────────────────────────────────────────────────────────────
# Module 1: Intake
# ─────────────────────────────────────────────────────────────────────────────

class IntakeResponse(BaseModel):
    status: str                          # VERIFIED | FRAUD_ALERT | CATEGORY_MISMATCH
    category: Optional[str] = None
    base_value: Optional[float] = None
    questions: Optional[List[Dict[str, Any]]] = None
    message: Optional[str] = None
    claimed: Optional[str] = None
    detected_raw: Optional[str] = None   # VLM open-ended response (for logging)
    next_action: Optional[str] = None

# ─────────────────────────────────────────────────────────────────────────────
# Module 2: Gatekeeper
# ─────────────────────────────────────────────────────────────────────────────

class GatekeeperQuestion(BaseModel):
    id: str
    q: str
    impact: str
    fail_on: Optional[str] = None         # None for info-type questions
    penalty_pct: Optional[float] = None
    cap: Optional[str] = None
    reason: Optional[str] = None
    adds_repair: Optional[str] = None

class GatekeeperEvaluationRequest(BaseModel):
    category: str
    answers: Dict[str, Any]

class GatekeeperEvaluationResponse(BaseModel):
    is_terminal: bool
    reason: str
    grade_cap: str
    penalty_pct: float
    extra_repairs: List[str]

# ─────────────────────────────────────────────────────────────────────────────
# Module 3: Vision — Feature Extraction (raw AI output only)
# ─────────────────────────────────────────────────────────────────────────────

class DamageDetection(BaseModel):
    defect_type: str
    box: List[float]
    confidence: float
    verified_by_vlm: Optional[bool] = None

class VisionFeaturesResponse(BaseModel):
    """
    Raw feature extraction output from the AI layer.
    NO grades, NO decisions. This is input data for the Rules Engine.
    """
    structural_features: Dict[str, int]   # {"crack": 1, "dent": 0, ...}
    semantic_features: Dict[str, bool]    # {"has_heavy_dirt": True, ...}
    raw_detections: List[DamageDetection]

# ─────────────────────────────────────────────────────────────────────────────
# Module 4: Disposition — Full Pipeline Response
# ─────────────────────────────────────────────────────────────────────────────

class RoutingCalculationDetails(BaseModel):
    base_price: float
    grade_multiplier: float
    expected_resale_value: float
    total_repair_cost: float
    logistics_fees: float
    nrv_refurbish: float
    nrv_liquidate: float
    mrv_route: Optional[str] = None
    mrv_reason: Optional[str] = None
    mrv_expected_recovery: Optional[float] = None

class DispositionResponse(BaseModel):
    category: str
    final_grade: str
    route: str
    gatekeeper_is_terminal: bool
    gatekeeper_grade_cap: str
    structural_features: Dict[str, int]
    semantic_features: Dict[str, bool]
    semantic_adjustments: List[str]
    raw_detections: List[DamageDetection]
    financials: RoutingCalculationDetails
    repair_actions: List[str]
    messages: List[str]
