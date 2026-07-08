# =====================================================================
# NON-VISUAL GATEKEEPER QUESTION BANK
# Questions a photo CANNOT answer — asked BEFORE vision inference
# =====================================================================

QUESTION_BANK = {

    "Smartphone": [
        {"id": "powers_on",        "q": "Does the device power on and boot to the home screen?",
         "impact": "terminal", "fail_on": "no",  "reason": "Dead hardware — motherboard-level failure"},
        {"id": "water_damage",     "q": "Is the LDI (liquid damage indicator) strip in the SIM tray red/triggered?",
         "impact": "terminal", "fail_on": "yes", "reason": "Internal water damage — unsellable"},
        {"id": "icloud_frp_lock",  "q": "Is the device free of iCloud/Google FRP activation lock?",
         "impact": "terminal", "fail_on": "no",  "reason": "Locked device cannot be resold legally"},
        {"id": "imei_blacklist",   "q": "Is the IMEI clean (not reported stolen/blacklisted)?",
         "impact": "terminal", "fail_on": "no",  "reason": "Blacklisted — legal risk"},
        {"id": "battery_health",   "q": "Is battery health above 80%?",
         "impact": "grade_cap", "fail_on": "no", "cap": "B", "adds_repair": "battery"},
        {"id": "touch_sensors",    "q": "Do touchscreen, Face ID/fingerprint, cameras, speakers all work?",
         "impact": "grade_cap", "fail_on": "no", "cap": "C"},
        {"id": "charger_box",      "q": "Are the original charger, cable, and box present?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.05},
        {"id": "invoice",          "q": "Is a valid purchase invoice/bill provided?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.10},
        {"id": "warranty_active",  "q": "Is the device still under manufacturer warranty?",
         "impact": "info"}
    ],

    "Laptop": [
        {"id": "posts_boots",      "q": "Does the laptop POST and boot to OS with display output?",
         "impact": "terminal", "fail_on": "no",  "reason": "Motherboard/display failure"},
        {"id": "liquid_corrosion", "q": "Any liquid spill history or visible corrosion under keyboard?",
         "impact": "terminal", "fail_on": "yes", "reason": "Corrosion spreads — terminal"},
        {"id": "bios_lock",        "q": "Is the device free of BIOS/admin/MDM enrollment locks?",
         "impact": "terminal", "fail_on": "no",  "reason": "Enterprise-locked — unsellable"},
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
        {"id": "worn_washed",      "q": "Has the item been worn, washed, or does it carry odor (perfume/sweat/smoke)?",
         "impact": "terminal", "fail_on": "yes", "reason": "Hygiene policy — cannot restock"},
        {"id": "altered",          "q": "Has the garment been altered/tailored (hemmed, resized)?",
         "impact": "terminal", "fail_on": "yes", "reason": "Altered items are unsellable as new"},
        {"id": "tags_attached",    "q": "Are the original brand tags and price tags still attached?",
         "impact": "grade_cap", "fail_on": "no", "cap": "B"},
        {"id": "original_packing", "q": "Is the original polybag/packaging present?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.05},
        {"id": "size_label",       "q": "Is the size/care label intact and legible?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.05}
    ],

    "Footwear": [
        {"id": "worn_outdoors",    "q": "Do the soles show outdoor wear (dirt, sole abrasion)?",
         "impact": "terminal", "fail_on": "yes", "reason": "Worn footwear — hygiene/resale policy"},
        {"id": "both_pairs",       "q": "Are both shoes of the pair present and matching in size?",
         "impact": "terminal", "fail_on": "no",  "reason": "Incomplete pair — scrap/donate"},
        {"id": "shoebox_present",  "q": "Is the original branded shoebox included?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.07},
        {"id": "insoles_laces",    "q": "Are the original insoles and laces present?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.04}
    ],

    "HomeGoods": [   # mixers, kettles, vacuum cleaners, appliances
        {"id": "powers_functions", "q": "Does the primary motor/heating element power on and operate?",
         "impact": "terminal", "fail_on": "no",  "reason": "Core mechanical failure — parts salvage"},
        {"id": "safety_hazard",    "q": "Any burning smell, sparking, exposed wiring, or gas leak?",
         "impact": "terminal", "fail_on": "yes", "reason": "Safety hazard — cannot legally resell"},
        {"id": "food_contact_used","q": "Has a food-contact item (blender jar, cookware) been used?",
         "impact": "grade_cap", "fail_on": "yes", "cap": "C"},
        {"id": "parts_complete",   "q": "Are all attachments, screws, and assembly parts present?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.08, "adds_repair": "missing_parts"},
        {"id": "manual_warranty",  "q": "Are the user manual and warranty card included?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.03},
        {"id": "invoice",          "q": "Is the purchase invoice provided?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.08}
    ],

    "Electronics": [   # generic: headphones, speakers, smartwatches, cameras
        {"id": "powers_on",        "q": "Does the device power on and perform its core function?",
         "impact": "terminal", "fail_on": "no",  "reason": "Dead device — e-waste"},
        {"id": "water_damage",     "q": "Any exposure to water/moisture (unless waterproof-rated)?",
         "impact": "terminal", "fail_on": "yes", "reason": "Moisture damage — terminal"},
        {"id": "pairing_lock",     "q": "Is the device unpaired/reset from previous accounts?",
         "impact": "terminal", "fail_on": "no",  "reason": "Account-locked device"},
        {"id": "battery_charges",  "q": "Does the battery charge and hold charge normally?",
         "impact": "grade_cap", "fail_on": "no", "cap": "B", "adds_repair": "battery"},
        {"id": "accessories",      "q": "Are cables, ear-tips, straps, and case included?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.05},
        {"id": "invoice",          "q": "Is a purchase invoice provided?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.08}
    ],

    "Books": [
        {"id": "pages_intact",     "q": "Are all pages present with no tears or missing sections?",
         "impact": "terminal", "fail_on": "no",  "reason": "Incomplete book — recycle"},
        {"id": "writing_marks",    "q": "Is the book free of highlighting, notes, or name markings?",
         "impact": "grade_cap", "fail_on": "no", "cap": "C"},
        {"id": "water_smell",      "q": "Any water warping, mold smell, or dampness?",
         "impact": "terminal", "fail_on": "yes", "reason": "Mold risk — cannot restock"}
    ],

    # -------- FALLBACK for manually-entered / unmapped categories --------
    "_GENERIC": [
        {"id": "core_functional",  "q": "Does the item perform its core intended function?",
         "impact": "terminal", "fail_on": "no",  "reason": "Non-functional — scrap"},
        {"id": "hygiene_safety",   "q": "Any hygiene issue, contamination, or safety hazard?",
         "impact": "terminal", "fail_on": "yes", "reason": "Policy violation — cannot resell"},
        {"id": "complete",         "q": "Are all original parts, accessories, and packaging present?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.07},
        {"id": "invoice",          "q": "Is proof of purchase provided?",
         "impact": "penalty", "fail_on": "no", "penalty_pct": 0.08}
    ]
}

CATEGORY_ALIASES = {
    "clothes": "Apparel", "clothing": "Apparel", "fashion": "Apparel",
    "shoes": "Footwear", "mobile": "Smartphone", "phone": "Smartphone",
    "appliances": "HomeGoods", "home goods": "HomeGoods"
}

def normalize_category(raw: str) -> str:
    key = raw.strip().lower()
    return CATEGORY_ALIASES.get(key, raw.strip().title())

def grade_order(g: str) -> int:  # A=0 best ... F=3 worst
    grades = {"A": 0, "B": 1, "C": 2, "F": 3}
    return grades.get(g.upper(), 3)

def evaluate_survey(category: str, answers: dict):
    """
    answers: {"powers_on": True, "water_damage": False, ...}
    Returns: (is_terminal, reason, grade_cap, total_penalty_pct, extra_repairs)
    """
    norm_cat = normalize_category(category)
    questions = QUESTION_BANK.get(norm_cat, QUESTION_BANK["_GENERIC"])
    grade_cap, penalty_pct, extra_repairs = "A", 0.0, []

    for q in questions:
        ans = answers.get(q["id"])
        if ans is None:
            continue
        
        failed = False
        if q["impact"] != "info":
            failed = (ans is False and q["fail_on"] == "no") or \
                     (ans is True  and q["fail_on"] == "yes")

        if not failed:
            continue
        if q["impact"] == "terminal":
            return True, q["reason"], "F", 0.0, []
        if q["impact"] == "grade_cap":
            # take the WORST cap seen (C worse than B)
            if grade_order(q["cap"]) > grade_order(grade_cap):
                grade_cap = q["cap"]
            if q.get("adds_repair"):
                extra_repairs.append(q["adds_repair"])
        if q["impact"] == "penalty":
            penalty_pct += q["penalty_pct"]
            if q.get("adds_repair"):
                extra_repairs.append(q["adds_repair"])

    return False, "Gatekeeper passed", grade_cap, penalty_pct, extra_repairs

def verify_category_match(image, claimed_category: str, model) -> dict:
    """
    Moondream checks whether the photo matches the user-selected category.
    Runs BEFORE the question bank is shown.
    """
    norm_claimed = normalize_category(claimed_category)

    # Ask open-ended first — more reliable than yes/no leading questions
    identify_prompt = "What object is shown in this image? Answer in one or two words only."
    detected = model.query(image, identify_prompt)["answer"].strip().lower()

    # Map what Moondream sees to our category taxonomy
    DETECTION_MAP = {
        "Smartphone":  ["phone", "smartphone", "mobile", "iphone", "cellphone"],
        "Laptop":      ["laptop", "notebook", "macbook", "computer"],
        "Footwear":    ["shoe", "shoes", "sneaker", "sandal", "boot", "footwear"],
        "Apparel":     ["shirt", "t-shirt", "dress", "jacket", "jeans", "clothing",
                        "clothes", "sweater", "hoodie", "kurta", "saree"],
        "HomeGoods":   ["mixer", "blender", "kettle", "iron", "vacuum", "appliance", "fan"],
        "Electronics": ["headphone", "earbud", "speaker", "watch", "smartwatch", "camera"],
        "Books":       ["book", "novel", "textbook"]
    }

    keywords = DETECTION_MAP.get(norm_claimed, [norm_claimed.lower()])
    matched = any(kw in detected for kw in keywords)

    return {
        "claimed": norm_claimed,
        "detected_raw": detected,
        "verified": matched
    }

def start_intake(source: str, image, model, order_data=None, user_selected_category=None):
    """
    source: "return" (Path 1) or "sell" (Path 2)
    """
    if source == "return":
        if not order_data:
            return {
                "status": "ERROR",
                "message": "Missing order data for marketplace return."
            }
        category = normalize_category(order_data["category"])
        base_value = order_data["price_paid"]          # actual invoice price!

        # Lightweight check: verify photo against claimed category to prevent fraud
        verification = verify_category_match(image, category, model)
        if not verification["verified"]:
            return {
                "status": "FRAUD_ALERT",
                "message": f"Fraud Alert: Return claims category '{verification['claimed']}' but photo shows '{verification['detected_raw']}'.",
                "claimed": verification["claimed"],
                "detected_raw": verification["detected_raw"],
                "next_action": "route_to_manual_review"
            }

    elif source == "sell":
        if not user_selected_category:
            return {
                "status": "ERROR",
                "message": "Missing user selected category for second-hand sell."
            }
        category = normalize_category(user_selected_category)
        base_value = None   # will fall back to category market value in NRV stage

        # Untrusted: verify photo against claimed category first
        verification = verify_category_match(image, category, model)
        if not verification["verified"]:
            return {
                "status": "CATEGORY_MISMATCH",
                "message": f"Category Mismatch: You selected '{verification['claimed']}' but the photo "
                           f"appears to show '{verification['detected_raw']}'. "
                           f"Please re-check the category or upload a clearer photo.",
                "claimed": verification["claimed"],
                "detected_raw": verification["detected_raw"],
                "next_action": "reselect_or_reshoot"
            }

    else:
        return {
            "status": "ERROR",
            "message": f"Unknown source type '{source}'."
        }

    # Both paths converge here → serve the question bank
    return {
        "status": "VERIFIED",
        "category": category,
        "base_value": base_value,
        "questions": QUESTION_BANK.get(category, QUESTION_BANK["_GENERIC"])
    }