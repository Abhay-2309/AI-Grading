import requests
import json

url = "http://127.0.0.1:8000/api/v1/evaluate/disposition"
files = {
    "image": ("test_image.jpeg", open("test_image.jpeg", "rb"), "image/jpeg")
}
data = {
    "source": "sell",
    "claimed_category": "Books",
    "gatekeeper_answers": json.dumps({})
}

print("Sending request to FastAPI disposition endpoint...")
response = requests.post(url, data=data, files=files)
print("Status Code:", response.status_code)
print("Response JSON:")
print(json.dumps(response.json(), indent=2))
