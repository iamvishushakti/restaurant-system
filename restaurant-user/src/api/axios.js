import axios from "axios";

// Auto-detect Host: Automatically resolves backend URL for localhost and local network devices (e.g. 192.168.x.x)
const getBaseURL = () => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && !envUrl.includes("localhost")) {
        return envUrl;
    }
    const hostname = typeof window !== "undefined" && window.location.hostname 
        ? window.location.hostname 
        : "localhost";
    return `http://${hostname}:5000`;
};

const BASE_URL = getBaseURL();

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;
export { api, BASE_URL, getBaseURL };
