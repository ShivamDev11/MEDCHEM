import app from "./config.js";

import { getAuth } from "firebase/auth";

const auth = getAuth(app);

export default auth;