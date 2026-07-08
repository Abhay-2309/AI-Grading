import torch
from transformers import AutoTokenizer
from PIL import Image
from ultralytics import YOLO
from typing import Dict, List, Any, Optional
from routing import normalize_category

# Global Model References
moondream_model = None
moondream_tokenizer = None
yolo_model = None
device = "cpu"

# Category alias matching for open-ended VLM identification
DETECTION_MAP = {
    "Smartphone":  ["phone", "smartphone", "mobile", "iphone", "cellphone", "cell phone"],
    "Laptop":      ["laptop", "notebook", "macbook", "computer"],
    "Footwear":    ["shoe", "shoes", "sneaker", "sandal", "boot", "footwear"],
    "Apparel":     ["shirt", "t-shirt", "dress", "jacket", "jeans", "clothing",
                    "clothes", "sweater", "hoodie", "kurta", "saree"],
    "HomeGoods":   ["mixer", "blender", "kettle", "iron", "vacuum", "appliance", "fan"],
    "Electronics": ["headphone", "earbud", "speaker", "watch", "smartwatch", "camera"],
    "Books":       ["book", "novel", "textbook"]
}

def initialize_models():
    """
    Sequentially loads YOLO11 and Moondream2 models into memory,
    selecting the best hardware accelerator.
    """
    global moondream_model, moondream_tokenizer, yolo_model, device

    # Determine hardware acceleration
    if torch.backends.mps.is_available():
        device = "mps"
    elif torch.cuda.is_available():
        device = "cuda"
    else:
        device = "cpu"

    print(f"--- INITIALIZING MODELS ON ACCELERATOR: {device} ---")

    # 1. Load custom YOLO11 Model
    print("Loading YOLO11 structural inspection model...")
    yolo_model = YOLO("runs/detect/returniverse_engine/production_run_v1-4/weights/best.pt")
    yolo_model.to(device)
    print("YOLO11 structural model successfully loaded.")

    # 2. Load Moondream2 with Compatibility Patches
    print("Loading Moondream2 VLM engine...")
    import local_moondream.modeling_phi as modeling_phi
    from transformers.generation import GenerationMixin

    if GenerationMixin not in modeling_phi.PhiForCausalLM.__bases__:
        modeling_phi.PhiForCausalLM.__bases__ = (modeling_phi.PhiPreTrainedModel, GenerationMixin)
        print("Patched PhiForCausalLM with GenerationMixin compatibility.")

    from local_moondream.moondream import Moondream

    def custom_query(self, image, question):
        enc_image = self.encode_image(image)
        ans = self.answer_question(enc_image, question, self.tokenizer)
        return {"answer": ans}

    Moondream.query = custom_query

    from local_moondream.configuration_moondream import MoondreamConfig
    config = MoondreamConfig.from_pretrained("./local_moondream")

    moondream_model = Moondream.from_pretrained(
        "./local_moondream",
        config=config,
        trust_remote_code=True
    )
    moondream_tokenizer = AutoTokenizer.from_pretrained("./local_moondream")
    moondream_model.tokenizer = moondream_tokenizer
    moondream_model = moondream_model.to(device)

    print("Moondream2 VLM engine successfully loaded.")
    print("Sequential model loading completed successfully.")


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 1 HELPER — Category Verification (open-ended prompt + keyword match)
# ─────────────────────────────────────────────────────────────────────────────

def verify_category_match(image: Image.Image, claimed_category: str) -> dict:
    """
    Uses Moondream2 to verify the image matches the claimed category.
    AI ROLE: Feature Extraction only — asks open-ended "What object is shown?"
    Matching against category aliases is done in pure Python (DETECTION_MAP).
    """
    if moondream_model is None:
        raise RuntimeError("Moondream model is not initialized.")

    norm_claimed = normalize_category(claimed_category)

    # Open-ended prompt — prevents confirmation bias in small VLMs
    identify_prompt = "What object is shown in this image? Answer in one or two words only."
    enc_image = moondream_model.encode_image(image)
    detected_raw = moondream_model.answer_question(
        enc_image, identify_prompt, moondream_tokenizer, max_new_tokens=20
    ).strip().lower()

    # Keyword matching in Python — NOT in the AI model
    keywords = DETECTION_MAP.get(norm_claimed, [norm_claimed.lower()])
    verified = any(kw in detected_raw for kw in keywords)

    return {
        "claimed": norm_claimed,
        "detected_raw": detected_raw,
        "verified": verified
    }


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 3a — Geometry Engine (YOLO11) — Raw Feature Extraction ONLY
# ─────────────────────────────────────────────────────────────────────────────

def crop_box_with_padding(image: Image.Image, box: List[float], padding_pct: float = 0.1) -> Image.Image:
    w, h = image.size
    x1, y1, x2, y2 = box
    box_w = x2 - x1
    box_h = y2 - y1
    
    pad_w = box_w * padding_pct
    pad_h = box_h * padding_pct
    
    new_x1 = max(0, x1 - pad_w)
    new_y1 = max(0, y1 - pad_h)
    new_x2 = min(w, x2 + pad_w)
    new_y2 = min(h, y2 + pad_h)
    
    return image.crop((new_x1, new_y1, new_x2, new_y2))

def extract_structural_features(image: Image.Image) -> Dict[str, Any]:
    """
    YOLO11 processes the image and returns raw defect counts.
    AI ROLE: Detection only — NO grading, NO points, NO decisions.
    All scoring logic lives in the Rules Engine (routing.py).

    CRITICAL CROP-AND-VERIFY:
    If a YOLO detection has confidence < 0.6, we crop the image around that box
    and ask Moondream VLM to verify if the defect is actually present.
    If the VLM rejects it, we discard the detection.
    """
    if yolo_model is None:
        raise RuntimeError("YOLO model is not initialized.")

    results = yolo_model(image, device=device)

    # Initialize all known classes to zero count
    defect_counts: Dict[str, int] = {
        "crack": 0,
        "dent": 0,
        "scratch": 0,
        "stain": 0,
        "hole_tear": 0,
        "pcb_defect": 0,
        "structural_damage": 0
    }

    raw_detections = []

    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls_id = int(box.cls[0])
            cls_name = yolo_model.names.get(cls_id, "unknown")
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()

            verified_by_vlm = True

            # Target crop-and-verify for low-confidence YOLO boxes (< 0.6)
            if conf < 0.6 and moondream_model is not None:
                try:
                    cropped_img = crop_box_with_padding(image, xyxy, padding_pct=0.1)
                    defect_name = cls_name.replace("_", " ")
                    confirm_prompt = f"Does this image show a {defect_name}? Answer with yes or no only."
                    
                    enc_crop = moondream_model.encode_image(cropped_img)
                    ans = moondream_model.answer_question(
                        enc_crop, confirm_prompt, moondream_tokenizer, max_new_tokens=10
                    ).strip().lower()
                    
                    verified_by_vlm = ans.startswith("yes")
                    print(f"[AI Audit] Low-confidence YOLO defect '{cls_name}' (conf: {conf:.2f}) checked by Moondream. Answer: '{ans}'. Verified: {verified_by_vlm}")
                except Exception as e:
                    print(f"[AI Audit Warning] VLM check failed for low-confidence defect '{cls_name}': {e}")
                    verified_by_vlm = True

            # Increment count for this defect class only if verified
            if verified_by_vlm:
                if cls_name in defect_counts:
                    defect_counts[cls_name] += 1

            raw_detections.append({
                "defect_type": cls_name,
                "box": xyxy,
                "confidence": conf,
                "verified_by_vlm": verified_by_vlm
            })

    return {
        "defect_counts": defect_counts,   # e.g. {"crack": 1, "dent": 0, ...}
        "raw_detections": raw_detections  # full bounding box data for response
    }


# ─────────────────────────────────────────────────────────────────────────────
# MODULE 3b — Semantic Engine (Moondream2) — Boolean Flag Extraction ONLY
# ─────────────────────────────────────────────────────────────────────────────

def extract_semantic_features(image: Image.Image, category: str) -> Dict[str, bool]:
    """
    Moondream2 is queried with category-specific factual questions.
    AI ROLE: Observation only — returns strict boolean flags.
    NO grades, NO downgrading, NO decisions. All rules live in routing.py.
    """
    if moondream_model is None:
        raise RuntimeError("Moondream model is not initialized.")

    norm_cat = normalize_category(category)
    flags: Dict[str, bool] = {}

    # Encode the image once and reuse it for every question below, instead of
    # re-running the vision encoder per-question via .query().
    enc_image = moondream_model.encode_image(image)

    def ask_yes_no(prompt: str) -> bool:
        """Run a yes/no VLM query and parse the boolean result."""
        ans = moondream_model.answer_question(
            enc_image, prompt, moondream_tokenizer, max_new_tokens=10
        ).strip().lower()
        return ans.startswith("yes")

    if norm_cat in ["Smartphone", "Laptop", "Electronics"]:
        flags["has_heavy_dirt"] = ask_yes_no(
            "Is the device's screen or body visibly dirty or stained? Answer yes or no."
        )
        flags["screen_cracked_visible"] = ask_yes_no(
            "Is there a visible crack on the device's screen or casing? Answer yes or no."
        )

    elif norm_cat in ["Apparel", "Footwear"]:
        flags["original_labels_intact"] = ask_yes_no(
            "Are the original brand or price tags still attached to the item? Answer yes or no."
        )
        flags["visible_stains_present"] = ask_yes_no(
            "Are there any visible stains, marks, or discolouration on the item? Answer yes or no."
        )

    elif norm_cat == "HomeGoods":
        flags["signs_of_heavy_use"] = ask_yes_no(
            "Does the item show clear signs of heavy use or wear? Answer yes or no."
        )

    else:
        # Generic fallback flag
        flags["appears_heavily_damaged"] = ask_yes_no(
            "Does the item appear to be heavily damaged or in poor condition? Answer yes or no."
        )

    return flags
