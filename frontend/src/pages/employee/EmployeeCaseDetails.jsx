import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function EmployeeCaseDetails() {
  const { ticket_id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showStageModal, setShowStageModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Update Stage
  const [newStage, setNewStage] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  // Request Documents
  const [requestedDocs, setRequestedDocs] = useState([]);
  const [otherDoc, setOtherDoc] = useState("");

  // Verify Document
  const [verifyStatus, setVerifyStatus] = useState("");
  const [verifyReason, setVerifyReason] = useState("");
  const [branchVisit, setBranchVisit] = useState(false);

  const accent = "#be3f3f";
  const bar = "#7C2D2D";

  // Load employee info
  useEffect(() => {
    async function loadEmployeeInfo() {
      try {
        const res = await api.get("/employee/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployee(res.data);
      } catch (err) {
        console.error("Employee info error:", err);
      }
    }
    loadEmployeeInfo();
  }, []);

  // Load case details
  useEffect(() => {
    async function loadCase() {
      try {
        const res = await api.get(`/employee/case/${ticket_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDetails(res.data);
      } catch (err) {
        console.error("Case details error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, [ticket_id]);

  if (loading || !details) {
    return (
      <div className="h-screen flex justify-center items-center text-xl">
        Loading case details…
      </div>
    );
  }

  // ACTION: update stage
  const updateStage = async () => {
    try {
      await api.put(
        `/employee/case/${ticket_id}/stage`,
        {
          new_stage: Number(newStage),
          pending_action: pendingAction || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Stage updated!");
      setShowStageModal(false);
      window.location.reload();
    } catch (err) {
      console.error("Stage update error:", err);
      alert("Failed to update stage.");
    }
  };

  // ACTION: request documents
  const sendDocumentRequest = async () => {
    const docs = [...requestedDocs];
    if (requestedDocs.includes("Other") && otherDoc.trim()) {
      docs.push(otherDoc.trim());
    }

    try {
      await api.put(
        `/employee/case/${ticket_id}/request-documents`,
        { required_docs: docs },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Document request sent.");
      setShowRequestModal(false);
      window.location.reload();
    } catch (err) {
      console.error("Doc request error:", err);
      alert("Failed to request documents.");
    }
  };

  // ACTION: verify document
  const verifyDocument = async () => {
    let status = verifyStatus;
    if (branchVisit) status = "branch";

    try {
      await api.put(
        `/employee/case/${ticket_id}/verify-document`,
        {
          status,
          reason: verifyReason || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Verification submitted.");
      setShowVerifyModal(false);
      window.location.reload();
    } catch (err) {
      console.error("Verification error:", err);
      alert("Verification failed.");
    }
  };

  const viewDocument = async () => {
  try {
    const res = await api.get(
      `/employee/case/${ticket_id}/document-url`,
      { headers: { Authorization: `Bearer ${token}` }}
    );

    window.open(res.data.url, "_blank");
  } catch (err) {
    alert("Could not load document");
  }
};



  const toggleDocSelection = (value) => {
    setRequestedDocs((prev) =>
      prev.includes(value)
        ? prev.filter((x) => x !== value)
        : [...prev, value]
    );
  };

  // -------------------
  // RETURN JSX FIXED
  // -------------------
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <div
        className={`fixed inset-y-0 left-0 w-64 z-40 p-6 flex flex-col shadow-xl transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: bar, color: "white" }}
      >
        {/* close button mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="text-2xl self-end"
        >
          ✕
        </button>

        {employee && (
          <div className="bg-white bg-opacity-10 p-4 rounded-xl mt-4">
            <h3 className="text-lg font-semibold">{employee.full_name}</h3>
            <p className="opacity-80">{employee.username}</p>
            <p className="opacity-80">{employee.email}</p>
          </div>
        )}

        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          className="mt-auto bg-white text-[#7C2D2D] font-semibold py-2 rounded-xl"
        >
          Logout
        </button>
      </div>

      {/* overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* MAIN AREA */}
      <div className={`flex-1 ${sidebarOpen ? "md:ml-64" : "md:ml-0"}`}>

        {/* TOP BAR */}
        <div
          className="w-full flex items-center justify-between px-6 py-4 shadow"
          style={{ backgroundColor: bar, color: "white" }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/employee")}
              className="text-2xl font-bold"
            >
              ←
            </button>

            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="text-2xl font-bold"
            >
              ☰
            </button>
          </div>

          <div className="text-xl font-bold">BANK NAME</div>
        </div>

        {/* CONTENT */}
        <div className="p-8 max-w-6xl mx-auto space-y-8">

          <h1 className="text-2xl font-bold">
            Case Details – {details.ticket_id}
          </h1>

          {/* INFO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow">

            <div>
              <h3 className="font-semibold">Amount</h3>
              <p>₹{details.amount}</p>
            </div>

            <div>
              <h3 className="font-semibold">Channel</h3>
              <p>{details.channel}</p>
            </div>

            <div>
              <h3 className="font-semibold">Complaint Type</h3>
              <p>{details.complaint_type}</p>
            </div>

            <div>
              <h3 className="font-semibold">Stage</h3>
              <p>
                {details.stage} – {details.stage_label}
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Days Open</h3>
              <p>{details.days_open}</p>
            </div>

            <div>
              <h3 className="font-semibold">Registered Date</h3>
              <p>{details.registered_date}</p>
            </div>

            <div>
              <h3 className="font-semibold">Customer Email</h3>
              <p>{details.customer_email || "Not provided"}</p>
            </div>

            <div>
              <h3 className="font-semibold">Customer Mobile</h3>
              <p>{details.customer_mobile || "Not provided"}</p>
            </div>
          </div>

          {/* DOCUMENT SECTION */}
          <div className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-xl font-semibold">Documents</h2>

            {details.last_uploaded_document ? (
              <div className="flex gap-3">
                <button
                  onClick={viewDocument}
                  className="px-4 py-2 rounded text-white"
                  style={{ backgroundColor: accent }}
                >
                  View Last Document
                </button>
              </div>
            ) : (
              <p>No documents uploaded yet.</p>
            )}

            {details.document_required && (
              <p className="text-yellow-700">
                Pending Documents: {details.document_required}
              </p>
            )}

            {details.document_rejection_reason && (
              <p className="text-red-700">
                Rejection: {details.document_rejection_reason}
              </p>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowStageModal(true)}
              className="px-4 py-2 rounded text-white"
              style={{ backgroundColor: accent }}
            >
              Update Stage
            </button>

            <button
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2 rounded text-white"
              style={{ backgroundColor: "#d97706" }}
            >
              Request Documents
            </button>

            <button
              onClick={() => setShowVerifyModal(true)}
              className="px-4 py-2 rounded text-white"
              style={{ backgroundColor: "#2f855a" }}
            >
              Verify Document
            </button>
          </div>
        </div>
      </div>

      {/* MODALS BELOW */}
      {/* UPDATE STAGE */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Update Stage</h2>

            <label>New Stage:</label>
            <select
              className="w-full border p-2 rounded mb-4"
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
            >
              <option value="">Select Stage</option>
              <option value="2">2 – Under Review</option>
              <option value="3">3 – Additional Info Needed</option>
              <option value="4">4 – Reversal Initiated</option>
              <option value="5">5 – Resolved</option>
            </select>

            <label>Pending Action (optional):</label>
            <input
              type="text"
              className="w-full border p-2 rounded mb-4"
              placeholder="Pending action note"
              value={pendingAction}
              onChange={(e) => setPendingAction(e.target.value)}
            />

            <button
              onClick={updateStage}
              className="w-full py-2 rounded text-white"
              style={{ backgroundColor: accent }}
            >
              Update
            </button>

            <button
              className="w-full mt-3 py-2 bg-gray-300 rounded"
              onClick={() => setShowStageModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* REQUEST DOCUMENTS */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Request Documents</h2>

            <label className="block mb-2">Select Documents:</label>

            <div className="flex flex-col gap-2 mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requestedDocs.includes("Aadhaar Card")}
                  onChange={() => toggleDocSelection("Aadhaar Card")}
                />
                Aadhaar Card
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requestedDocs.includes("PAN Card")}
                  onChange={() => toggleDocSelection("PAN Card")}
                />
                PAN Card
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requestedDocs.includes("Other")}
                  onChange={() => toggleDocSelection("Other")}
                />
                Other
              </label>
            </div>

            {requestedDocs.includes("Other") && (
              <input
                type="text"
                placeholder="Specify other document"
                className="w-full border p-2 rounded mb-3"
                value={otherDoc}
                onChange={(e) => setOtherDoc(e.target.value)}
              />
            )}

            <button
              onClick={sendDocumentRequest}
              className="w-full py-2 rounded text-white"
              style={{ backgroundColor: "#d97706" }}
            >
              Send Request
            </button>

            <button
              className="w-full mt-3 py-2 bg-gray-300 rounded"
              onClick={() => setShowRequestModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* VERIFY DOCUMENT */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Verify Document</h2>

            <label className="block mb-2">Action:</label>
            <select
              className="w-full border p-2 rounded mb-3"
              value={verifyStatus}
              onChange={(e) => setVerifyStatus(e.target.value)}
            >
              <option value="">Choose Action</option>
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
            </select>

            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={branchVisit}
                onChange={(e) => setBranchVisit(e.target.checked)}
              />
              Require Branch Visit
            </label>

            {(verifyStatus === "rejected" || branchVisit) && (
              <textarea
                placeholder="Reason (required)"
                className="w-full border p-2 rounded mb-3"
                value={verifyReason}
                onChange={(e) => setVerifyReason(e.target.value)}
              />
            )}

            <button
              onClick={verifyDocument}
              className="w-full py-2 rounded text-white"
              style={{ backgroundColor: "#2f855a" }}
            >
              Submit Verification
            </button>

            <button
              className="w-full mt-3 py-2 bg-gray-300 rounded"
              onClick={() => setShowVerifyModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
