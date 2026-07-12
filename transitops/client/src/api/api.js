import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "transitops_token"
    );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(
        "transitops_token"
      );

      localStorage.removeItem(
        "transitops_user"
      );

      /*
       * The AuthContext listens for this event.
       * This avoids importing React context into the API file.
       */
      window.dispatchEvent(
        new Event("transitops:unauthorized")
      );
    }

    return Promise.reject(error);
  }
);

export default api;