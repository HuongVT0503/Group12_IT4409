import { useState } from "react";

//// MOCK DATA
const MOCK_CHATS = [
  { id: 1, name: "Linh Nguyen", lastMsg: "Hey, are you free?", time: "2m", active: true },
  { id: 2, name: "Minh Tran", lastMsg: "Sent a photo", time: "1h", active: false },
  { id: 3, name: "Project Group", lastMsg: "Meeting at 5PM", time: "3h", active: false },
];
///


export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(MOCK_CHATS[0]);

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Chat List */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 font-bold text-lg">Messages</div>
        <div className="flex-1 overflow-y-auto">
          {MOCK_CHATS.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setSelectedChat(chat)}
              className={`p-4 flex gap-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors ${selectedChat.id === chat.id ? 'bg-blue-50' : ''}`}
            >
              <div className="relative">
                <img src={`https://ui-avatars.com/api/?name=${chat.name}&background=random`} className="w-10 h-10 rounded-full" />
                {chat.active && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-semibold text-gray-900 truncate">{chat.name}</h4>
                  <span className="text-xs text-gray-400">{chat.time}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{chat.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3">
          <img src={`https://ui-avatars.com/api/?name=${selectedChat.name}&background=random`} className="w-8 h-8 rounded-full" />
          <span className="font-bold">{selectedChat.name}</span>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none max-w-xs shadow-sm">
              <p className="text-sm">Hello! How are you?</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-none max-w-xs shadow-sm">
              <p className="text-sm">Im good, thanks for asking!</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="w-full bg-gray-100 rounded-full py-3 px-5 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
}