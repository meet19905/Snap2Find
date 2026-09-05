const isDev = window.location.port === "5173" || window.location.port === "3000";
export const API_BASE = isDev ? `http://${window.location.hostname}:5050` : window.location.origin;