import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
from pathlib import Path

cred = credentials.Certificate("firebase-service-account.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)


def fetch_collection(collection_name):
    docs = db.collection(collection_name).stream()

    rows = []

    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        rows.append(data)

    return rows


collections = {
    "medicines": "medicines.csv",
    "sales": "sales.csv",
    "saleItems": "saleItems.csv",
    "inventoryLogs": "inventoryLogs.csv",
    "notifications": "notifications.csv",
}


for collection, filename in collections.items():
    print(f"Syncing {collection}...")

    rows = fetch_collection(collection)

    if rows:
        df = pd.DataFrame(rows)
        df.to_csv(DATA_DIR / filename, index=False)
        print(f"Saved {len(rows)} records → {filename}")
    else:
        print(f"No data found in {collection}")

print("\nSync completed successfully!")