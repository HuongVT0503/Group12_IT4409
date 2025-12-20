//desktop right sidebar //trending, suggestions who to follow, lastest msg

// src/components/layout/RightPanel.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getConversations } from "../../services/chatService";
import { getFollowing } from "../../services/userService";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, UserPlus, Users } from "lucide-react";

export default function RightPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        //recent convos
        const convRes = await getConversations();
        setConversations(convRes.data.conversations || []);

        //following list
        const followingRes = await getFollowing(user.id);
        setContacts(followingRes.data.data || []);
      } catch (error) {
        console.error("RightPanel data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: false })
        .replace("about ", "")
        .replace(" minutes", "m")
        .replace(" minute", "m")
        .replace(" hours", "h")
        .replace(" hour", "h")
        .replace(" days", "d")
        .replace(" day", "d")
        .replace(" less than a minute", "now");
    } catch (e) {
      console.error("Date error:", e);
      return "";
    }
  };

  const getAvatar = (u) =>
    u?.avatar_url ||
    `https://ui-avatars.com/api/?name=${u?.display_name || "User"}&background=random`;

  return (
    <div className="flex flex-col gap-6 h-full py-2 2xl:py-6 w-full">
      
      {/*Contacts / Following */}
      <div className="bg-white rounded-[var(--radius-box)] shadow-sm p-5 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
               <Users size={16} className="text-primary"/> Contacts
            </h3>
            <Link to="/connections" className="text-xs text-primary font-semibold hover:underline">
                See all
            </Link>
        </div>
        
        {loading ? (
            <div className="space-y-3">
               {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"/>)}
            </div>
        ) : contacts.length > 0 ? (
            <div className="flex flex-col gap-3">
            {contacts.slice(0, 5).map((contact) => (
                <Link 
                    key={contact.id} 
                    to={`/profile/${contact.id}`}
                    className="flex items-center gap-3 group p-1 -mx-1 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <div className="relative">
                        <img 
                            src={getAvatar(contact)} 
                            alt={contact.display_name} 
                            className="w-9 h-9 rounded-full object-cover border border-gray-100 group-hover:border-primary/50 transition-colors" 
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                            {contact.display_name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">@{contact.username}</p>
                    </div>
                </Link>
            ))}
            </div>
        ) : (
            <div className="text-center py-4">
                <p className="text-xs text-gray-400 mb-3">No contacts yet.</p>
                <Link to="/connections" className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors inline-flex items-center gap-1 font-medium">
                    <UserPlus size={14} /> Find People
                </Link>
            </div>
        )}
      </div>

      {/*recent msg */}
      <div className="bg-white rounded-[var(--radius-box)] shadow-sm p-5 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <MessageCircle size={16} className="text-primary"/> Messages
            </h3>
            <Link to="/chat" className="text-xs text-primary font-semibold hover:underline">
                Open Chat
            </Link>
        </div>

        {loading ? (
             <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"/>)}
             </div>
        ) : conversations.length > 0 ? (
            <div className="flex flex-col gap-1">
            {conversations.slice(0, 6).map((chat) => (
                <div 
                    key={chat.id} 
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-xl -mx-2 transition-colors group"
                >
                    <img 
                        src={getAvatar(chat.otherUser)} 
                        alt={chat.otherUser?.display_name} 
                        className="w-10 h-10 rounded-full object-cover border border-gray-100" 
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                            {chat.otherUser?.display_name}
                        </p>
                        <p className={`text-xs truncate ${
                            !chat.lastMessage?.is_read && chat.lastMessage?.sender?.id !== user?.id 
                            ? "font-bold text-gray-900" 
                            : "text-gray-500"
                        }`}>
                            {chat.lastMessage?.sender?.id === user?.id && "You: "}
                            {chat.lastMessage?.content || "Sent an attachment"}
                        </p>
                    </div>
                    {chat.updated_at && (
                        <span className="text-[10px] text-gray-400 whitespace-nowrap self-start mt-1">
                            {formatTime(chat.updated_at)}
                        </span>
                    )}
                </div>
            ))}
            </div>
        ) : (
            <div className="text-center py-6">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400">
                    <MessageCircle size={20} />
                </div>
                <p className="text-xs text-gray-500">No recent conversations.</p>
                <Link to="/chat" className="block mt-2 text-xs text-primary hover:underline font-medium">Start chatting</Link>
            </div>
        )}
      </div>
    </div>
  );
}