//realtime connection

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { getUnreadCount } from "../services/chatService";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  const updateUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      if (res.data.success) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  };

  useEffect(() => {
    if (user) {
      updateUnreadCount();
      
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      //Connect to root
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const SOCKET_URL = API_URL.replace('/api/v1', '').replace(/\/$/, '');
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        ///transports: ['websocket']    //rremove to allow polling, auto detects ws or http
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection failed:", err.message);
      });

      newSocket.on("connect", () => {
        console.log("Socket Connected:", newSocket.id);
        newSocket.emit("join", user.id);
      });

      newSocket.on("get_online_users", (usersArray) => {
        setOnlineUsers(new Set(usersArray));
      });

      newSocket.on("user_online", (userId) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.add(userId);
          return newSet;
        });
      });

      newSocket.on("user_offline", (userId) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      newSocket.on("new_message", (payload) => {
        if (payload.sender?.id !== user.id) {
           setUnreadCount((prev) => prev + 1);
        }
      });

      setSocket(newSocket);

      return () => newSocket.disconnect();
    }
  }, [user]);

  

  const isUserOnline = (userId) => onlineUsers.has(userId);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isUserOnline, unreadCount, updateUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context?.socket;
};

export const useSocketContext = () => useContext(SocketContext);
