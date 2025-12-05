import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminCases() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false }), 2500);
  };

  // Load admin info
  useEffect(() => {
    async function loadAdmin() {
      try {
        const res = await api.get("/admin/users", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const me = res.data.find((u) => u.username === username);
        setAdmin(me || null);
      } catch (err) {
        console.error("Admin load error:", err);
      }
    }
    loadAdmin();
  }, []);

  // Load cases from backend
  useEffect(() => {
    async function loadCases() {
      try {
        const res = await api.get("/admin/cases/sorted", {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("CASES:", res.data);
        setCases(res.data.cases);  // Correct data property

      } catch (err) {
        console.error("Cases load error:", err);
        showToast("Failed to load dispute cases", "error");
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, []);

  // SEARCH FILTER
  const filteredCases = cases.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.ticket_id.toLowerCase().includes(q) ||
      c.channel.toLowerCase().includes(q) ||
      c.complaint_type.toLowerCase().includes(q) ||
      String(c.stage).includes(q)
    );
  });

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* TOP BAR */}
      <div className="w-full bg-[#7B2F2F] text-white flex justify-between items-center px-6 py-3 shadow">

        <div className="flex items-center gap-4">
          {/* Hamburger */}
          <button onClick={() => setSidebarOpen(true)} className="text-2xl font-bold">
            ☰
          </button>

          {/* Back Button */}
          {!sidebarOpen && (
            <button onClick={() => navigate("/admin")} className="text-xl font-semibold">
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
  className={`fixed top-0 left-0 h-full w-64 bg-[#7B2F2F] text-white p-6 z-30 flex flex-col transition-transform duration-300 ${
    sidebarOpen ? "translate-x-0" : "-translate-x-full"
  }`}
>
  {/* Close button */}
  <button onClick={() => setSidebarOpen(false)} className="text-2xl mb-6">
    ✕
  </button>

  {/* ADMIN INFO */}
  <div className="mb-6 p-4 bg-white bg-opacity-10 rounded-xl shadow-lg backdrop-blur-md border border-white/20">
    <h2 className="font-bold text-lg">{admin?.full_name}</h2>
    <p>{admin?.username}</p>
    <p>{admin?.email}</p>
  </div>

  {/* LOGOUT (middle area) */}
  <button
    onClick={() => {
      localStorage.clear();
      navigate("/");
    }}
    className="bg-white text-[#7B2F2F] w-full py-2 rounded font-semibold mb-6"
  >
    Logout
  </button>

  {/* MANAGE USERS BELOW LOGOUT */}
  <button
    onClick={() => navigate("/admin/users")}
    className="w-full text-left bg-white/10 hover:bg-white/20 py-2 px-3 rounded"
  >
    Manage Users
  </button>
</div>



          
      {/* MAIN CONTENT */}
      <div className="p-10">
        <h1 className="text-2xl font-semibold mb-6">Dispute List</h1>

        {/* SEARCH BAR */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search ticket ID, channel, stage, complaint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-1/2 p-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-[#7B2F2F]"
          />
        </div>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-3 border">Ticket ID</th>
                <th className="p-3 border">Channel</th>
                <th className="p-3 border">Amount</th>
                <th className="p-3 border">Complaint Type</th>
                <th className="p-3 border">Stage</th>
                <th className="p-3 border">Days Open</th>
              </tr>
            </thead>

            <tbody>
              {filteredCases.map((c) => (
                <tr key={c.ticket_id} className="hover:bg-gray-100 cursor-pointer">
                  
                  {/* Ticket ID CLICKABLE */}
                  <td
                    className="p-3 border text-blue-700 underline"
                    onClick={() => navigate(`/admin/cases/${c.ticket_id}`)}
                  >
                    {c.ticket_id}
                  </td>

                  <td className="p-3 border">{c.channel}</td>
                  <td className="p-3 border">₹{c.amount}</td>
                  <td className="p-3 border">{c.complaint_type}</td>

                  {/* Stage (numerical stage ID) */}
                  <td className="p-3 border">{c.stage}</td>

                  <td className="p-3 border">{c.days_open}</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOAST */}
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
