import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminUsers() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search + Filter
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get("/admin/users", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUsers(res.data);

        const me = res.data.find((u) => u.username === username);
        setAdmin(me || null);

      } catch (err) {
        console.error("User load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all" ? true : u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const goToUserDetails = (id) => {
    navigate(`/admin/users/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* TOP BAR */}
      <div className="w-full bg-[#7B2F2F] text-white flex justify-between items-center px-6 py-3 shadow">

        <div className="flex items-center gap-4">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl font-bold"
          >
            ☰
          </button>

          {/* Back Arrow */}
          {!sidebarOpen && (
            <button
              onClick={() => navigate("/admin")}
              className="text-xl font-semibold"
            >
              ←
            </button>
          )}
        </div>

        <h1 className="text-xl font-bold tracking-wide">BANK NAME</h1>
      </div>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#7B2F2F] text-white p-6 z-30 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="text-2xl mb-6 block"
        >
          ✕
        </button>

        {/* Admin Card */}
        <div className="mb-6 p-4 bg-white bg-opacity-10 rounded-xl shadow-lg backdrop-blur-md border border-white/20">
          <h2 className="font-bold text-lg">{admin?.full_name}</h2>
          <p>{admin?.username}</p>
          <p>{admin?.email}</p>
        </div>

        <button
          onClick={logout}
          className="bg-white text-[#7B2F2F] w-full py-2 rounded font-semibold mb-6"
        >
          Logout
        </button>

        {/* Add New User */}
        <button
          onClick={() => navigate("/admin/users/add")}
          className="block w-full text-left bg-white/10 hover:bg-white/20 py-2 px-3 rounded"
        >
          Add New User
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-10">
        <h1 className="text-2xl font-semibold mb-6">Manage Users</h1>

        {/* SEARCH + FILTER */}
        <div className="flex items-center gap-4 mb-6">

          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search name, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-1/2 p-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-[#7B2F2F]"
          />

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-[#7B2F2F]"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto bg-white shadow-md rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="p-3 border">ID</th>
                  <th className="p-3 border">Full Name</th>
                  <th className="p-3 border">Username</th>
                  <th className="p-3 border">Email</th>
                  <th className="p-3 border">Phone</th>
                  <th className="p-3 border">Role</th>
                  <th className="p-3 border">Created</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-100">

                    {/* ID clickable */}
                    <td
                      onClick={() => goToUserDetails(u.id)}
                      className="p-3 border text-blue-700 cursor-pointer underline"
                    >
                      {u.id}
                    </td>

                    <td className="p-3 border">{u.full_name}</td>

                    {/* Username clickable */}
                    <td
                      onClick={() => goToUserDetails(u.id)}
                      className="p-3 border text-blue-700 cursor-pointer underline"
                    >
                      {u.username}
                    </td>

                    <td className="p-3 border">{u.email}</td>
                    <td className="p-3 border">{u.phone}</td>
                    <td className="p-3 border">{u.role}</td>

                    <td className="p-3 border">
                      {new Date(u.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
