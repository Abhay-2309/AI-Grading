import ai_engine
from PIL import Image
from routing import normalize_category

# Initialize models
ai_engine.initialize_models()

# Load image
img_path = "../AI1/tests/fixtures/images/view_front.jpg"
image = Image.open(img_path)

# Verify category
claimed = "Apparel_Shirt"
category = normalize_category(claimed)
print(f"Normalized category: {category}")

v_res = ai_engine.verify_category_match(image, category)
print("Verification result:")
print(v_res)
