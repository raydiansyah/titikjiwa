import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

export function errorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const joined = detail.map((item) => item?.msg).filter(Boolean).join(" ");
    if (joined) return joined;
  }
  return "Ada sedikit kendala. Coba lagi sebentar.";
}
