import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function NewUser() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2500);
  };

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    role: "employee",
    password: ""
  });

  // load admin profile for sidebar
  useEffect(() => {
    async function loadAdmin() {
      try {
        const res = await api.get("/admin/users", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const me = res.data.find((u) => u.username === username);
        setAdmin(me || null);
      } catch (err) {
        console.error(err);
      }
    }
    loadAdmin();
  }, []);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      await api.post(
        "/admin/users/create",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("User created successfully!");
      setTimeout(() => navigate("/admin/users"), 700);

    } catch (err) {
      console.error(err);
      showToast("Failed to create user", "error");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* TOP BAR */}
      <div className="w-full bg-[#7B2F2F] text-white flex justify-between items-center px-6 py-3 shadow">
        <div className="flex items-center gap-4">
          
          {/* Sidebar open button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl font-bold"
          >
            ☰
          </button>

          {/* Back Arrow */}
          {!sidebarOpen && (
            <button
              onClick={() => navigate("/admin/users")}
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
        <button
          onClick={() => setSidebarOpen(false)}
          className="text-2xl mb-6 block"
        >
          ✕
        </button>

        {/* ADMIN CARD */}
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
      </div>

      {/* MAIN CONTENT */}
      <div className="p-10 max-w-xl mx-auto w-full">
        <h1 className="text-2xl font-semibold mb-6">Add New User</h1>

        <form
          onSubmit={submit}
          className="bg-white shadow-md p-6 rounded-xl space-y-4"
        >
          <div>
            <label className="block font-medium">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={update}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7B2F2F]"
            />
          </div>

          <div>
            <label className="block font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={update}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7B2F2F]"
            />
          </div>

          <div>
            <label className="block font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7B2F2F]"
            />
          </div>

          <div>
            <label className="block font-medium">Phone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={update}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7B2F2F]"
            />
          </div>

          <div>
            <label className="block font-medium">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={update}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7B2F2F]"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={update}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7B2F2F]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#7B2F2F] text-white rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Create User
          </button>
        </form>
      </div>

      {/* Toast */}
      {toast.show && (
        <div
          className={`
            fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-xl text-white 
            animate-slide-up z-50
            ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}
          `}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
