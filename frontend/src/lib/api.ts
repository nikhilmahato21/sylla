import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);
