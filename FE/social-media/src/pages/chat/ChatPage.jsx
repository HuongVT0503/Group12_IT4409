import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import {
  getConversations,
  getMessages,
  sendMessage,
  getOrCreateConversation,
} from "../../services/chatService";
import { getFollowing } from "../../services/userService";
import {
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Image as ImageIcon,
  Check,
  CheckCheck,
  PlusCircle,
  ArrowLeft,
  Smile
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../../utils/cn";
import { uploadMedia } from "../../services/mediaService";

export default function ChatPage() {
  const { user } = useAuth();
  const socket = useSocket();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [inputText, setInputText] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);

  const typingTimeoutRef = useRef(null);

  const [isMobileListVisible, setIsMobileListVisible] = useState(true);

  const fileInputRef = useRef(null);
  //const [selectedFile, setSelectedFile] = useState(null);

  const [friends, setFriends] = useState([]);

  //fetch conversations + friends onload
  useEffect(() => {
    getConversations()
      .then((res) => {
        setConversations(res.data.conversations || []);
      })
      .catch((error) => {
        console.error("Failed to fetch conversations", error);
      });

    if (user?.id) {
      getFollowing(user.id)
        .then((res) => {
          setFriends(res.data.data || []);
        })
        .catch((error) => console.error("Failed to fetch friends", error));
    }
  }, [user?.id]);

  //isten for realtime messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload) => {
      //payload: { conversationId, message, sender }

      //update conversation list (move to top)
      setConversations((prev) => {
        const others = prev.filter((c) => c.id !== payload.conversationId);
        let updatedConv = prev.find((c) => c.id === payload.conversationId);

        if (updatedConv) {
          updatedConv = {
            ...updatedConv,
            lastMessage: payload.message,
            updated_at: new Date().toISOString(),
          };
          return [updatedConv, ...others];
        }
        return prev; //refetch if not found/new convo
      });

      //if viewing-> append message
      if (selectedChat?.id === payload.conversationId) {
        setMessages((prev) => {
          const incomingSenderId =
            payload.message.sender?.id || payload.sender?.id;
          if (incomingSenderId === user.id) {
            return prev;
          }

          //if ID already exists(deduplication)
          if (prev.some((m) => m.id === payload.message.id)) {
            return prev;
          }

          return [...prev, payload.message];
        });

        scrollToBottom();
      }
    };

    const handleTyping = ({ conversationId, userId, isTyping }) => {
      if (selectedChat?.id === conversationId && userId !== user.id) {
        setTypingUsers((prev) => ({ ...prev, [conversationId]: isTyping }));
      }
    };

    const handleMessageRead = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_read", handleMessageRead);
    socket.on("user_typing", (data) =>
      handleTyping({ ...data, isTyping: true })
    );
    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing");
      socket.off("message_read", handleMessageRead);
    };
  }, [socket, selectedChat, user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]); //auto-scroll

  //select chat &fetch
  const handleSelectChat = async (conv) => {
    setSelectedChat(conv);
    setIsMobileListVisible(false);
    try {
      const res = await getMessages(conv.id);
      setMessages(res.data.messages || []);

      scrollToBottom();

      //join Socket Room for Typing Indicators
      socket.emit("join_conversation", conv.id);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  const handleStartChatWithFriend = async (friend) => {
    try {
      //
      const res = await getOrCreateConversation(friend.id); //raw convo

      if (res.data.success && res.data.conversation) {
        const rawConversation = res.data.conversation;

        if (!rawConversation.id) {
          console.error(
            "Backend returned conversation without ID:",
            rawConversation
          );
          return;
        }

        const conversation = {
          ...rawConversation,
          otherUser: friend, //attach friend obj as otherUser
        };

        //update convo list if neww
        setConversations((prev) => {
          if (prev.find((c) => c.id === conversation.id)) return prev;
          return [conversation, ...prev];
        });

        handleSelectChat(conversation);
      }
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      //loading staet?
      const uploaded = await uploadMedia(file);
      await handleSend(uploaded.url);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      // Reset input so you can select the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return (
      url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null ||
      url.includes("/uploads/")
    );
  };

  //
  const handleSend = async (contentOverride = null) => {
    const actualContent = typeof contentOverride === 'string' ? contentOverride : null;
    const textToSend = actualContent || inputText;
    if (!textToSend?.trim() || !selectedChat) return;

    if (!actualContent) {
      setInputText("");
    } //clear immediately

    //optimistic ui update
    const tempMsg = {
      id: Date.now(),
      content: textToSend,
      sender: { id: user.id },
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages((prev) => [...prev, tempMsg]);

    scrollToBottom();

    try {
      //update list immediately
      setConversations((prev) => {
        const others = prev.filter((c) => c.id !== selectedChat.id);

        const existing = prev.find(c => c.id === selectedChat.id);
        const base = existing || selectedChat;


        const updated = {
          ...base,
          lastMessage: tempMsg,
          updated_at: new Date().toISOString(),
        };
        return [updated, ...others];
      });

      const res = await sendMessage(selectedChat.otherUser.id, textToSend);

      //
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMsg.id ? { ...m, id: res.data.message.id } : m
        )
      );
    } catch (err) {
      console.error("Failed to send", err);
      //remove temp msg
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (socket && selectedChat) {
      socket.emit("typing", selectedChat.id);
      //clear existing timeout
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      //new timeout to stop typing after 2s inactive
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", selectedChat.id);
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const getAvatar = (u) =>
    u?.avatar_url ||
    `https://ui-avatars.com/api/?name=${
      u?.display_name || "User"
    }&background=random`;

  return (
    <div className="flex h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] bg-white rounded-[var(--radius-box)] shadow-sm border border-gray-100 overflow-hidden mt-4">
      {/* LEFT: Conversation List */}
      <div
        className={cn(
          "w-full md:w-[350px] border-r border-gray-100 flex flex-col bg-white",
          !isMobileListVisible && "hidden md:flex" //hide on mobile if chat open
        )}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Messages</h2>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full bg-gray-50 rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/*Horizontal Friends List */}
        {friends.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex flex-col items-center gap-1 min-w-[60px] cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <PlusCircle size={24} />
              </div>
              <span className="text-xs text-gray-500 font-medium truncate w-full text-center">
                New
              </span>
            </div>

            {/* Friend Items */}
            {friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => handleStartChatWithFriend(friend)}
                className="flex flex-col items-center gap-1 min-w-[60px] cursor-pointer group"
              >
                <div className="relative">
                  <img
                    src={getAvatar(friend)}
                    alt={friend.display_name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-100 group-hover:border-primary transition-colors"
                  />

                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <span className="text-xs text-gray-600 font-medium truncate w-[64px] text-center">
                  {friend.display_name?.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {conversations.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">
            No conversations yet
          </div>
        )}

        {conversations.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleSelectChat(chat)}
            className={cn(
              "p-4 flex gap-3 cursor-pointer transition-all border-l-4 border-transparent hover:bg-gray-50",
              selectedChat?.id === chat.id ? "bg-primary/5 border-primary" : ""
            )}
          >
            <div className="relative">
              <img
                src={getAvatar(chat.otherUser)}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
                alt={chat.otherUser?.display_name}
              />
              {/* Online Status: always online??*/}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex justify-between items-baseline mb-0.5">
                <h4
                  className={cn(
                    "font-semibold truncate text-[15px]",
                    selectedChat?.id === chat.id
                      ? "text-primary"
                      : "text-gray-900"
                  )}
                >
                  {chat.otherUser?.display_name}
                </h4>
                <span className="text-[11px] text-gray-400 font-medium">
                  {chat.lastMessage?.created_at
                    ? formatDistanceToNow(
                        new Date(chat.lastMessage.created_at),
                        { addSuffix: false }
                      )
                    : ""}
                </span>
              </div>
              <p
                className={cn(
                  "text-sm truncate",
                  selectedChat?.id === chat.id
                    ? "text-primary/80 font-medium"
                    : "text-gray-500"
                )}
              >
                {/*?user is typing? otherwise show last msg */}
                {typingUsers[chat.id] ? (
                  <span className="italic text-primary animate-pulse">
                    Typing...
                  </span>
                ) : (
                  chat.lastMessage?.content || "Start a conversation"
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
      </div>

      {/* RIGHT: Chat Window */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-gray-50/50",
          isMobileListVisible && "hidden md:flex" //hide on mobile if list is visible
        )}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileListVisible(true)}
                  className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <img
                  src={getAvatar(selectedChat.otherUser)}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  alt="User"
                />
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">
                    {selectedChat.otherUser?.display_name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-xs text-gray-500 font-medium">
                      Online
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-primary">
                <button className="p-2.5 hover:bg-primary/5 rounded-full transition-colors">
                  <Phone size={20} />
                </button>
                <button className="p-2.5 hover:bg-primary/5 rounded-full transition-colors">
                  <Video size={20} />
                </button>
                <button className="p-2.5 hover:bg-primary/5 rounded-full transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-[#F8F9FA]">
              {messages.map((msg, index) => {
                const isMe = msg.sender?.id === user?.id;
                //group logic: check if next msg is same sender to adjust border radius
                const isNextSame =
                  messages[index + 1]?.sender?.id === msg.sender?.id;

                return (
                  <div
                    key={msg.id || index}
                    className={cn(
                      "flex w-full",
                      isMe ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className="flex flex-col max-w-[75%] lg:max-w-[60%]">
                      <div
                        className={cn(
                          "px-5 py-3 shadow-sm text-[15px] leading-relaxed break-words relative group",
                          isMe
                            ? "bg-gradient-primary text-white rounded-2xl rounded-tr-sm"
                            : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm",
                          isNextSame &&
                            (isMe ? "rounded-br-sm" : "rounded-bl-sm") // Stack effect
                        )}
                      >
                        {isImageUrl(msg.content) ? (
                          <img
                            src={msg.content}
                            alt="Attachment"
                            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }} 
                          />
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>

                      {/* Time & Read Receipt */}
                      <div
                        className={cn(
                          "flex items-center gap-1 mt-1 px-1 text-[10px] font-medium text-gray-400",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe && (
                          <span
                            className={
                              msg.is_read ? "text-primary" : "text-gray-300"
                            }
                          >
                            {msg.is_read ? (
                              <CheckCheck size={14} />
                            ) : (
                              <Check size={14} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <label className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                  >
                    <ImageIcon size={22} />
                  </button>
                </label>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="w-full bg-gray-100/80 rounded-[20px] py-3.5 pl-5 pr-12 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/20"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputText.trim()}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-200",
                      inputText.trim()
                        ? "text-primary hover:bg-primary/10"
                        : "text-gray-400 cursor-not-allowed"
                    )}
                  >
                    <Send
                      size={18}
                      className={inputText.trim() ? "translate-x-0.5" : ""}
                    />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/50">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Send size={40} className="text-primary/40 ml-2" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Your Messages
            </h3>
            <p className="text-gray-500 max-w-xs">
              Select a conversation from the list to start chatting or connect
              with new people.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
