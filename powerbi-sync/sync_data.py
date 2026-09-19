import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
from pathlib import Path


# Get the folder where this Python file is located
BASE_DIR = Path(__file__).resolve().parent

# Firebase service account file
CREDENTIALS_FILE = BASE_DIR / "firebase-service-account.json"

# Data output folder
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)


# -----------------------------
# Firebase Initialization
# -----------------------------
if not firebase_admin._apps:
    cred = credentials.Certificate(str(CREDENTIALS_FILE))
    firebase_admin.initialize_app(cred)

db = firestore.client()


# -----------------------------
# Fetch Collection
# -----------------------------
def fetch_collection(collection_name):
    docs = db.collection(collection_name).stream()

    rows = []

    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        rows.append(data)

    return rows


# -----------------------------
# Collections to Export
# -----------------------------
collections = {
    "medicines": "medicines.csv",
    "sales": "sales.csv",
    "saleItems": "saleItems.csv",
    "inventoryLogs": "inventoryLogs.csv",
    "notifications": "notifications.csv",
}


# -----------------------------
# Sync Firestore → CSV
# -----------------------------
for collection, filename in collections.items():

    print(f"Syncing {collection}...")

    rows = fetch_collection(collection)

    if rows:
        df = pd.DataFrame(rows)

        output_file = DATA_DIR / filename
        df.to_csv(output_file, index=False)

        print(f"Saved {len(rows)} records → {output_file}")

    else:
        print(f"No data found in {collection}")


print("\nSync completed successfully!")