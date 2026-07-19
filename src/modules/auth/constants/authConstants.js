export const AUTH_ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
};

export const AUTH_ERRORS = {
  "auth/user-not-found":    "No account found with this email.",
  "auth/wrong-password":    "Incorrect password. Please try again.",
  "auth/invalid-email":     "Please enter a valid email address.",
  "auth/user-disabled":     "This account has been disabled.",
  "auth/too-many-requests": "Too many failed attempts. Please try again later.",
  "auth/invalid-credential":"Invalid email or password.",
  DEFAULT:                  "Login failed. Please try again.",
};

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS:  "Welcome back!",
  LOGOUT_SUCCESS: "You have been logged out.",
};

export const AUTH_VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
};
