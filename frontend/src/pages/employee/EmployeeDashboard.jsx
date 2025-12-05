import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employee, setEmployee] = useState(null);

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // search + filters
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;

  // toast
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false }), 2500);
  };

  // load employee info
  useEffect(() => {
    async function loadEmployeeInfo() {
      try {
        const res = await api.get("/employee/me", {
  headers: { Authorization: `Bearer ${token}` }
});
setEmployee(res.data);

      } catch (err) {
        console.error("Employee info load error:", err);
      }
    }
    loadEmployeeInfo();
  }, []);

  // load employee cases
  useEffect(() => {
    async function loadCases() {
      try {
        setLoading(true);
        const res = await api.get("/employee/cases", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = Array.isArray(res.data) ? res.data : [];
        setCases(data);
      } catch (err) {
        console.error("Employee cases load error:", err);
        showToast("Failed to load cases", "error");
        setCases([]);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, []);

  // apply search + filters
  const filteredCases = cases.filter((c) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const fields = [
        c.ticket_id?.toLowerCase(),
        c.complaint_type?.toLowerCase(),
        c.stage_label?.toLowerCase(),
        c.priority_bucket?.toLowerCase()
      ];
      const hit = fields.some((f) => f && f.includes(q));
      if (!hit) return false;
    }
    if (stageFilter && String(c.stage) !== stageFilter) return false;
    if (priorityFilter && c.priority_bucket !== priorityFilter) return false;
    return true;
  });

  // pagination calculations
  const totalPages = Math.ceil(filteredCases.length / pageSize) || 1;
  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // reset page if filters/search change
  useEffect(() => setCurrentPage(1), [search, stageFilter, priorityFilter]);

  if (loading) return <div className="p-8">Loading cases...</div>;

  // extract filter options
  const stages = [...new Set(cases.map((c) => c.stage))].sort((a, b) => a - b);
  const priorities = [...new Set(cases.map((c) => c.priority_bucket))].filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* TOP BAR */}
      <div className="w-full bg-[#7B2F2F] text-white flex justify-between items-center px-6 py-3 shadow">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="text-2xl font-bold">☰</button>
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
        <button onClick={() => setSidebarOpen(false)} className="text-2xl mb-6">✕</button>

        {/* EMPLOYEE INFO */}
        <div className="mb-6 p-4 bg-white bg-opacity-10 rounded-xl shadow-lg">
          <h2 className="font-bold text-lg">{employee?.full_name}</h2>
          <p>{employee?.username}</p>
          <p>{employee?.email}</p>
        </div>

        {/* Navigation */}
        <button
          onClick={() => {
            setSidebarOpen(false);
            navigate("/employee");
          }}
          className="w-full text-left bg-white/10 hover:bg-white/20 py-2 px-3 rounded mb-4"
        >
          My Cases
        </button>

        {/* Logout */}
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
      <div className="p-8 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">My Cases</h2>
              <div className="text-gray-700 text-sm mt-1">
                Showing {filteredCases.length} of {cases.length} cases
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Logged in as <span className="font-medium">{employee?.username}</span>
            </div>
          </div>

          {/* SEARCH + FILTER BAR */}
          <div className="mb-4 flex flex-wrap gap-3 items-center">

            {/* Search */}
            <input
              type="text"
              placeholder="Search ticket, complaint type, stage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border border-gray-300 rounded w-1/3"
            />

            {/* Stage filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            >
              <option value="">All stages</option>
              {stages.map((s) => (
                <option key={s} value={s}>
                  Stage {s}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            >
              <option value="">All priorities</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Clear filters */}
            <button
              onClick={() => {
                setSearch("");
                setStageFilter("");
                setPriorityFilter("");
              }}
              className="py-2 px-3 bg-gray-200 rounded"
            >
              Clear
            </button>
          </div>

          {/* CASE TABLE */}
          <div className="bg-white shadow rounded overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border">#</th>
                  <th className="p-3 border">Ticket ID</th>
                  <th className="p-3 border">Complaint</th>
                  <th className="p-3 border">Stage</th>
                  <th className="p-3 border">Stage Label</th>
                  <th className="p-3 border">Priority</th>
                  <th className="p-3 border">Triage</th>
                  <th className="p-3 border">Days Open</th>
                  <th className="p-3 border">Routed To</th>
                </tr>
              </thead>

              <tbody>
                {paginatedCases.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-gray-500">
                      No cases found
                    </td>
                  </tr>
                ) : (
                  paginatedCases.map((c, idx) => (
                    <tr
                      key={c.ticket_id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/employee/case/${c.ticket_id}`)}
                    >
                      <td className="p-3 border">
                        {(currentPage - 1) * pageSize + (idx + 1)}
                      </td>
                      <td className="p-3 border text-blue-700 underline">
                        {c.ticket_id}
                      </td>
                      <td className="p-3 border">{c.complaint_type}</td>
                      <td className="p-3 border">{c.stage}</td>
                      <td className="p-3 border">{c.stage_label}</td>
                      <td className="p-3 border">{c.priority_bucket}</td>
                      <td className="p-3 border">{c.triage_score}</td>
                      <td className="p-3 border">{c.days_open}</td>
                      <td className="p-3 border">{c.routed_to}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-40"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-40"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}

        </div>
      </div>

      {/* TOAST */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-xl text-white z-50 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
