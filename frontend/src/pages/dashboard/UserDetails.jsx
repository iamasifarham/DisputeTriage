import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [user, setUser] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2500);
  };

  // Load user details
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await api.get(`/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (err) {
        console.error(err);
        showToast("Failed to load user", "error");
      }
    }
    loadUser();
  }, [id]);

  // Load admin for sidebar
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

  const updateField = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // SAVE CHANGES
  const saveChanges = async () => {
    try {
      await api.put(
        `/admin/users/${id}`,
        {
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      showToast("User updated successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to update user", "error");
    }
  };

  // RESET PASSWORD
    const resetPassword = async () => {
    if (!newPassword) {
    showToast("Password cannot be empty", "error");
    return;
    }

    try {
      await api.post(`/admin/users/${id}/reset-password`, {
      new_password: newPassword
      }, {
       headers: { Authorization: `Bearer ${token}` }
      });


      showToast("Password reset successfully!");
      setShowPasswordReset(false);
      setNewPassword("");
    } catch (err) {
      console.error(err);
      showToast("Password reset failed", "error");
    }
  };


  // DELETE USER
  const deleteUser = async () => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast("User deleted");
      setTimeout(() => navigate("/admin/users"), 1000);
    } catch (err) {
      console.error(err);
      showToast("User deletion failed", "error");
    }
  };

  if (!user) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* TOP BAR */}
      <div className="w-full bg-[#7B2F2F] text-white flex justify-between items-center px-6 py-3 shadow">

        <div className="flex items-center gap-4">
          {/* Hamburger */}
          <button onClick={() => setSidebarOpen(true)} className="text-2xl font-bold">
            ☰
          </button>

          {/* Back Arrow */}
          {!sidebarOpen && (
            <button onClick={() => navigate("/admin/users")} className="text-xl font-semibold">
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
        <button onClick={() => setSidebarOpen(false)} className="text-2xl mb-6 block">
          ✕
        </button>

        {/* Admin Card */}
        <div className="mb-6 p-4 bg-white bg-opacity-10 rounded-xl shadow-lg backdrop-blur-md border border-white/20">
          <h2 className="font-bold text-lg">{admin?.full_name}</h2>
          <p>{admin?.username}</p>
          <p>{admin?.email}</p>
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          className="bg-white text-[#7B2F2F] w-full py-2 rounded font-semibold mb-6"
        >
          Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-10 max-w-xl mx-auto w-full">

        <h1 className="text-2xl font-semibold mb-6">Edit User</h1>

        <div className="bg-white shadow-md p-6 rounded-xl space-y-4">

          <div>
            <label className="block font-medium">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={user.full_name}
              onChange={updateField}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7B2F2F]"
            />
          </div>

          <div>
            <label className="block font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={updateField}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7B2F2F]"
            />
          </div>

          <div>
            <label className="block font-medium">Phone</label>
            <input
              type="text"
              name="phone"
              value={user.phone}
              onChange={updateField}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7B2F2F]"
            />
          </div>

          <div>
            <label className="block font-medium">Role</label>
            <select
              name="role"
              value={user.role}
              onChange={updateField}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7B2F2F]"
            >
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          <button
            onClick={saveChanges}
            className="w-full py-2 bg-[#7B2F2F] text-white rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Save Changes
          </button>

          <button
  onClick={() => setShowPasswordReset(!showPasswordReset)}
  className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
>
  Reset Password
</button>

              {/* RESET PASSWORD SLOT */}
            {showPasswordReset && (
              <div className="p-4 border rounded-lg bg-gray-100 mt-4">
                <label className="block font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7B2F2F]"
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={resetPassword}
                    className="flex-1 bg-[#7B2F2F] text-white py-2 rounded hover:bg-red-700"
                  >
                    Save Password
                  </button>

                  <button
                    onClick={() => {
                      setShowPasswordReset(false);
                      setNewPassword("");
                    }}
                    className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

          <button
            onClick={deleteUser}
            className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Delete User
          </button>
        </div>
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
