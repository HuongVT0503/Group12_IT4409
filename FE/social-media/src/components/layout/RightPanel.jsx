//desktop right sidebar //trending, suggestions who to follow

// src/components/layout/RightPanel.jsx
export default function RightPanel() {
  const recentMessages = [
    {
      name: "Linh Nguyen",
      msg: "Hi",
      time: "3 mins ago",
      avatar: "https://i.pravatar.cc/150?u=linh",
    },
    {
      name: "Minh Nguyen",
      msg: "Hi",
      time: "5 mins ago",
      avatar: "https://i.pravatar.cc/150?u=minh",
    },
    {
      name: "Phuong Nguyen",
      msg: "Hi",
      time: "8 mins ago",
      avatar: "https://i.pravatar.cc/150?u=phuong",
    },
  ];

  return (
    <div className="space-y-6 pt-4">
      <div className="bg-white rounded-2xl shadow-sm h-64 mb-6 border border-gray-100"></div>

      {/* Recent Messages */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 text-sm">
          Recent Messages
        </h3>
        <div className="flex flex-col gap-4">
          {recentMessages.map((user, i) => (
            <div
              key={i}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2 transition-colors"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500">{user.msg}</p>
              </div>
              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                {user.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
