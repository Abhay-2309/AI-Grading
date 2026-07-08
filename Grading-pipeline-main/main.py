import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import io
from typing import Optional, Dict, Any, List

# Local imports
from models import (
    IntakeResponse,
    GatekeeperQuestion,
    GatekeeperEvaluationRequest,
    GatekeeperEvaluationResponse,
    VisionFeaturesResponse,
    DamageDetection,
    DispositionResponse,
    RoutingCalculationDetails
)
import ai_engine
from ai_engine import (
    initialize_models,
    verify_category_match,
    extract_structural_features,
    extract_semantic_features,
)
from routing import (
    normalize_category,
    QUESTION_BANK,
    MOCK_ORDER_DATABASE,
    evaluate_survey,
    grade_from_structural_features,
    apply_semantic_rules,
    reconcile_final_grade,
    calculate_nrv_route,
)

# ─────────────────────────────────────────────────────────────────────────────
# FastAPI Application
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Returniverse Intelligent Reverse Logistics API",
    description="AI-powered multi-modal grading, fraud detection, and NRV routing system.",
    version="2.0.0"
)

@app.on_event("startup")
def startup_event():
    """Load YOLO11 and Moondream2 sequentially during app startup."""
    try:
        initialize_models()
    except Exception as e:
        print(f"CRITICAL: Failed to load models during startup: {e}")

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error_type": "INTERNAL_SERVER_ERROR", "message": str(exc)}
    )

# ─────────────────────────────────────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "yolo_loaded": ai_engine.yolo_model is not None,
        "moondream_loaded": ai_engine.moondream_model is not None
    }

# ─────────────────────────────────────────────────────────────────────────────
# Module 1: Dual-Pathway Intake Controller
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/v1/intake", response_model=IntakeResponse)
async def intake_endpoint(
    source: str = Form(...),
    order_id: Optional[str] = Form(None),
    claimed_category: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    """
    Dual-pathway intake:
    - Path 1 (source=return): Trusted marketplace return. Fetches data from order DB.
      Uses Moondream to verify photo matches order category (fraud guard).
    - Path 2 (source=sell): Untrusted second-hand sell. Verifies user-claimed category
      using open-ended VLM prompt + keyword matching.
    """
    source = source.strip().lower()

    # ── Path 1: Trusted Marketplace Return ───────────────────────────────────
    if source == "return":
        if not order_id:
            raise HTTPException(status_code=400, detail="order_id is required for source=return")

        order = MOCK_ORDER_DATABASE.get(order_id)
        if not order:
            raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found in system.")

        category = order["category"]
        base_price = order["price_paid"]
        questions = QUESTION_BANK.get(category, QUESTION_BANK["_GENERIC"])

        # Optional fraud guard — verify photo matches order category if image provided
        if image:
            img_bytes = await image.read()
            pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            try:
                verification = verify_category_match(pil_image, category)
                if not verification["verified"]:
                    return IntakeResponse(
                        status="FRAUD_ALERT",
                        message=f"Fraud Alert: Return claims category '{verification['claimed']}' "
                                f"but photo shows '{verification['detected_raw']}'.",
                        claimed=verification["claimed"],
                        detected_raw=verification["detected_raw"],
                        next_action="route_to_manual_review"
                    )
            except Exception as e:
                print(f"WARNING: Fraud verification skipped: {e}")

        return IntakeResponse(
            status="VERIFIED",
            category=category,
            base_value=base_price,
            questions=questions,
        )

    # ── Path 2: Untrusted Second-Hand Sell ───────────────────────────────────
    elif source == "sell":
        if not claimed_category:
            raise HTTPException(status_code=400, detail="claimed_category is required for source=sell")
        if not image:
            raise HTTPException(status_code=400, detail="Image is required for source=sell")

        img_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        norm_category = normalize_category(claimed_category)

        try:
            # AI: Open-ended identification → Python: keyword matching
            verification = verify_category_match(pil_image, norm_category)
        except RuntimeError as e:
            raise HTTPException(status_code=503, detail=str(e))

        if not verification["verified"]:
            return IntakeResponse(
                status="CATEGORY_MISMATCH",
                message=f"Category Mismatch: You selected '{verification['claimed']}' but the photo "
                        f"appears to show '{verification['detected_raw']}'. "
                        f"Please re-check the category or upload a clearer photo.",
                claimed=verification["claimed"],
                detected_raw=verification["detected_raw"],
                next_action="reselect_or_reshoot"
            )

        questions = QUESTION_BANK.get(norm_category, QUESTION_BANK["_GENERIC"])

        return IntakeResponse(
            status="VERIFIED",
            category=norm_category,
            base_value=MOCK_ORDER_DATABASE.get(
                next((k for k, v in MOCK_ORDER_DATABASE.items() if v["category"] == norm_category), None),
                {}
            ).get("price_paid"),
            questions=questions,
        )

    else:
        raise HTTPException(status_code=400, detail="source must be 'return' or 'sell'")


# ─────────────────────────────────────────────────────────────────────────────
# Module 2: Non-Visual Gatekeeper Engine
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/v1/gatekeeper/survey/{category}", response_model=List[GatekeeperQuestion])
async def get_survey(category: str):
    """Returns the survey question bank for the given category."""
    norm_category = normalize_category(category)
    questions = QUESTION_BANK.get(norm_category, QUESTION_BANK["_GENERIC"])
    return questions

@app.post("/api/v1/gatekeeper/evaluate", response_model=GatekeeperEvaluationResponse)
async def evaluate_gatekeeper(request: GatekeeperEvaluationRequest):
    """
    Pure Python evaluator — no AI involved.
    Processes survey answers and returns terminal/cap/penalty decisions.
    """
    is_terminal, reason, grade_cap, penalty_pct, extra_repairs = evaluate_survey(
        request.category, request.answers
    )
    return GatekeeperEvaluationResponse(
        is_terminal=is_terminal,
        reason=reason,
        grade_cap=grade_cap,
        penalty_pct=penalty_pct,
        extra_repairs=extra_repairs
    )


# ─────────────────────────────────────────────────────────────────────────────
# Module 3: AI Feature Extraction Layer (No Business Logic)
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/v1/evaluate/vision", response_model=VisionFeaturesResponse)
async def vision_endpoint(
    category: str = Form(...),
    image: UploadFile = File(...)
):
    """
    AI feature extraction only. Returns raw structural defect counts and
    semantic boolean flags. NO grading occurs here.
    """
    img_bytes = await image.read()
    pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    norm_category = normalize_category(category)

    try:
        # 3a. Geometry Engine — YOLO11 raw defect counts
        structural_result = extract_structural_features(pil_image)

        # 3b. Semantic Engine — Moondream2 boolean flags
        semantic_flags = extract_semantic_features(pil_image, norm_category)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    raw_detections = [
        DamageDetection(
            defect_type=d["defect_type"],
            box=d["box"],
            confidence=d["confidence"]
        )
        for d in structural_result["raw_detections"]
    ]

    return VisionFeaturesResponse(
        structural_features=structural_result["defect_counts"],
        semantic_features=semantic_flags,
        raw_detections=raw_detections
    )


# ─────────────────────────────────────────────────────────────────────────────
# Module 4: Full Disposition Pipeline (AI extraction → Rules Engine → NRV)
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/v1/evaluate/disposition", response_model=DispositionResponse)
async def disposition_endpoint(
    source: str = Form(...),
    order_id: Optional[str] = Form(None),
    claimed_category: Optional[str] = Form(None),
    gatekeeper_answers: str = Form(...),     # JSON string of answers dict
    image: UploadFile = File(...)
):
    """
    Full end-to-end pipeline:
    1. Intake verification (AI: category check)
    2. Gatekeeper evaluation (Pure Python)
    3. AI feature extraction (YOLO + Moondream)
    4. Deterministic grading + NRV routing (Pure Python Rules Engine)
    """
    img_bytes = await image.read()
    pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    answers = json.loads(gatekeeper_answers)
    source = source.strip().lower()

    # ── Step 1: Intake Verification ──────────────────────────────────────────
    if source == "return":
        if not order_id:
            raise HTTPException(status_code=400, detail="order_id required for source=return")
        order = MOCK_ORDER_DATABASE.get(order_id)
        if not order:
            raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found")
        category = order["category"]
        base_price = order["price_paid"]

        # Fraud verification
        try:
            verification = verify_category_match(pil_image, category)
        except RuntimeError as e:
            raise HTTPException(status_code=503, detail=str(e))

        if not verification["verified"]:
            return DispositionResponse(
                category=category,
                final_grade="F",
                route="Recycle",
                gatekeeper_is_terminal=True,
                gatekeeper_grade_cap="F",
                structural_features={},
                semantic_features={},
                semantic_adjustments=[],
                raw_detections=[],
                financials=RoutingCalculationDetails(
                    base_price=base_price, grade_multiplier=0.0,
                    expected_resale_value=0.0, total_repair_cost=0.0,
                    logistics_fees=0.0, nrv_refurbish=0.0, nrv_liquidate=0.0
                ),
                repair_actions=[],
                messages=[
                    f"FRAUD DETECTED: Return claimed category '{verification['claimed']}' "
                    f"but photo shows '{verification['detected_raw']}'. "
                    "Item routed to Recycle (Manual Investigation Queue)."
                ]
            )

    elif source == "sell":
        if not claimed_category:
            raise HTTPException(status_code=400, detail="claimed_category required for source=sell")
        category = normalize_category(claimed_category)

        # Look up base_price from the market database
        from routing import MARKET_DATABASE
        base_price = MARKET_DATABASE.get(category, MARKET_DATABASE["_GENERIC"])["base_price"]

        try:
            verification = verify_category_match(pil_image, category)
        except RuntimeError as e:
            raise HTTPException(status_code=503, detail=str(e))

        if not verification["verified"]:
            return DispositionResponse(
                category=category,
                final_grade="F",
                route="Recycle",
                gatekeeper_is_terminal=True,
                gatekeeper_grade_cap="F",
                structural_features={},
                semantic_features={},
                semantic_adjustments=[],
                raw_detections=[],
                financials=RoutingCalculationDetails(
                    base_price=base_price, grade_multiplier=0.0,
                    expected_resale_value=0.0, total_repair_cost=0.0,
                    logistics_fees=0.0, nrv_refurbish=0.0, nrv_liquidate=0.0
                ),
                repair_actions=[],
                messages=[
                    f"Category Mismatch: Selected '{verification['claimed']}' "
                    f"but photo shows '{verification['detected_raw']}'. "
                    "Please re-shoot or upload a clearer photo."
                ]
            )
    else:
        raise HTTPException(status_code=400, detail="source must be 'return' or 'sell'")

    # ── Step 2: Gatekeeper (Pure Python) ────────────────────────────────────
    is_terminal, reason, grade_cap, penalty_pct, gatekeeper_repairs = evaluate_survey(
        category, answers
    )

    if is_terminal:
        return DispositionResponse(
            category=category,
            final_grade="F",
            route="Recycle",
            gatekeeper_is_terminal=True,
            gatekeeper_grade_cap="F",
            structural_features={},
            semantic_features={},
            semantic_adjustments=[],
            raw_detections=[],
            financials=RoutingCalculationDetails(
                base_price=base_price, grade_multiplier=0.0,
                expected_resale_value=0.0, total_repair_cost=0.0,
                logistics_fees=0.0, nrv_refurbish=0.0, nrv_liquidate=0.0
            ),
            repair_actions=[],
            messages=[
                f"Terminal Gatekeeper Failure: {reason}",
                "Item routed to Scrap / Recycling."
            ]
        )

    # ── Step 3: AI Feature Extraction ────────────────────────────────────────
    try:
        structural_result = extract_structural_features(pil_image)
        semantic_flags = extract_semantic_features(pil_image, category)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    defect_counts = structural_result["defect_counts"]
    raw_detections_data = structural_result["raw_detections"]

    # ── Step 4a: Rules Engine — Grade from structural features (Pure Python)
    visual_grade = grade_from_structural_features(defect_counts)

    # ── Step 4b: Rules Engine — Apply semantic boolean flag rules (Pure Python)
    adjusted_grade, semantic_adjustments = apply_semantic_rules(
        visual_grade, semantic_flags, category
    )

    # ── Step 4c: Rules Engine — Reconcile with Gatekeeper cap (Pure Python)
    final_grade, cap_message = reconcile_final_grade(adjusted_grade, grade_cap)
    if cap_message:
        semantic_adjustments.append(cap_message)

    # ── Step 4d: Rules Engine — NRV Math and routing decision (Pure Python)
    nrv_result = calculate_nrv_route(
        category=category,
        base_price=base_price,
        final_grade=final_grade,
        penalty_pct=penalty_pct,
        defect_counts=defect_counts,
        semantic_flags=semantic_flags,
        gatekeeper_repairs=gatekeeper_repairs
    )

    raw_detections = [
        DamageDetection(
            defect_type=d["defect_type"],
            box=d["box"],
            confidence=d["confidence"]
        )
        for d in raw_detections_data
    ]

    return DispositionResponse(
        category=category,
        final_grade=final_grade,
        route=nrv_result["route"],
        gatekeeper_is_terminal=False,
        gatekeeper_grade_cap=grade_cap,
        structural_features=defect_counts,
        semantic_features=semantic_flags,
        semantic_adjustments=semantic_adjustments,
        raw_detections=raw_detections,
        financials=RoutingCalculationDetails(**nrv_result["financials"]),
        repair_actions=nrv_result["repair_actions"],
        messages=semantic_adjustments + nrv_result["messages"]
    )
