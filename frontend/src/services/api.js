import axios from "axios";

// IMPORTANT: Must use 'localhost' (not '127.0.0.1') so the session cookie
// is treated as same-site with the frontend (also on localhost:3000).
// Browsers block cross-site cookies on localhost:3000 → 127.0.0.1:8000.
const API = axios.create({
  baseURL: "http://localhost:8000/api/",
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

// Auto-redirect to login when session expires
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;
