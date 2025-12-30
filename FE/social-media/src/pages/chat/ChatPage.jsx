import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import {
  getConversations,
  getMessages,
  sendMessage,
  getOrCreateConversation,
  searchMessages,
} from "../../services/chatService";
import { getFollowing } from "../../services/userService";
import {
  Send,
  Search,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Smile,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../../utils/cn";
import { uploadMedia } from "../../services/mediaService";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";

export default function ChatPage() {
  const { user } = useAuth();
  const { socket, isUserOnline, updateUnreadCount } = useSocketContext();
  const location = useLocation();

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [isMsgSearchOpen, setIsMsgSearchOpen] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [msgSearchResults, setMsgSearchResults] = useState([]);
  const [isSearchingMsg, setIsSearchingMsg] = useState(false);

  const { id: routeChatId } = useParams();
  const navigate = useNavigate();

  //fetch conversations + friends onload
  useEffect(() => {
    getConversations()
      .then((res) => {
        const rawConvos = res.data.conversations || [];

        //remove duplicate convos
        const uniqueConvos = [];
        const seenUserIds = new Set();

        rawConvos.forEach((conv) => {
          if (!seenUserIds.has(conv.otherUser.id)) {
            seenUserIds.add(conv.otherUser.id);
            uniqueConvos.push(conv);
          }
        });
        setConversations(uniqueConvos);
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
            lastMessage: {
              ...payload.message,
              sender: payload.sender || payload.message.sender,
            },
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
  }, [messages]);
  //auto-scroll

  //restore last active chat
  useEffect(() => {
    if (location.state?.conversation) {
      const passedConvo = location.state.conversation;
      setConversations((prev) => {
        if (prev.find((c) => c.id === passedConvo.id)) return prev;
        return [passedConvo, ...prev];
      });
      handleSelectChat(passedConvo);

      window.history.replaceState({}, document.title);
      return;
    }

    //convo are loaded
    if (conversations.length === 0) return;

    let targetId = routeChatId;

    if (targetId && String(selectedChat?.id) !== String(targetId)) {
      const conv = conversations.find((c) => String(c.id) === String(targetId));
      if (conv) {
        loadChatData(conv);
      }
    }
  }, [routeChatId, conversations, location.state, selectedChat?.id]);
  //run when URL changes or convos load

  //debounce message search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (msgSearchQuery.trim().length > 0 && selectedChat) {
        setIsSearchingMsg(true);
        try {
          const res = await searchMessages(selectedChat.id, msgSearchQuery);
          setMsgSearchResults(res.data.results || []);
        } catch (error) {
          console.error("Message search failed", error);
        } finally {
          setIsSearchingMsg(false);
        }
      } else {
        setMsgSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [msgSearchQuery, selectedChat]);

  //select chat &fetch
  const loadChatData = async (conv) => {
    setIsMsgSearchOpen(false);
    setMsgSearchQuery("");
    setMsgSearchResults([]);
    setIsSearchingMsg(false);
    //realtime read/unread
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conv.id && c.lastMessage) {
          return {
            ...c,
            lastMessage: { ...c.lastMessage, is_read: true },
          };
        }
        return c;
      })
    );

    setSelectedChat(conv);
    setIsMobileListVisible(false);

    //navigate(`/chat/${conv.id}`); //update URL wo reload

    localStorage.setItem("lastActiveChatId", conv.id);

    setMessages([]);
    setInputText("");

    try {
      const res = await getMessages(conv.id);
      setMessages(res.data.messages || []);

      scrollToBottom();
      //join Socket Room for Typing Indicators
      socket.emit("join_conversation", conv.id);

      if (updateUnreadCount) updateUnreadCount();
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  const handleSelectChat = (conv) => {
    navigate(`/chat/${conv.id}`);
  };

  const handleStartChatWithFriend = async (friend) => {
    try {
      //
      const res = await getOrCreateConversation(friend.id);
      //raw convo

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
          isBanned: friend.isBanned || friend.is_banned,
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
      await handleSend(null, uploaded.url);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      // Reset input so you can select the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
    //url.includes("/uploads/")
    //);
  };

  const isVideoUrl = (url) => {
    if (!url) return false;
    return (
      url.match(/\.(mp4|webm|ogg|mov)$/i) != null || url.includes("data:video")
    );
  };

  //
  const handleSend = async (
    contentOverride = null,
    mediaUrlOverride = null
  ) => {
    const actualContent =
      typeof contentOverride === "string" ? contentOverride : inputText;
    const actualMedia = mediaUrlOverride || null;

    const textToSend = actualContent || inputText;
    const mediaToSend = mediaUrlOverride || null;

    if ((!actualContent?.trim() && !actualMedia) || !selectedChat) return;
    if ((!textToSend?.trim() && !mediaToSend) || !selectedChat) return;

    if (!contentOverride) {
      setInputText("");
    } //clear immediately

    //optimistic ui update
    const tempMsg = {
      id: Date.now(),
      content: textToSend,
      mediaUrl: actualMedia,
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

        const existing = prev.find((c) => c.id === selectedChat.id);
        const base = existing || selectedChat;

        const updated = {
          ...base,
          lastMessage: tempMsg,
          updated_at: new Date().toISOString(),
        };
        return [updated, ...others];
      });

      const res = await sendMessage(
        selectedChat.otherUser.id,
        actualContent,
        actualMedia
      );

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

      if (err.response?.data?.code === "USER_BANNED") {
        //trigger ui stwitch
        setSelectedChat((prev) => ({
          ...prev,
          otherUser: { ...prev.otherUser, isBanned: true },
        }));

        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedChat.id
              ? { ...c, otherUser: { ...c.otherUser, isBanned: true } }
              : c
          )
        );
      }

      if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
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

  const safeFormatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Unknown";
      }
      // formatDistanceToNow returns strings like "5 minutes", addSuffix adds "ago"
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      console.error("Date error:", e);
      return "";
    }
  };

  //preview txt
  const renderLastMessage = (chat) => {
    const msg = chat.lastMessage;
    //if no message
    if (!msg) return "Start a conversation";
    const contentToCheck = msg.mediaUrl || msg.content;
    //is img
    const isImage = isImageUrl(contentToCheck);
    const isVideo = isVideoUrl(contentToCheck);

    //did current user sent it
    const isMe = msg.sender?.id === user?.id;

    if (isVideo) {
      if (isMe) return "You sent a video";
      return `${
        chat.otherUser?.display_name?.split(" ")[0] || "User"
      } sent a video`;
    }

    if (isImage) {
      if (isMe) return "You sent a picture";
      return `${
        chat.otherUser?.display_name?.split(" ")[0] || "User"
      } sent a picture`;
    }

    if (isMe) return `You: ${msg.content}`;
    return msg.content;
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  //merge following n ppl i ve chat w
  const horizontalListUsers = useMemo(() => {
    const uniqueMap = new Map();

    friends.forEach((f) => uniqueMap.set(f.id, f));

    conversations.forEach((c) => {
      if (c.otherUser && !uniqueMap.has(c.otherUser.id)) {
        uniqueMap.set(c.otherUser.id, c.otherUser);
      }
    });

    return Array.from(uniqueMap.values());
  }, [friends, conversations]);

  const filteredConversations = conversations.filter((chat) => {
    const lowerQuery = searchQuery.toLowerCase();
    const name = chat.otherUser?.display_name?.toLowerCase() || "";
    const username = chat.otherUser?.username?.toLowerCase() || "";

    return name.includes(lowerQuery) || username.includes(lowerQuery);
  });

  const onEmojiClick = (emojiData) => {
    setInputText((prev) => prev + emojiData.emoji);
  };

  const closeMsgSearch = () => {
    setIsMsgSearchOpen(false);
    setMsgSearchQuery("");
    setMsgSearchResults([]);
    setIsSearchingMsg(false);
  };

  const getAvatar = (u) =>
    u?.avatar_url ||
    `https://ui-avatars.com/api/?name=${
      u?.display_name || "User"
    }&background=random`;

  return (
    <div
      className="flex h-[calc(100vh-130px)] lg:h-[calc(100vh-80px)] rounded-t rounded-[var(--radius-box)]  border overflow-hidden"
      style={{
        backgroundColor: "var(--chat-bg)",
        borderColor: "var(--chat-border)",
      }}
    >
      {/* LEFT: Conversation List */}
      <div
        className={cn(
          "w-full md:w-[350px] h-full border-r-2 flex flex-col",
          !isMobileListVisible && "hidden md:flex" //hide on mobile if chat open
        )}
        style={{
          backgroundColor: "var(--chat-bg)",
          borderColor: "var(--chat-border)",
        }}
      >
        {/* Search Header */}
        <div className="p-4">
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: "var(--chat-text-primary)" }}
          >
            Messages
          </h2>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2"
              size={18}
              style={{ color: "var(--chat-icon-color)" }}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)] transition-all"
              style={{
                backgroundColor: "var(--chat-input-bg)",
                color: "var(--chat-input-text)",
              }}
            />
          </div>
        </div>

        {/*Horizontal Friends List */}
        {horizontalListUsers.length > 0 && (
          <div
            className="flex gap-4 overflow-x-auto  no-scrollbar p-4 border-y"
            style={{ borderColor: "var(--chat-border)" }}
          >
            {/* Friend Items */}
            {horizontalListUsers.map((friend) => (
              <div
                key={friend.id}
                onClick={() => handleStartChatWithFriend(friend)}
                className="flex flex-col items-center gap-1 min-w-[60px] cursor-pointer group"
              >
                <div className="relative">
                  <img
                    src={getAvatar(friend)}
                    alt={friend.display_name}
                    className="w-12 h-12 rounded-full object-cover border-2 transition-colors"
                    style={{ borderColor: "var(--chat-border)" }}
                  />

                  {isUserOnline(friend.id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <span
                  className="text-xs font-medium truncate w-[64px] text-center"
                  style={{ color: "var(--chat-text-secondary)" }}
                >
                  {friend.display_name?.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar mt-2">
          {conversations.length === 0 && (
            <div
              className="p-8 text-center text-sm"
              style={{ color: "var(--chat-text-secondary)" }}
            >
              No conversations yet
            </div>
          )}

          {filteredConversations.map((chat) => {
            const isUnread =
              !chat.lastMessage?.is_read &&
              chat.lastMessage?.sender?.id !== user?.id;

            const isSelected = selectedChat?.id === chat.id;

            return (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={cn(
                  "p-4 flex gap-3 cursor-pointer transition-all border-l-4 hover:bg-[var(--chat-selected-bg)]"
                )}
                style={{
                  backgroundColor: isSelected
                    ? "var(--chat-selected-bg)"
                    : "transparent",
                  borderLeftColor: isSelected
                    ? "var(--chat-selected-border)"
                    : "transparent",
                }}
              >
                <div className="relative">
                  <img
                    src={getAvatar(chat.otherUser)}
                    className="w-12 h-12 rounded-full object-cover border-2"
                    alt={chat.otherUser?.display_name}
                    style={{ borderColor: "var(--chat-border)" }}
                  />
                  {/* Online Status*/}
                  {isUserOnline(chat.otherUser?.id) && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4
                      className={cn("font-semibold truncate text-[15px]")}
                      style={{
                        color: isSelected
                          ? "var(--chat-selected-border)"
                          : "var(--chat-text-primary)",
                      }}
                    >
                      {chat.otherUser?.display_name}
                    </h4>
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: "var(--chat-text-secondary)" }}
                    >
                      {safeFormatDate(
                        chat.lastMessage?.created_at || chat.updated_at
                      )}
                    </span>
                  </div>
                  <p
                    className={cn("text-sm truncate")}
                    style={{
                      color: isSelected
                        ? "var(--chat-selected-border)"
                        : isUnread
                        ? "var(--chat-text-primary)"
                        : "var(--chat-text-secondary)",
                      fontWeight: isUnread ? "bold" : "normal",
                    }}
                  >
                    {typingUsers[chat.id] ? (
                      <span
                        className="italic animate-pulse"
                        style={{ color: "var(--chat-selected-border)" }}
                      >
                        Typing...
                      </span>
                    ) : (
                      renderLastMessage(chat)
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Chat Window */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          isMobileListVisible && "hidden md:flex" //hide on mobile if list is visible
        )}
        style={{ backgroundColor: "var(--chat-area-bg)" }}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div
              className="h-16 px-6 border-b flex items-center justify-between shadow-sm z-10"
              style={{
                backgroundColor: "var(--chat-header-bg)",
                borderColor: "var(--chat-header-border)",
              }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileListVisible(true)}
                  className="md:hidden p-2 -ml-2 rounded-full"
                  style={{ color: "var(--chat-text-secondary)" }}
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
                <Link
                  to={`/profile/${selectedChat.otherUser?.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
                >
                  <img
                    src={getAvatar(selectedChat.otherUser)}
                    className="w-12 h-12 rounded-full object-cover border-2"
                    alt="User"
                    style={{ borderColor: "var(--chat-border)" }}
                  />
                  <div>
                    <h3
                      className="font-bold leading-tight"
                      style={{ color: "var(--chat-text-primary)" }}
                    >
                      {selectedChat.otherUser?.display_name}
                    </h3>
                    {isUserOnline(selectedChat.otherUser?.id) ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span
                          className="text-xs font-medium"
                          style={{ color: "var(--chat-text-secondary)" }}
                        >
                          Online
                        </span>
                      </div>
                    ) : (
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--chat-text-secondary)" }}
                      >
                        Offline
                      </span>
                    )}
                  </div>
                </Link>
              </div>

              <div
                className="flex items-center gap-2"
                style={{ color: "var(--chat-icon-hover)" }}
              >
                <button
                  onClick={() => setIsMsgSearchOpen(!isMsgSearchOpen)}
                  className={`p-2.5 rounded-full transition-colors cursor-pointer hover:opacity-80`}
                >
                  <Search size={20} />
                </button>
              </div>
            </div>

            {isMsgSearchOpen && (
              <div
                className="px-4 py-2 border-b flex items-center gap-2 animate-in slide-in-from-top-2 duration-200"
                style={{
                  backgroundColor: "var(--chat-header-bg)",
                  borderColor: "var(--chat-border)",
                }}
              >
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="flex-1 relative"
                >
                  <input
                    type="text"
                    placeholder="Search in conversation..."
                    value={msgSearchQuery}
                    onChange={(e) => setMsgSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-10 py-1.5 text-sm rounded-md border focus:outline-none focus:ring-1 focus:ring-primary"
                    style={{
                      backgroundColor: "var(--chat-input-bg)",
                      borderColor: "var(--chat-border)",
                      color: "var(--chat-input-text)",
                    }}
                    autoFocus
                  />
                  {msgSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setMsgSearchQuery("");
                        setMsgSearchResults([]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-80"
                      style={{ color: "var(--chat-icon-color)" }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </form>
                <button
                  onClick={closeMsgSearch}
                  className="text-xs font-medium hover:opacity-80 cursor-pointer"
                  style={{ color: "var(--chat-text-secondary)" }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Messages Area */}
            <div
              className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4"
              style={{ backgroundColor: "var(--chat-area-bg)" }}
            >
              {isMsgSearchOpen && msgSearchQuery ? (
                <div className="space-y-4">
                  {isSearchingMsg ? (
                    <p
                      className="text-center text-sm mt-4"
                      style={{ color: "var(--chat-text-secondary)" }}
                    >
                      Searching...
                    </p>
                  ) : msgSearchResults.length === 0 ? (
                    <p
                      className="text-center text-sm mt-4"
                      style={{ color: "var(--chat-text-secondary)" }}
                    >
                      No results found.
                    </p>
                  ) : (
                    msgSearchResults.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3 rounded-lg shadow-sm border flex gap-3"
                        style={{
                          backgroundColor: "var(--chat-bg)",
                          borderColor: "var(--chat-border)",
                        }}
                      >
                        <img
                          src={getAvatar(msg.sender)}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <span
                              className="text-sm font-bold"
                              style={{ color: "var(--chat-text-primary)" }}
                            >
                              {msg.sender.display_name}
                            </span>
                            <span
                              className="text-[10px]"
                              style={{ color: "var(--chat-text-secondary)" }}
                            >
                              {safeFormatDate(msg.created_at)}
                            </span>
                          </div>
                          <p
                            className="text-sm line-clamp-2"
                            style={{ color: "var(--chat-text-secondary)" }}
                          >
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                messages.map((msg, index) => {
                  const displayMedia = msg.mediaUrl || msg.content;

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
                            isNextSame &&
                              (isMe ? "rounded-br-sm" : "rounded-bl-sm") // Stack effect
                          )}
                          style={{
                            background: isMe
                              ? "var(--chat-message-bg-me)"
                              : "var(--chat-message-bg-other)",
                            color: isMe
                              ? "var(--chat-message-text-me)"
                              : "var(--chat-message-text-other)",
                            border: isMe
                              ? "none"
                              : "1px solid var(--chat-message-border-other)",
                            borderRadius: "1rem",
                            borderTopLeftRadius: isMe ? "1rem" : "0.125rem",
                            borderTopRightRadius: isMe ? "0.125rem" : "1rem",
                            borderBottomRightRadius:
                              isNextSame && isMe ? "0.125rem" : "1rem",
                            borderBottomLeftRadius:
                              isNextSame && !isMe ? "0.125rem" : "1rem",
                          }}
                        >
                          {isImageUrl(displayMedia) ? (
                            <img
                              src={displayMedia}
                              alt="Attachment"
                              className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : isVideoUrl(displayMedia) ? (
                            <video
                              src={displayMedia}
                              controls
                              preload="metadata"
                              className="max-w-[250px] max-h-[250px] rounded-lg object-cover bg-black"
                            />
                          ) : (
                            <p>{msg.content || ""}</p>
                          )}
                        </div>

                        {/* Time & Read Receipt */}
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1 px-1 text-[10px] font-medium",
                            isMe ? "justify-end" : "justify-start"
                          )}
                          style={{ color: "var(--chat-text-secondary)" }}
                        >
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMe && (
                            <span
                              style={{
                                color: msg.is_read
                                  ? "var(--chat-icon-hover)"
                                  : "var(--chat-icon-color)",
                              }}
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
                })
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {selectedChat.otherUser?.isBanned ||
            selectedChat.otherUser?.is_banned ? (
              <div
                className="p-6 border-t flex flex-col items-center justify-center text-center"
                style={{
                  backgroundColor: "var(--chat-header-bg)",
                  borderColor: "var(--chat-border)",
                }}
              >
                <div className="bg-red-100 text-red-500 p-3 rounded-full mb-2">
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
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <p
                  className="font-semibold"
                  style={{ color: "var(--chat-text-primary)" }}
                >
                  User Banned
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--chat-text-secondary)" }}
                >
                  You cannot chat with this user because their account has been
                  suspended.
                </p>
              </div>
            ) : (
              <div
                className="p-4 border-t-2 relative"
                style={{
                  backgroundColor: "var(--chat-header-bg)",
                  borderColor: "var(--chat-border)",
                }}
              >
                {showEmojiPicker && (
                  <div className="absolute bottom-20 left-4 z-50 shadow-xl">
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowEmojiPicker(false)}
                    />
                    <div className="relative z-50">
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        width={300}
                        height={350}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                  <label className="p-2.5 rounded-full transition-colors hover:bg-[var(--chat-icon-hover)]/20 hover:text-[var(--chat-icon-hover)] cursor-pointer">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*, video/*"
                      onChange={handleImageUpload}
                    />

                    <div style={{ color: "var(--chat-icon-color)" }}>
                      <ImageIcon size={22} />
                    </div>
                  </label>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 rounded-full transition-colors hover:bg-yellow-50 cursor-pointer"
                    style={{ color: "var(--chat-icon-color)" }}
                  >
                    <Smile size={22} className="hover:text-yellow-500" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Type a message..."
                      className="w-full rounded-[20px] py-3.5 pl-5 pr-12 outline-none focus:ring-1  transition-all border border-transparent"
                      style={{
                        backgroundColor: "var(--chat-input-bg)",
                        color: "var(--chat-input-text)",
                      }}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!inputText.trim()}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-200",
                        inputText.trim()
                          ? "hover:bg-primary/10"
                          : "cursor-not-allowed"
                      )}
                      style={{
                        color: inputText.trim()
                          ? "var(--chat-icon-hover)"
                          : "var(--chat-icon-color)",
                      }}
                    >
                      <Send
                        size={18}
                        className={inputText.trim() ? "translate-x-0.5" : ""}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Empty State
          <div
            className="flex-1 flex flex-col items-center justify-center text-center p-8"
            style={{ backgroundColor: "var(--chat-empty-bg)" }}
          >
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Send size={40} className="text-primary/40 ml-2" />
            </div>
            <h3
              className="text-2xl font-bold mb-2"
              style={{ color: "var(--chat-text-primary)" }}
            >
              Your Messages
            </h3>
            <p
              className="max-w-xs"
              style={{ color: "var(--chat-text-secondary)" }}
            >
              Select a conversation from the list to start chatting or connect
              with new people.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
