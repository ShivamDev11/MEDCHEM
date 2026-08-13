import app from "./config.js";

import { getFirestore } from "firebase/firestore";

const db = getFirestore(app);

export default db;