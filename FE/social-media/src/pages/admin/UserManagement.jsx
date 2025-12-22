import { useEffect, useState } from "react";
import { getAllUsers, banUser } from "../../services/adminService";
import { Search } from "lucide-react";
import Avatar from "../../components/common/Avatar";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async (user) => {
    if (
      !confirm(
        `Are you sure you want to ${user.isBanned ? "unban" : "ban"} ${
          user.username
        }?`
      )
    )
      return;

    try {
      await banUser(user.userId, !user.isBanned);
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === user.userId ? { ...u, isBanned: !u.isBanned } : u
        )
      );
    } catch (error) {
      console.log(error);
      alert("Failed to update user status");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.userId}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <Avatar
                      src={`https://ui-avatars.com/api/?name=${user.username}`}
                      size={9}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {user.username}
                      </div>
                      <div className="text-xs text-gray-400">
                        {user.email || "No email"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 capitalize">{user.role}</td>
                  <td className="px-6 py-4">
                    {user.isBanned ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                        Banned
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleBanToggle(user)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        user.isBanned
                          ? "bg-green-50 text-green-600 hover:bg-green-100"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      {user.isBanned ? "Unban User" : "Ban User"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
