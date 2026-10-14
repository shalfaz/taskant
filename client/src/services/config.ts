const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

export const API_URL = configuredApiUrl || "/api";
export const API_ORIGIN = new URL(
  API_URL,
  typeof window === "undefined" ? "http://localhost:3000" : window.location.origin,
).origin;
