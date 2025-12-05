import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  useEffect(() => {
    async function fetchAdmin() {
      try {
        const res = await api.get("/admin/users", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const me = res.data.find((u) => u.username === username);
        setAdmin(me || null);
      } catch (err) {
        console.error("Admin load failed:", err);
      }
    }
    fetchAdmin();
  }, []);

  // -------------------------------
  // PROCESS EXCEL (NO PAGE CHANGE)
  // -------------------------------
  const processExcel = async () => {
    try {
      await api.get("/admin/process", {
       headers: { Authorization: `Bearer ${token}` }
        });

      alert("Excel processing completed successfully!");
    } catch (err) {
      console.error("Excel processing error:", err);
      alert("Failed to process Excel.");
    }
  };

  // -------------------------------
  // LOGOUT
  // -------------------------------
  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* TOP BAR */}
      <div className="w-full bg-[#7B2F2F] text-white flex justify-between items-center px-6 py-3 shadow">
        {/* Hamburger */}
        <button onClick={() => setSidebarOpen(true)} className="text-2xl">
          ☰
        </button>

        {/* BANK NAME RIGHT SIDE */}
        <h1 className="text-xl font-bold tracking-wide">BANK NAME</h1>
      </div>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20"
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
          className="text-2xl mb-6 block text-left"
        >
          ✕
        </button>

        {/* ADMIN INFO */}
        <div className="mb-6">
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

        {/* MENU */}
        <div className="space-y-3">

          {/* Process Excel */}
          <button
            onClick={processExcel}
            className="block w-full text-left bg-white bg-opacity-10 hover:bg-opacity-20 py-2 px-3 rounded"
          >
            Process Excel
          </button>

          {/* Manage Employees */}
          <button
            onClick={() => navigate("/admin/users")}
            className="block w-full text-left bg-white bg-opacity-10 hover:bg-opacity-20 py-2 px-3 rounded"
          >
            Manage Users
          </button>

          {/* Dispute List */}
          <button
            onClick={() => navigate("/admin/cases/sorted")}
            className="block w-full text-left bg-white bg-opacity-10 hover:bg-opacity-20 py-2 px-3 rounded"
          >
            Dispute List
          </button>
        </div>
      </div>

      {/* MAIN BODY CONTENT */}
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="grid grid-cols-2 gap-12">

          {/* Manage Employees */}
          <div
            onClick={() => navigate("/admin/users")}
            className="cursor-pointer bg-white shadow p-10 rounded-xl border-2 border-[#7B2F2F] hover:shadow-lg text-center"
          >
            <img src="/folder.png" alt="folder" className="mx-auto mb-4 w-12" />
            <p className="font-semibold text-lg">Manage Users</p>
          </div>

          {/* Dispute List */}
          <div
            onClick={() => navigate("/admin/cases/sorted")}
            className="cursor-pointer bg-white shadow p-10 rounded-xl border-2 border-[#7B2F2F] hover:shadow-lg text-center"
          >
            <img src="/folder.png" alt="folder" className="mx-auto mb-4 w-12" />
            <p className="font-semibold text-lg">Dispute List</p>
          </div>
        </div>
      </div>
    </div>
  );
}
