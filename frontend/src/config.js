const isDev = window.location.port === "5173" || window.location.port === "3000";
const envApi = import.meta.env.VITE_API_BASE;

export const API_BASE = envApi
  ? envApi
  : isDev
  ? `http://${window.location.hostname}:5050`
  : window.location.origin;