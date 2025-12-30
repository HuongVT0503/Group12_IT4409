const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

export const BACKEND_ROOT = API_URL.replace('/api/v1', '').replace(/\/$/, '');

export const getMediaUrl = (path) => {
  if (!path) return null;

  if (path.startsWith("http")) {
    return path; 
  }

  if (path.startsWith("/")) {
    return `${BACKEND_ROOT}${path}`;
  }

  return `${BACKEND_ROOT}/${path}`;
};