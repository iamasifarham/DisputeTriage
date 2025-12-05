import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function EmployeeCaseDetails() {
  const { ticket_id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

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

  // ----------------------------------
  // LOAD EMPLOYEE
  // ----------------------------------
  useEffect(() => {
    async function loadEmployeeInfo() {
      try {
        const res = await api.get("/employee/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployee(res.data);
      } catch (err) {
        console.error("Employee info error:", err);
      }
    }
    loadEmployeeInfo();
  }, []);

  // ----------------------------------
  // LOAD CASE DETAILS
  // ----------------------------------
  useEffect(() => {
    async function loadCase() {
      try {
        const res = await api.get(`/employee/case/${ticket_id}`, {
          headers: { Authorization: `Bearer ${token}` }
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
        Loading case details...
      </div>
    );
  }

  // ----------------------------------------------------
  // ACTION: UPDATE STAGE
  // ----------------------------------------------------
  const updateStage = async () => {
    try {
      await api.put(
        `/employee/case/${ticket_id}/stage`,
        {
          new_stage: Number(newStage),
          pending_action: pendingAction || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.alert("Stage updated!");
      setShowStageModal(false);
      window.location.reload();
    } catch (err) {
      console.error("Stage update error:", err);
      window.alert("Failed to update stage.");
    }
  };

  // ----------------------------------------------------
  // ACTION: REQUEST DOCUMENTS
  // ----------------------------------------------------
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

      window.alert("Document request sent.");
      setShowRequestModal(false);
    } catch (err) {
      console.error("Doc request error:", err);
      window.alert("Failed to request documents.");
    }
  };

  // ----------------------------------------------------
  // ACTION: VERIFY DOCUMENT
  // ----------------------------------------------------
  const verifyDocument = async () => {
    let status = verifyStatus;

    if (branchVisit) {
      status = "branch";
    }

    try {
      await api.put(
        `/employee/case/${ticket_id}/verify-document`,
        {
          status,
          reason: verifyReason || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.alert("Verification submitted.");
      setShowVerifyModal(false);
      window.location.reload();
    } catch (err) {
      console.error("Verification error:", err);
      window.alert("Verification failed.");
    }
  };

  // ----------------------------------------------------
  // DOCUMENT HANDLERS
  // ----------------------------------------------------
  const viewDocument = () => {
    window.open(
      `http://127.0.0.1:8000/employee/case/${ticket_id}/document`,
      "_blank"
    );
  };

  const downloadDocument = () => {
    window.open(
      `http://127.0.0.1:8000/employee/case/${ticket_id}/document/download`,
      "_blank"
    );
  };

  // ----------------------------------------------------
  // MAIN UI
  // ----------------------------------------------------
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* ----------------------------------
          SIDEBAR (same as admin style)
      ---------------------------------- */}
      <div className="w-64 bg-red-800 text-white p-6 flex flex-col">
        <h1 className="text-xl font-semibold mb-4">Employee Panel</h1>

        {employee && (
          <div className="bg-red-700 p-4 rounded-xl space-y-1 mb-6 shadow">
            <h2 className="text-lg font-semibold">{employee.full_name}</h2>
            <p className="text-sm opacity-90">{employee.username}</p>
            <p className="text-sm opacity-90">{employee.email}</p>
          </div>
        )}

        <button
          className="mt-auto bg-white text-red-700 font-semibold py-2 rounded-xl"
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
        >
          Logout
        </button>
      </div>

      {/* ----------------------------------
          MAIN CONTENT
      ---------------------------------- */}
      <div className="flex-1">

        {/* TOP BAR */}
        <div className="bg-red-800 text-white px-10 py-4 flex justify-between items-center shadow">
          <h1 className="text-xl font-semibold">BANK NAME</h1>
          <p>Logged in as: {employee?.username}</p>
        </div>

        {/* CASE DETAILS */}
        <div className="p-10 max-w-4xl mx-auto space-y-8">

          <h1 className="text-2xl font-bold">Case Details – {details.ticket_id}</h1>

          {/* INFO GRID */}
          <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow">

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
              <p>{details.stage} – {details.stage_label}</p>
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
          <div className="bg-white shadow p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-semibold">Documents</h2>

            {details.last_uploaded_document ? (
              <>
                <button
                  onClick={viewDocument}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  View Last Document
                </button>

                <button
                  onClick={downloadDocument}
                  className="px-4 py-2 bg-green-600 text-white rounded ml-2"
                >
                  Download
                </button>
              </>
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
          <div className="flex gap-4">

            <button
              className="px-4 py-2 bg-purple-700 text-white rounded"
              onClick={() => setShowStageModal(true)}
            >
              Update Stage
            </button>

            <button
              className="px-4 py-2 bg-orange-600 text-white rounded"
              onClick={() => setShowRequestModal(true)}
            >
              Request Documents
            </button>

            <button
              className="px-4 py-2 bg-green-700 text-white rounded"
              onClick={() => setShowVerifyModal(true)}
            >
              Verify Document
            </button>

          </div>
        </div>
      </div>

      {/* ----------------------------------
          MODAL: Update Stage
      ---------------------------------- */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
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
              className="w-full bg-purple-700 text-white py-2 rounded"
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

      {/* ----------------------------------
          MODAL: Request Documents
      ---------------------------------- */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">

            <h2 className="text-xl font-semibold mb-4">Request Documents</h2>

            <label>Select Documents:</label>
            <select
              className="w-full border p-2 rounded mb-3"
              multiple
              onChange={(e) =>
                setRequestedDocs([...e.target.selectedOptions].map((o) => o.value))
              }
            >
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="PAN Card">PAN Card</option>
              <option value="Other">Other</option>
            </select>

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
              className="w-full bg-orange-600 text-white py-2 rounded"
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

      {/* ----------------------------------
          MODAL: Verify Document
      ---------------------------------- */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">

            <h2 className="text-xl font-semibold mb-4">Verify Document</h2>

            <label>Status:</label>
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
                placeholder="Reason"
                className="w-full border p-2 rounded mb-3"
                value={verifyReason}
                onChange={(e) => setVerifyReason(e.target.value)}
              />
            )}

            <button
              onClick={verifyDocument}
              className="w-full bg-green-700 text-white py-2 rounded"
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
