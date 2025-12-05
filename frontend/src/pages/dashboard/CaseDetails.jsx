import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

export default function CaseDetails() {
  const { ticket_id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [details, setDetails] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false }), 2500);
  };

  // Load admin info for sidebar
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

  // Load case details
  useEffect(() => {
    async function loadDetails() {
      try {
        const res = await api.get(`/admin/status/${ticket_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.error) {
          showToast("Ticket not found", "error");
          return;
        }

        setDetails(res.data);

      } catch (err) {
        console.error(err);
        showToast("Failed to load case details", "error");
      }
    }
    loadDetails();
  }, [ticket_id]);

  if (!details) {
    return <div className="p-10 text-lg">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* TOP BAR */}
      <div className="w-full bg-[#7B2F2F] text-white flex justify-between items-center px-6 py-3 shadow">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="text-2xl font-bold">
            ☰
          </button>

          {!sidebarOpen && (
            <button onClick={() => navigate("/admin/cases/sorted")} className="text-xl font-semibold">
              ←
            </button>
          )}
        </div>

        <h1 className="text-xl font-bold tracking-wide">BANK NAME</h1>
      </div>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#7B2F2F] text-white p-6 z-30 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button onClick={() => setSidebarOpen(false)} className="text-2xl mb-6">✕</button>

        {/* ADMIN CARD */}
        <div className="mb-6 p-4 bg-white bg-opacity-10 rounded-xl shadow-md border border-white/20">
          <h2 className="font-bold text-lg">{admin?.full_name}</h2>
          <p>{admin?.username}</p>
          <p>{admin?.email}</p>
        </div>

        {/* Manage Users */}
        <button
          onClick={() => navigate("/admin/users")}
          className="w-full text-left bg-white/10 hover:bg-white/20 py-2 px-3 rounded mb-4"
        >
          Manage Users
        </button>

        {/* Logout at bottom */}
        <div className="mt-auto">
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            className="bg-white text-[#7B2F2F] w-full py-2 rounded font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-10 max-w-3xl mx-auto w-full">

        <h1 className="text-2xl font-semibold mb-6">
          Case Details – {details.ticket_id}
        </h1>

        <div className="bg-white shadow-lg rounded-xl p-6 space-y-4">

          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold">Ticket ID</h3>
              <p>{details.ticket_id}</p>
            </div>

            <div>
              <h3 className="font-semibold">Channel</h3>
              <p>{details.channel}</p>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold">Amount</h3>
              <p>₹{details.amount}</p>
            </div>

            <div>
              <h3 className="font-semibold">Complaint Type</h3>
              <p>{details.complaint_type}</p>
            </div>
          </div>
          {/* Customer Info */}
<div className="grid grid-cols-2 gap-6">
  <div>
    <h3 className="font-semibold">Customer Email</h3>
    <p>{details.customer_email || "Not Provided"}</p>
  </div>

  <div>
    <h3 className="font-semibold">Customer Phone</h3>
    <p>{details.customer_mobile || "Not Provided"}</p>
  </div>
</div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold">Stage</h3>
              <p>{details.stage}</p>
            </div>

            <div>
              <h3 className="font-semibold">Stage Label</h3>
              <p>{details.stage_label}</p>
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold">Days Open</h3>
              <p>{details.days_open}</p>
            </div>

            <div>
              <h3 className="font-semibold">Priority Bucket</h3>
              <p>{details.priority_bucket}</p>
            </div>
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold">SLA Bucket</h3>
              <p>{details.sla_bucket}</p>
            </div>

            <div>
              <h3 className="font-semibold">Triage Score</h3>
              <p>{details.triage_score}</p>
            </div>
          </div>

          {/* Row 6 */}
          <div>
            <h3 className="font-semibold">Pending Action</h3>
            <p>{details.pending_action || "None"}</p>
          </div>

          {/* Row 7 */}
          <div>
            <h3 className="font-semibold">Routed To</h3>
            <p>{details.routed_to}</p>
          </div>

          {/* Row 8 */}
          <div>
            <h3 className="font-semibold">Document Required</h3>
            <p>{details.document_required || "No"}</p>
          </div>

          {/* Row 9 */}
          <div>
            <h3 className="font-semibold">Last Uploaded Document</h3>
            <p>{details.last_uploaded_document || "None"}</p>
          </div>

          {/* Row 10 */}
          <div>
            <h3 className="font-semibold">Document Rejection Reason</h3>
            <p>{details.document_rejection_reason || "None"}</p>
          </div>

          {/* Row 11 */}
          <div>
            <h3 className="font-semibold">Registered Date</h3>
            <p>{details.registered_date}</p>
          </div>

          {/* Row 12 */}
          <div>
            <h3 className="font-semibold">Present Stage Date</h3>
            <p>{details.present_stage_date}</p>
          </div>

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
