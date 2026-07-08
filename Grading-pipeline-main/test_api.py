import subprocess
import time
import requests
import sys
import json
import os

def test_api():
    print("=========================================================")
    print("STARTING RETURNIVERSE API SYSTEM INTEGRATION TEST SUITE")
    print("=========================================================")

    # 1. Start the FastAPI server using uvicorn as a subprocess
    # Cwd will be current directory
    print("\nStarting FastAPI server on port 8000...")
    cmd = [r".\env\Scripts\uvicorn.exe", "main:app", "--port", "8000", "--log-level", "info"]
    
    # On Windows, using PIPE for stdout/stderr causes pipe-buffer deadlock.
    # Redirect output to a file instead so uvicorn is never blocked.
    server_log = open("server_startup.log", "w")
    server_process = subprocess.Popen(
        cmd,
        stdout=server_log,
        stderr=server_log,
    )
    
    base_url = "http://localhost:8000"
    
    # 2. Wait for server to load models and become healthy
    print("Waiting for YOLO11 and Moondream2 to load sequentially (this may take up to 300 seconds on CPU)...")
    loaded = False
    for i in range(100):
        try:
            r = requests.get(f"{base_url}/health", timeout=3)
            if r.status_code == 200:
                data = r.json()
                if data.get("yolo_loaded") and data.get("moondream_loaded"):
                    print("SUCCESS: Models loaded. API is fully online and healthy!")
                    loaded = True
                    break
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(3)
        print(f"  polling health endpoint ({3 * (i+1)}s elapsed)...")
        
    if not loaded:
        print("ERROR: Server failed to start or load models in time.")
        server_log.flush()
        server_log.close()
        server_process.terminate()
        server_process.wait()
        print("--- Server startup log ---")
        with open("server_startup.log", "r") as f:
            print(f.read())
        sys.exit(1)

    try:
        # 3. Test survey endpoint
        print("\n>>> Testing Gatekeeper Survey retrieval for Smartphone...")
        r = requests.get(f"{base_url}/api/v1/gatekeeper/survey/Smartphone")
        assert r.status_code == 200
        survey = r.json()
        print(f"Successfully retrieved survey. Found {len(survey)} questions.")
        assert len(survey) > 0
        assert survey[0]["id"] == "powers_on"

        # 4. Test gatekeeper evaluation - Terminal Case
        print("\n>>> Testing Gatekeeper Evaluation (Terminal Case: powers_on=no)...")
        eval_payload_terminal = {
            "category": "Smartphone",
            "answers": {
                "powers_on": False,
                "water_damage": False
            }
        }
        r = requests.post(f"{base_url}/api/v1/gatekeeper/evaluate", json=eval_payload_terminal)
        assert r.status_code == 200
        res = r.json()
        print(f"Evaluation response: is_terminal={res['is_terminal']}, reason='{res['reason']}'")
        assert res["is_terminal"] is True
        assert res["grade_cap"] == "F"

        # 5. Test gatekeeper evaluation - Non-Terminal Cap Case
        print("\n>>> Testing Gatekeeper Evaluation (Non-Terminal Cap Case: battery_health=no)...")
        eval_payload_cap = {
            "category": "Smartphone",
            "answers": {
                "powers_on": True,
                "water_damage": False,
                "icloud_frp_lock": True,
                "imei_blacklist": True,
                "battery_health": False # caps at B
            }
        }
        r = requests.post(f"{base_url}/api/v1/gatekeeper/evaluate", json=eval_payload_cap)
        assert r.status_code == 200
        res = r.json()
        print(f"Evaluation response: is_terminal={res['is_terminal']}, grade_cap='{res['grade_cap']}'")
        assert res["is_terminal"] is False
        assert res["grade_cap"] == "B"
        assert "battery" in res["extra_repairs"]

        # 6. Test Module 1 Intake API - Valid Return (Path 1)
        print("\n>>> Testing Intake Path 1: Valid Marketplace Return...")
        files = {
            "image": ("test_image.jpeg", open("test_image.jpeg", "rb"), "image/jpeg")
        }
        data = {
            "source": "return",
            "order_id": "ORD-1001"
        }
        r = requests.post(f"{base_url}/api/v1/intake", data=data, files=files)
        assert r.status_code == 200
        res = r.json()
        print(f"Intake Status: {res['status']}, Normalized Category: {res['category']}, Price Paid: Rs. {res['base_value']}")
        assert res["status"] == "VERIFIED"
        assert res["category"] == "Smartphone"
        assert res["base_value"] == 64000.0

        # 7. Test Module 1 Intake API - Fraud Return (Path 1 mismatch)
        print("\n>>> Testing Intake Path 1: Fraudulent Marketplace Return (Phone image for Footwear)...")
        files = {
            "image": ("test_image.jpeg", open("test_image.jpeg", "rb"), "image/jpeg")
        }
        data = {
            "source": "return",
            "order_id": "ORD-1003" # Footwear order
        }
        r = requests.post(f"{base_url}/api/v1/intake", data=data, files=files)
        assert r.status_code == 200
        res = r.json()
        print(f"Intake Status: {res['status']}, Message: '{res['message']}', Next Action: '{res['next_action']}'")
        assert res["status"] == "FRAUD_ALERT"
        assert res["next_action"] == "route_to_manual_review"

        # 8. Test Module 1 Intake API - Valid Sell (Path 2)
        print("\n>>> Testing Intake Path 2: Valid Second-hand Sell...")
        files = {
            "image": ("test_image.jpeg", open("test_image.jpeg", "rb"), "image/jpeg")
        }
        data = {
            "source": "sell",
            "claimed_category": "Smartphone"
        }
        r = requests.post(f"{base_url}/api/v1/intake", data=data, files=files)
        assert r.status_code == 200
        res = r.json()
        print(f"Intake Status: {res['status']}, Normalized Category: {res['category']}")
        assert res["status"] == "VERIFIED"

        # 9. Test Module 1 Intake API - Mismatched Sell (Path 2 mismatch)
        print("\n>>> Testing Intake Path 2: Mismatched Second-hand Sell...")
        files = {
            "image": ("test_image.jpeg", open("test_image.jpeg", "rb"), "image/jpeg")
        }
        data = {
            "source": "sell",
            "claimed_category": "Footwear"
        }
        r = requests.post(f"{base_url}/api/v1/intake", data=data, files=files)
        assert r.status_code == 200
        res = r.json()
        print(f"Intake Status: {res['status']}, Message: '{res['message']}', Next Action: '{res['next_action']}'")
        assert res["status"] == "CATEGORY_MISMATCH"
        assert res["next_action"] == "reselect_or_reshoot"

        # 10. Test Module 3 Vision Engine
        print("\n>>> Testing Dual-AI Vision Engine (YOLO structural + Moondream semantic)...")
        files = {
            "image": ("test_image.jpeg", open("test_image.jpeg", "rb"), "image/jpeg")
        }
        data = {
            "category": "Smartphone",
            "gatekeeper_cap": "B"
        }
        r = requests.post(f"{base_url}/api/v1/evaluate/vision", data=data, files=files)
        assert r.status_code == 200
        res = r.json()
        print(f"Structural Features: {res['structural_features']}")
        print(f"Semantic Features:   {res['semantic_features']}")
        print(f"Raw Detections:      {res['raw_detections']}")
        assert "structural_features" in res
        assert "semantic_features" in res

        # 11. Test Module 4 full disposition endpoint - Valid smartphone sell
        print("\n>>> Testing End-to-End Disposition Routing (Smartphone Sell with no defects)...")
        answers = {
            "powers_on": True,
            "water_damage": False,
            "icloud_frp_lock": True,
            "imei_blacklist": True,
            "battery_health": True,
            "touch_sensors": True,
            "charger_box": True,
            "invoice": True
        }
        files = {
            "image": ("test_image.jpeg", open("test_image.jpeg", "rb"), "image/jpeg")
        }
        data = {
            "source": "sell",
            "claimed_category": "Smartphone",
            "gatekeeper_answers": json.dumps(answers)
        }
        r = requests.post(f"{base_url}/api/v1/evaluate/disposition", data=data, files=files)
        assert r.status_code == 200
        res = r.json()
        print(f"Reconciled Final Grade: {res['final_grade']}")
        print(f"Assigned Route: {res['route']}")
        print(f"Expected Resale Value: Rs. {res['financials']['expected_resale_value']:.2f}")
        print(f"Total Repair Cost: Rs. {res['financials']['total_repair_cost']:.2f}")
        print(f"NRV Refurbish: Rs. {res['financials']['nrv_refurbish']:.2f}")
        print(f"NRV Liquidate: Rs. {res['financials']['nrv_liquidate']:.2f}")
        print(f"Dispositions Decisions: {res['messages']}")
        print(f"Repair Actions: {res['repair_actions']}")
        assert res["route"] in ["Recycle", "Restock/Refurbish", "B2B Liquidation"]
 
        # 12. Test Module 4 full disposition endpoint - Smartphone Terminal Return
        print("\n>>> Testing End-to-End Disposition Routing (Smartphone Return with terminal water_damage)...")
        answers_terminal = {
            "powers_on": True,
            "water_damage": True # terminal
        }
        files = {
            "image": ("test_image.jpeg", open("test_image.jpeg", "rb"), "image/jpeg")
        }
        data = {
            "source": "return",
            "order_id": "ORD-1001",
            "gatekeeper_answers": json.dumps(answers_terminal)
        }
        r = requests.post(f"{base_url}/api/v1/evaluate/disposition", data=data, files=files)
        assert r.status_code == 200
        res = r.json()
        print(f"Assigned Route: {res['route']}")
        print(f"Reconciled Final Grade: {res['final_grade']}")
        print(f"Expected Resale Value: Rs. {res['financials']['expected_resale_value']:.2f}")
        assert res["route"] == "Recycle"
        assert res["final_grade"] == "F"

        print("\n=========================================================")
        print("ALL SYSTEM INTEGRATION TESTS COMPLETED SUCCESSFULLY!")
        print("=========================================================")

    except Exception as e:
        print("\nTEST FAILED WITH ERROR:", e)
        raise e
        
    finally:
        # Shutdown uvicorn server
        print("\nShutting down FastAPI server...")
        server_process.terminate()
        server_process.wait()
        server_log.flush()
        server_log.close()
        print("Server shutdown completed.")

if __name__ == "__main__":
    test_api()
