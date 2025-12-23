//axios instance (baseURL, headers)
import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

//req interceptor used to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//resp interceptors to handle 401
api.interceptors.response.use(
  (response) => response, //return data directly
  async (error) => {
    const originalRequest = error.config;


    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/login')) {
      return Promise.reject(error.response?.data || error.message);
    }


    if (error.response?.status === 403 && error.response?.data?.error?.message === 'Your account has been locked') {
       window.location.href = "/banned";
       return Promise.reject(error);
    }

    if (originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error.response?.data || error.message);
    }

    const isTokenError = 
        error.response?.status === 401 || 
        (error.response?.status === 403 && error.response?.data?.message === 'Token không hợp lệ!');


    //401 + 403 didnt retry
    if (isTokenError && !originalRequest._retry) {
      originalRequest._retry = true;

      //refresh token
      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
            return Promise.reject(error.response?.data || error.message);
        }

        const { data } = await axios.post("/api/v1/auth/refresh-token", {
          refreshToken,
        });
        localStorage.setItem("token", data.accessToken);

        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${data.accessToken}`;

        originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;

        return api(originalRequest);
      } catch (err) {
        console.error("Refresh failed",err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (!window.location.pathname.includes('/login')) {
             window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
