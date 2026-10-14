const configuredApiUrl =
  typeof process === "undefined" ? undefined : process.env.NEXT_PUBLIC_API_URL;

export const API_URL = configuredApiUrl || "http://localhost:5000/api";
export const API_ORIGIN = new URL(API_URL).origin;
