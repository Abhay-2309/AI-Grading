# Execution and Verification Block
# Lead Developer: Abhay Sharma (Scholar ID: 2312131)

# Patched Moondream Initializer
# Fixes compatibility issues with transformers >= 4.50 (GenerationMixin) and adds modern .query() syntax

import torch
from transformers import AutoTokenizer

def initialize_patched_moondream():
    # 1. Patch PhiForCausalLM bases at runtime to include GenerationMixin
    import local_moondream.modeling_phi as modeling_phi
    from transformers.generation import GenerationMixin
    
    if GenerationMixin not in modeling_phi.PhiForCausalLM.__bases__:
        modeling_phi.PhiForCausalLM.__bases__ = (modeling_phi.PhiPreTrainedModel, GenerationMixin)
        print("Successfully patched PhiForCausalLM with GenerationMixin compatibility.")

    # 2. Inject modern .query() syntax helper into Moondream
    from local_moondream.moondream import Moondream
    
    def custom_query(self, image, question):
        enc_image = self.encode_image(image)
        ans = self.answer_question(enc_image, question, self.tokenizer)
        return {"answer": ans}
        
    Moondream.query = custom_query
    
    # 3. Load configuration, model, and tokenizer from local snapshot path
    from local_moondream.configuration_moondream import MoondreamConfig
    
    config = MoondreamConfig.from_pretrained("./local_moondream")
    model = Moondream.from_pretrained(
        "./local_moondream",
        config=config,
        trust_remote_code=True
    )
    tokenizer = AutoTokenizer.from_pretrained("./local_moondream")
    model.tokenizer = tokenizer
    
    # 4. Move model to the active device (MPS for Mac GPU, CUDA, or CPU)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    if torch.cuda.is_available():
        device = "cuda"
    model = model.to(device)
    print(f"Model loaded and running on hardware device: {device}")
    
    return model, tokenizer
def run_simulation_suite(model):
    from utils.questions_bank import start_intake
    from PIL import Image

    print("\n=======================================================")
    print("STARTING DUAL-PATHWAY INTAKE SIMULATION SUITE")
    print("=======================================================")

    image_path = "test_image.jpeg"
    image = Image.open(image_path).convert("RGB")

    # Case 1: Path 1 (Marketplace Return) - Valid Case
    print("\n>>> Scenario 1: Valid Marketplace Return (Trusted Source)")
    order_data_valid = {
        "category": "Smartphone",
        "price_paid": 699.00
    }
    result_valid_return = start_intake(
        source="return",
        image=image,
        model=model,
        order_data=order_data_valid
    )
    print(f"Status: {result_valid_return['status']}")
    print(f"Base Value: {result_valid_return.get('base_value')}")
    print(f"Survey Question Count: {len(result_valid_return.get('questions', []))}")
    assert result_valid_return["status"] == "VERIFIED"

    # Case 2: Path 1 (Marketplace Return) - Fraud Case (Classic Soap Bar Scam)
    print("\n>>> Scenario 2: Fraudulent Marketplace Return (Mismatch)")
    order_data_fraud = {
        "category": "Footwear",
        "price_paid": 120.00
    }
    result_fraud_return = start_intake(
        source="return",
        image=image,
        model=model,
        order_data=order_data_fraud
    )
    print(f"Status: {result_fraud_return['status']}")
    print(f"Message: {result_fraud_return.get('message')}")
    print(f"Next Action: {result_fraud_return.get('next_action')}")
    assert result_fraud_return["status"] == "FRAUD_ALERT"

    # Case 3: Path 2 (Second-hand Sell) - Valid Case
    print("\n>>> Scenario 3: Valid Second-hand Sell (Seller claims Smartphone)")
    result_valid_sell = start_intake(
        source="sell",
        image=image,
        model=model,
        user_selected_category="Smartphone"
    )
    print(f"Status: {result_valid_sell['status']}")
    print(f"Survey Question Count: {len(result_valid_sell.get('questions', []))}")
    assert result_valid_sell["status"] == "VERIFIED"

    # Case 4: Path 2 (Second-hand Sell) - Category Mismatch
    print("\n>>> Scenario 4: Mismatched Second-hand Sell (Seller claims Footwear)")
    result_mismatch_sell = start_intake(
        source="sell",
        image=image,
        model=model,
        user_selected_category="Footwear"
    )
    print(f"Status: {result_mismatch_sell['status']}")
    print(f"Message: {result_mismatch_sell.get('message')}")
    print(f"Next Action: {result_mismatch_sell.get('next_action')}")
    assert result_mismatch_sell["status"] == "CATEGORY_MISMATCH"

    print("\n=======================================================")
    print("SIMULATION SUITE COMPLETED SUCCESSFULLY!")
    print("=======================================================")

if __name__ == '__main__':
    from PIL import Image
    import time

    # 1. Execute the function to initialize the engines
    print("--- INITIALIZING PATCHED MOONDREAM ENGINE ---")
    model, tokenizer = initialize_patched_moondream()
    print("Success: Model loaded into Apple Silicon memory.")

    # 2. Define a test image and question
    # Ensure a sample image named 'sample_image.jpg' is in the working directory
    test_image_path = "test_image.jpeg"
    question = "Describe the condition of the main object in this image."

    try:
        print("\n--- RUNNING SEMANTIC INFERENCE ---")
        start_time = time.time()
        
        # 3. Load the image and query the model
        image = Image.open(test_image_path).convert("RGB")
        
        # Note: The patched architecture utilizes the updated .query() syntax
        result = model.query(image, question)["answer"]
        
        execution_time = time.time() - start_time
        print(f"Prompt: '{question}'")
        print(f"Response: {result}")
        print(f"Inference Latency: {execution_time:.2f} seconds")

        # 4. Run the dual-pathway intake simulation
        run_simulation_suite(model)

    except FileNotFoundError:
        print(f"\nERROR: Could not find '{test_image_path}'. Please place a test image in the directory.")
    except Exception as e:
        print(f"\nInference Error: {e}")