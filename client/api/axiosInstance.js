// import axios from "axios";
// import { toast } from "react-hot-toast";
// import {jwtDecode} from "jwt-decode";

// let logoutTimeout;
// let isRedirecting = false;

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,
// });

// // Attach token to every request
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // Handle 401 globally
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     console.log(error);
//     if (error.response?.status === 401 && !isRedirecting) {
//       triggerLogout("Session expired. Please login again.");
//     }
//     return Promise.reject(error);
//   }
// );

// // Central logout function
// export const triggerLogout = (message) => {
//   isRedirecting = true;

//   clearTimeout(logoutTimeout); // Clear any existing timer
//   localStorage.removeItem("token");
//   localStorage.removeItem("user");
//   window.dispatchEvent(new Event("storage"));

//   if (message) toast.error(message);

//   setTimeout(() => {
//     window.location.replace("/login");
//   }, 500);
// };

// // Proactively schedule logout based on JWT expiry
// export const scheduleAutoLogout = (token) => {
//   try {
//     const decoded = jwtDecode(token);
//     const expiryTime = decoded.exp * 1000; // JWT exp in ms
//     const now = Date.now();
//     const timeout = expiryTime - now;

//     if (timeout > 0) {
//       logoutTimeout = setTimeout(() => {
//         triggerLogout("Session expired. Please login again.");
//       }, timeout);
//     }
//   } catch (err) {
//     console.error("Failed to schedule auto logout:", err);
//   }
// };

// export default api;


import axios from "axios";
import { toast } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

let logoutTimeout;
let isRedirecting = false;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Check if the failed request was a LOGIN request
    // We don't want to redirect if the user simply typed the wrong password
    const isLoginEndpoint = error.config.url.includes("/login") || error.config.url.includes("/auth");

    if (error.response?.status === 401 && !isLoginEndpoint && !isRedirecting) {
      triggerLogout("Session expired. Please login again.");
    }
    
    return Promise.reject(error);
  }
);

// Central logout function
export const triggerLogout = (message) => {
  if (isRedirecting) return; // Prevent multiple triggers
  isRedirecting = true;

  clearTimeout(logoutTimeout); 
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  
  // Notify other tabs/components that storage changed
  window.dispatchEvent(new Event("storage"));

  if (message) toast.error(message);

  setTimeout(() => {
    window.location.replace("/login");
  }, 500);
};

// Proactively schedule logout based on JWT expiry
export const scheduleAutoLogout = (token) => {
  try {
    if (!token) return;
    
    const decoded = jwtDecode(token);
    const expiryTime = decoded.exp * 1000; 
    const now = Date.now();
    const timeout = expiryTime - now;

    // Only schedule if the token is actually in the future
    if (timeout > 0) {
      clearTimeout(logoutTimeout);
      logoutTimeout = setTimeout(() => {
        triggerLogout("Your session has timed out.");
      }, timeout);
    } else {
      // If token is already expired when we check it
      triggerLogout();
    }
  } catch (err) {
    console.error("Failed to schedule auto logout:", err);
  }
};

// axios.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // Check for a custom flag we will send
//     const skipToast = error.config?.skipToast;

//     if (!skipToast) {
//       toast.error(error.response?.data?.message || "An error occurred");
//     }
//     return Promise.reject(error);
//   }
// );


export default api;
