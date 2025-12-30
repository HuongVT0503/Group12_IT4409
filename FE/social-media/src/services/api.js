import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Re interceptor:attach token
api.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Resp interceptor: 401/403 n refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/login")
    ) {
      return Promise.reject(error.response?.data || error.message);
    }

    if (
      error.response?.status === 403 &&
      error.response?.data?.error?.message === "Your account has been locked"
    ) {
      window.location.href = "/banned";
      return Promise.reject(error);
    }

    const isTokenError =
      error.response?.status === 401 ||
      (error.response?.status === 403 &&
        error.response?.data?.message === "Token không hợp lệ!");

    if (isTokenError && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          "/api/v1/auth/refresh-token",
          {},
          { withCredentials: true }
        );

        localStorage.setItem("token", data.accessToken);

        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${data.accessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh failed", refreshError);

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");

        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
