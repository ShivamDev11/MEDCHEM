import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import auth from "../../../firebase/auth";

export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};
