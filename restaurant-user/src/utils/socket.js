import { io } from "socket.io-client";
import { BASE_URL } from "../api/axios";

let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(BASE_URL, {
            autoConnect: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
            console.log("⚡ [WebSocket]: Connected to Restaurant Server", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("🔌 [WebSocket]: Disconnected from Restaurant Server");
        });
    }
    return socket;
};

export default getSocket;
