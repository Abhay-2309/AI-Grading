from typing import Dict, List, Tuple, Any, Optional
import random

# ─────────────────────────────────────────────────────────────────────────────
# Mock Databases (All values in Indian Rupees — INR)
# ─────────────────────────────────────────────────────────────────────────────

MOCK_ORDER_DATABASE = {
    "ORD-1001": {"category": "Smartphone", "price_paid": 64000.0, "product_name": "iPhone 15"},
    "ORD-1002": {"category": "Laptop", "price_paid": 96000.0, "product_name": "Dell XPS 13"},
    "ORD-1003": {"category": "Footwear", "price_paid": 9600.0, "product_name": "Nike Air Max"},
    "ORD-1004": {"category": "Apparel", "price_paid": 7200.0, "product_name": "Adidas Hoodie"},
    "ORD-1005": {"category": "HomeGoods", "price_paid": 14400.0, "product_name": "Philips Blender"},
    "ORD-1006": {"category": "Electronics", "price_paid": 12000.0, "product_name": "Sony Headphones"},
}

CATEGORY_ALIASES = {
    "clothes": "Apparel", "clothing": "Apparel", "fashion": "Apparel",
    "shoes": "Footwear", "sneaker": "Footwear", "mobile": "Smartphone", "phone": "Smartphone",
    "appliances": "HomeGoods", "home goods": "HomeGoods"
}

MARKET_DATABASE = {
    "Smartphone": {
        "base_price": 64000.0,
        "multipliers": {"A": 1.0, "B": 0.8, "C": 0.5, "F": 0.0},
        "logistics_fees": 1600.0,
        "yolo_repair_costs": {
            "crack": 9600.0,
            "dent": 4000.0,
            "scratch": 1600.0,
            "stain": 1200.0,
            "pcb_defect": 14400.0,
            "structural_damage": 12000.0,
            "hole_tear": 2400.0,
        },
        "semantic_repair_costs": {
            "has_heavy_dirt": 2000.0,
            "screen_cracked_visible": 8000.0,
            "visible_stains_present": 1600.0,
        }
    },
    "Laptop": {
        "base_price": 96000.0,
        "multipliers": {"A": 1.0, "B": 0.85, "C": 0.6, "F": 0.0},
        "logistics_fees": 2800.0,
        "yolo_repair_costs": {
            "crack": 20000.0,
            "dent": 8000.0,
            "scratch": 3200.0,
            "pcb_defect": 24000.0,
            "structural_damage": 16000.0,
        },
        "semantic_repair_costs": {
            "has_heavy_dirt": 2400.0,
            "screen_cracked_visible": 12000.0,
        }
    },
    "Footwear": {
        "base_price": 9600.0,
        "multipliers": {"A": 1.0, "B": 0.75, "C": 0.4, "F": 0.0},
        "logistics_fees": 960.0,
        "yolo_repair_costs": {
            "scratch": 1200.0,
            "stain": 2000.0,
            "hole_tear": 2400.0,
            "structural_damage": 3200.0,
        },
        "semantic_repair_costs": {
            "visible_stains_present": 1600.0,
        }
    },
    "Apparel": {
        "base_price": 7200.0,
        "multipliers": {"A": 1.0, "B": 0.8, "C": 0.5, "F": 0.0},
        "logistics_fees": 800.0,
        "yolo_repair_costs": {
            "stain": 1200.0,
            "hole_tear": 1600.0,
        },
        "semantic_repair_costs": {
            "visible_stains_present": 1200.0,
        }
    },
    "HomeGoods": {
        "base_price": 14400.0,
        "multipliers": {"A": 1.0, "B": 0.8, "C": 0.5, "F": 0.0},
        "logistics_fees": 2000.0,
        "yolo_repair_costs": {
            "scratch": 1200.0,
            "dent": 2400.0,
            "pcb_defect": 4800.0,
            "structural_damage": 4000.0,
        },
        "semantic_repair_costs": {
            "signs_of_heavy_use": 1600.0,
        }
    },
    "Electronics": {
        "base_price": 12000.0,
        "multipliers": {"A": 1.0, "B": 0.8, "C": 0.5, "F": 0.0},
        "logistics_fees": 1200.0,
        "yolo_repair_costs": {
            "scratch": 1200.0,
            "dent": 2000.0,
            "pcb_defect": 5600.0,
            "structural_damage": 3600.0,
        },
        "semantic_repair_costs": {
            "has_heavy_dirt": 1600.0,
        }
    },
    "Books": {
        "base_price": 3200.0,
        "multipliers": {"A": 1.0, "B": 0.8, "C": 0.5, "F": 0.0},
        "logistics_fees": 400.0,
        "yolo_repair_costs": {
            "scratch": 400.0,
            "stain": 800.0,
            "hole_tear": 1200.0,
        },
        "semantic_repair_costs": {}
    },
    "_GENERIC": {
        "base_price": 8000.0,
        "multipliers": {"A": 1.0, "B": 0.8, "C": 0.5, "F": 0.0},
        "logistics_fees": 1200.0,
        "yolo_repair_costs": {
            "crack": 2400.0,
            "dent": 1600.0,
            "scratch": 800.0,
            "stain": 800.0,
            "hole_tear": 1200.0,
            "pcb_defect": 4000.0,
            "structural_damage": 2400.0,
        },
        "semantic_repair_costs": {
            "appears_heavily_damaged": 2000.0,
        }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Question Bank
# ─────────────────────────────────────────────────────────────────────────────

QUESTION_BANK = {
    "Smartphone": [
        {"id": "powers_on",       "q": "Does the device power on and boot to the home screen?",
         "impact": "terminal", "fail_on": "no",  "reason": "Dead hardware - motherboard-level failure"},
        {"id": "water_damage",    "q": "Is the LDI strip in the SIM tray red/triggered?",
         "impact": "terminal", "fail_on": "yes", "reason": "Internal water damage - unsellable"},
        {"id": "icloud_frp_lock", "q": "Is the device free of iCloud/Google FRP activation lock?",
         "impact": "terminal", "fail_on": "no",  "reason": "Locked device cannot be resold legally"},
        {"id": "imei_blacklist",  "q": "Is the IMEI clean (not reported stolen/blacklisted)?",
         "impact": "terminal", "fail_on": "no",  "reason": "Blacklisted - legal risk"},
        {"id": "battery_health",  "q": "Is battery health above 80%?",
         "impact": "grade_cap", "fail_on": "no", "cap": "B", "adds_repair": "battery"},
        {"id": "touch_sensors",   "q": "Do touchscreen, Face ID/fingerprint, cameras, speakers all work?",
         "impact": "grade_cap", "fail_on": "no", "cap": "C"},
        {"id": "charger_box",     "q": "Are the original charger, cable, and box present?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.05},
        {"id": "invoice",         "q": "Is a valid purchase invoice/bill provided?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.10},
        {"id": "warranty_active", "q": "Is the device still under manufacturer warranty?",
         "impact": "info"}
    ],
    "Laptop": [
        {"id": "posts_boots",      "q": "Does the laptop POST and boot to OS with display output?",
         "impact": "terminal", "fail_on": "no",  "reason": "Motherboard/display failure"},
        {"id": "liquid_corrosion", "q": "Any liquid spill history or visible corrosion under keyboard?",
         "impact": "terminal", "fail_on": "yes", "reason": "Corrosion spreads - terminal"},
        {"id": "bios_lock",        "q": "Is the device free of BIOS/admin/MDM enrollment locks?",
         "impact": "terminal", "fail_on": "no",  "reason": "Enterprise-locked - unsellable"},
        {"id": "battery_holds",    "q": "Does the battery hold charge for over 1 hour of use?",
         "impact": "grade_cap", "fail_on": "no", "cap": "B", "adds_repair": "battery"},
        {"id": "keyboard_ports",   "q": "Do all keys, trackpad, USB ports, and webcam function?",
         "impact": "grade_cap", "fail_on": "no", "cap": "C"},
        {"id": "charger_present",  "q": "Is the original power adapter included?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.06},
        {"id": "invoice",          "q": "Is a valid purchase invoice provided?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.10},
        {"id": "storage_wiped",    "q": "Has user data been wiped / is the drive resettable?",
         "impact": "info"}
    ],
    "Apparel": [
        {"id": "worn_washed",      "q": "Has the item been worn, washed, or does it carry odor?",
         "impact": "terminal", "fail_on": "yes", "reason": "Hygiene policy - cannot restock"},
        {"id": "altered",          "q": "Has the garment been altered/tailored?",
         "impact": "terminal", "fail_on": "yes", "reason": "Altered items are unsellable as new"},
        {"id": "tags_attached",    "q": "Are the original brand tags and price tags still attached?",
         "impact": "grade_cap", "fail_on": "no", "cap": "B"},
        {"id": "original_packing", "q": "Is the original polybag/packaging present?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.05},
        {"id": "size_label",       "q": "Is the size/care label intact and legible?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.05}
    ],
    "Footwear": [
        {"id": "worn_outdoors",   "q": "Do the soles show outdoor wear (dirt, sole abrasion)?",
         "impact": "terminal", "fail_on": "yes", "reason": "Worn footwear - hygiene/resale policy"},
        {"id": "both_pairs",      "q": "Are both shoes of the pair present and matching in size?",
         "impact": "terminal", "fail_on": "no",  "reason": "Incomplete pair - scrap/donate"},
        {"id": "shoebox_present", "q": "Is the original branded shoebox included?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.07},
        {"id": "insoles_laces",   "q": "Are the original insoles and laces present?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.04}
    ],
    "HomeGoods": [
        {"id": "powers_functions", "q": "Does the primary motor/heating element power on and operate?",
         "impact": "terminal", "fail_on": "no",  "reason": "Core mechanical failure - parts salvage"},
        {"id": "safety_hazard",    "q": "Any burning smell, sparking, exposed wiring?",
         "impact": "terminal", "fail_on": "yes", "reason": "Safety hazard - cannot legally resell"},
        {"id": "food_contact_used","q": "Has a food-contact item been used?",
         "impact": "grade_cap", "fail_on": "yes", "cap": "C"},
        {"id": "parts_complete",   "q": "Are all attachments and assembly parts present?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.08, "adds_repair": "missing_parts"},
        {"id": "manual_warranty",  "q": "Are the user manual and warranty card included?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.03},
        {"id": "invoice",          "q": "Is the purchase invoice provided?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.08}
    ],
    "Electronics": [
        {"id": "powers_on",       "q": "Does the device power on and perform its core function?",
         "impact": "terminal", "fail_on": "no",  "reason": "Dead device - e-waste"},
        {"id": "water_damage",    "q": "Any exposure to water/moisture?",
         "impact": "terminal", "fail_on": "yes", "reason": "Moisture damage - terminal"},
        {"id": "pairing_lock",    "q": "Is the device unpaired/reset from previous accounts?",
         "impact": "terminal", "fail_on": "no",  "reason": "Account-locked device"},
        {"id": "battery_charges", "q": "Does the battery charge and hold charge normally?",
         "impact": "grade_cap", "fail_on": "no", "cap": "B", "adds_repair": "battery"},
        {"id": "accessories",     "q": "Are cables, ear-tips, straps, and case included?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.05},
        {"id": "invoice",         "q": "Is a purchase invoice provided?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.08}
    ],
    "_GENERIC": [
        {"id": "core_functional", "q": "Does the item perform its core intended function?",
         "impact": "terminal", "fail_on": "no",  "reason": "Non-functional - scrap"},
        {"id": "hygiene_safety",  "q": "Any hygiene issue, contamination, or safety hazard?",
         "impact": "terminal", "fail_on": "yes", "reason": "Policy violation - cannot resell"},
        {"id": "complete",        "q": "Are all original parts, accessories, and packaging present?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.07},
        {"id": "invoice",         "q": "Is proof of purchase provided?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.08}
    ]
}

# ─────────────────────────────────────────────────────────────────────────────
# Utility Helpers
# ─────────────────────────────────────────────────────────────────────────────

def normalize_category(raw: str) -> str:
    key = raw.strip().lower()
    return CATEGORY_ALIASES.get(key, raw.strip().title())

def _grade_order(g: str) -> int:
    return {"A": 0, "B": 1, "C": 2, "F": 3}.get(g.upper(), 3)

def _downgrade_one_tier(grade: str) -> str:
    return {"A": "B", "B": "C", "C": "F", "F": "F"}.get(grade.upper(), "F")

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 2 — Non-Visual Gatekeeper Engine
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_survey(category: str, answers: Dict[str, Any]) -> Tuple[bool, str, str, float, List[str]]:
    """
    Pure Python evaluator. Returns (is_terminal, reason, grade_cap, penalty_pct, extra_repairs).
    """
    norm_cat = normalize_category(category)
    questions = QUESTION_BANK.get(norm_cat, QUESTION_BANK["_GENERIC"])

    grade_cap = "A"
    total_penalty_pct = 0.0
    extra_repairs: List[str] = []

    for q in questions:
        ans = answers.get(q["id"])
        if ans is None or q["impact"] == "info":
            continue

        fail_on = q.get("fail_on")
        failed = (ans is False and fail_on == "no") or (ans is True and fail_on == "yes")

        if failed:
            if q["impact"] == "terminal":
                return True, q["reason"], "F", 0.0, []
            elif q["impact"] == "grade_cap":
                if _grade_order(q["cap"]) > _grade_order(grade_cap):
                    grade_cap = q["cap"]
                if q.get("adds_repair"):
                    extra_repairs.append(q["adds_repair"])
            elif q["impact"] == "penalty":
                total_penalty_pct += q.get("penalty_pct", 0.0)
                if q.get("adds_repair"):
                    extra_repairs.append(q["adds_repair"])

    return False, "Gatekeeper passed", grade_cap, total_penalty_pct, extra_repairs


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 4 — Python Rules & NRV Routing Engine
# (Called AFTER AI feature extraction — NO AI calls here)
# ─────────────────────────────────────────────────────────────────────────────

# YOLO severity point weights — pure data, no AI
SEVERITY_WEIGHTS: Dict[str, int] = {
    "scratch": 1,
    "stain": 1,
    "dent": 3,
    "hole_tear": 3,
    "crack": 5,
    "structural_damage": 5,
    "pcb_defect": 7
}

def grade_from_structural_features(defect_counts: Dict[str, int]) -> str:
    """
    Pure Python rules: convert raw YOLO defect counts -> severity points -> grade.
    AI never touches this function.
    """
    total_points = sum(
        defect_counts.get(defect, 0) * weight
        for defect, weight in SEVERITY_WEIGHTS.items()
    )
    if total_points == 0:
        return "A"
    elif total_points <= 2:
        return "B"
    elif total_points <= 6:
        return "C"
    else:
        return "F"

def apply_semantic_rules(
    visual_grade: str,
    semantic_flags: Dict[str, bool],
    category: str
) -> Tuple[str, List[str]]:
    """
    Pure Python rules engine: applies hardcoded rules based on Moondream boolean flags.
    AI extracted the facts; Python decides what to do with them.
    """
    if visual_grade == "F":
        return "F", []

    adjustments: List[str] = []
    current_grade = visual_grade

    # Universal rules (apply regardless of category)
    if semantic_flags.get("has_heavy_dirt"):
        new_grade = _downgrade_one_tier(current_grade)
        adjustments.append(f"Rule: has_heavy_dirt=True -> Downgraded {current_grade} -> {new_grade}")
        current_grade = new_grade

    if semantic_flags.get("screen_cracked_visible") and current_grade != "F":
        new_grade = _downgrade_one_tier(current_grade)
        adjustments.append(f"Rule: screen_cracked_visible=True -> Downgraded {current_grade} -> {new_grade}")
        current_grade = new_grade

    if semantic_flags.get("signs_of_heavy_use") and current_grade != "F":
        new_grade = _downgrade_one_tier(current_grade)
        adjustments.append(f"Rule: signs_of_heavy_use=True -> Downgraded {current_grade} -> {new_grade}")
        current_grade = new_grade

    if semantic_flags.get("visible_stains_present") and current_grade not in ["C", "F"]:
        new_grade = _downgrade_one_tier(current_grade)
        adjustments.append(f"Rule: visible_stains_present=True -> Downgraded {current_grade} -> {new_grade}")
        current_grade = new_grade

    if semantic_flags.get("original_labels_intact") is False and current_grade not in ["C", "F"]:
        new_grade = _downgrade_one_tier(current_grade)
        adjustments.append(f"Rule: original_labels_intact=False -> Downgraded {current_grade} -> {new_grade}")
        current_grade = new_grade

    if semantic_flags.get("appears_heavily_damaged") and current_grade != "F":
        new_grade = _downgrade_one_tier(current_grade)
        adjustments.append(f"Rule: appears_heavily_damaged=True -> Downgraded {current_grade} -> {new_grade}")
        current_grade = new_grade

    return current_grade, adjustments

def reconcile_final_grade(visual_grade: str, gatekeeper_cap: str) -> Tuple[str, Optional[str]]:
    """
    Worst-case reconciliation between visual grade and gatekeeper cap.
    """
    if _grade_order(gatekeeper_cap) > _grade_order(visual_grade):
        return gatekeeper_cap.upper(), f"Gatekeeper cap applied: {visual_grade} -> {gatekeeper_cap.upper()}"
    return visual_grade, None

def calculate_dynamic_mrv(item_category: str, final_grade: str, base_value: float) -> Dict[str, Any]:
    """
    Computes Maximum Recovery Value (MRV) between Direct B2C Clearance vs B2B Auction.
    """
    norm_cat = normalize_category(item_category)
    db = MARKET_DATABASE.get(norm_cat, MARKET_DATABASE["_GENERIC"])
    multipliers = db.get("multipliers", {"A": 1.0, "B": 0.8, "C": 0.5, "F": 0.0})
    grade_multiplier = multipliers.get(final_grade.upper(), 0.5)

    # Use category, grade and price to seed random generator for determinism
    seed_str = f"{norm_cat}_{final_grade}_{base_value}"
    rng = random.Random(sum(ord(c) for c in seed_str))

    # 1. B2C Clearance Net Calculation (Indian Rupees)
    processing_costs = base_value * 0.05 + 150.0  # 5% processing + flat fee
    b2c_shipping = 350.0  # flat B2C shipping (correction: e.g. 350)
    
    b2c_clearance_net = (base_value * grade_multiplier) - processing_costs - b2c_shipping
    b2c_clearance_net = max(0.0, b2c_clearance_net)

    # 2. B2B Auction Net Calculation (Indian Rupees)
    demand_mods = {
        "Smartphone": 1.2,
        "Laptop": 1.1,
        "Footwear": 0.9,
        "Apparel": 0.8,
        "HomeGoods": 1.0,
    }
    demand_mod = demand_mods.get(norm_cat, 1.0)
    
    bid_pct = rng.uniform(0.15, 0.25) * demand_mod
    bid_pct = max(0.10, min(0.35, bid_pct))  # clamp
    
    b2b_bid_value = base_value * bid_pct
    pallet_freight_cost = 50.0  # B2B freight per-item is significantly lower (~50) than B2C shipping (350)
    
    b2b_auction_net = b2b_bid_value - pallet_freight_cost
    b2b_auction_net = max(0.0, b2b_auction_net)

    # 3. Dynamic Margin Comparison
    if b2b_auction_net > b2c_clearance_net:
        route = "B2B_AUCTION"
        reason = f"B2B auction net of Rs. {b2b_auction_net:.2f} exceeds B2C clearance net of Rs. {b2c_clearance_net:.2f}"
        expected_recovery = b2b_auction_net
    else:
        route = "B2C_CLEARANCE"
        reason = f"B2C clearance net of Rs. {b2c_clearance_net:.2f} exceeds B2B auction net of Rs. {b2b_auction_net:.2f}"
        expected_recovery = b2c_clearance_net

    return {
        "route": route,
        "reason": reason,
        "expected_recovery": expected_recovery,
        "b2c_net": b2c_clearance_net,
        "b2b_net": b2b_auction_net,
        "b2b_bid": b2b_bid_value,
        "processing_costs": processing_costs,
        "b2c_shipping": b2c_shipping,
        "pallet_freight_cost": pallet_freight_cost
    }


def calculate_nrv_route(
    category: str,
    base_price: float,
    final_grade: str,
    penalty_pct: float,
    defect_counts: Dict[str, int],
    semantic_flags: Dict[str, bool],
    gatekeeper_repairs: List[str]
) -> Dict[str, Any]:
    """
    Pure deterministic Python NRV mathematics (All values in Indian Rupees — INR).
    Inputs: raw AI features + gatekeeper results.
    Outputs: financial route decision with dynamic dispositioning.
    """
    norm_cat = normalize_category(category)
    db = MARKET_DATABASE.get(norm_cat, MARKET_DATABASE["_GENERIC"])

    logistics_fees = db["logistics_fees"]
    multipliers = db["multipliers"]
    yolo_costs = db["yolo_repair_costs"]
    semantic_costs = db["semantic_repair_costs"]

    grade_multiplier = multipliers.get(final_grade.upper(), 0.0)

    # Expected Resale Value
    expected_resale_value = (base_price * grade_multiplier) * (1.0 - penalty_pct)

    # Repair costs from YOLO structural detections
    total_repair_cost = 0.0
    repair_actions: List[str] = []

    for defect, count in defect_counts.items():
        if count > 0:
            cost_per = yolo_costs.get(defect, 0.0)
            total = cost_per * count
            if total > 0:
                total_repair_cost += total
                repair_actions.append(f"YOLO defect '{defect}' * {count}: Rs. {total:.2f}")

    # Repair costs from Moondream semantic flags
    for flag, is_true in semantic_flags.items():
        if is_true:
            cost = semantic_costs.get(flag, 0.0)
            if cost > 0:
                total_repair_cost += cost
                repair_actions.append(f"Semantic flag '{flag}': Rs. {cost:.2f}")

    # Flat repair items from gatekeeper (e.g. battery replacement)
    FLAT_REPAIR_COSTS = {"battery": 4800.0, "missing_parts": 2000.0}
    for repair in gatekeeper_repairs:
        cost = FLAT_REPAIR_COSTS.get(repair, 0.0)
        if cost > 0:
            total_repair_cost += cost
            repair_actions.append(f"Gatekeeper repair '{repair}': Rs. {cost:.2f}")

    # Refurbish Net Recovery Value
    nrv_refurbish = expected_resale_value - total_repair_cost - logistics_fees

    # Calculate dynamic Maximum Recovery Value (MRV) for liquidation/clearance
    mrv_result = calculate_dynamic_mrv(category, final_grade, base_price)
    nrv_liquidate = mrv_result["expected_recovery"]

    # Decision tree
    messages: List[str] = []
    if final_grade.upper() == "F":
        route = "Recycle"
        messages.append("Terminal quality failure. Item routed to Scrap / Recycling.")
    elif nrv_refurbish >= nrv_liquidate:
        route = "Restock/Refurbish"
        messages.append(
            f"NRV_Refurbish (Rs. {nrv_refurbish:.2f}) >= NRV_Liquidate (Rs. {nrv_liquidate:.2f}). Routing to RESTOCK/REFURBISH."
        )
    else:
        route = mrv_result["route"]
        messages.append(
            f"Dynamic liquidation selected: {mrv_result['reason']}. Routing to {route}."
        )

    return {
        "route": route,
        "repair_actions": repair_actions,
        "messages": messages,
        "financials": {
            "base_price": base_price,
            "grade_multiplier": grade_multiplier,
            "expected_resale_value": round(expected_resale_value, 2),
            "total_repair_cost": round(total_repair_cost, 2),
            "logistics_fees": logistics_fees,
            "nrv_refurbish": round(nrv_refurbish, 2),
            "nrv_liquidate": round(nrv_liquidate, 2),
            "mrv_route": mrv_result["route"],
            "mrv_reason": mrv_result["reason"],
            "mrv_expected_recovery": round(mrv_result["expected_recovery"], 2),
        }
    }
