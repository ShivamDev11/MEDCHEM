import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("firebase-service-account.json")

firebase_admin.initialize_app(cred)

db = firestore.client()

medicines = db.collection("medicines").limit(5).stream()

print("\nFirebase connection successful!\n")

for medicine in medicines:
    print(medicine.id, medicine.to_dict())