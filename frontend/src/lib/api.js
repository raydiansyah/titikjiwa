import axios from "axios";

export const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export function errorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const message = detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(" ");

    if (message) return message;
  }

  return "Ada sedikit kendala. Coba lagi sebentar.";
}
