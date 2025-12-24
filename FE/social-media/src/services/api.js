//axios instance (baseURL, headers)
import axios from "axios";
// const api = axios.create({ baseURL: 'http://localhost:8080' });
// export default api;

const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
    withCredentials: true,
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

    //401 + 403 didnt retry
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      //refresh token
      try {
          const { data } = await axios.post("api/v1/auth/refresh-token",
          {},
          { withCredentials: true }
      );
        localStorage.setItem("token", data.accessToken);

        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${data.accessToken}`;

        originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
