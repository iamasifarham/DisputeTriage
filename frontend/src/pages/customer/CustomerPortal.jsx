import React, { useState } from "react";
import api from "../../api/axios";

export default function CustomerPortal() {
  const accent = "#BE3F3F";
  const bar = "#7C2D2D";

  const [showForm, setShowForm] = useState(false);
const [submitting, setSubmitting] = useState(false);

  // Form for new complaint
  const [form, setForm] = useState({
    channel: "",
    transaction_id: "",
    amount: "",
    issue_category: "",
    other_issue: "",
    email: "",
    mobile: "",
  });

  const [ticketID, setTicketID] = useState(null);

  // Tracking
  const [trackID, setTrackID] = useState("");
  const [status, setStatus] = useState(null);

  // Upload
  const [file, setFile] = useState(null);

  const updateForm = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // -------------------------------
  // SUBMIT NEW COMPLAINT
  // -------------------------------
  const createDispute = async (e) => {
  e.preventDefault();

  if (submitting) return; // ignore extra clicks
  setSubmitting(true);

  try {
    const res = await api.post("/customer/dispute", {
      channel: form.channel,
      transaction_id: form.transaction_id,
      amount: Number(form.amount),
      issue_category:
        form.issue_category === "Other" ? form.other_issue : form.issue_category,
      contact: {
        email: form.email,
        mobile: form.mobile,
      },
    });

    setTicketID(res.data.ticket_id);
    setTrackID(res.data.ticket_id);
    fetchStatus(res.data.ticket_id);
  } catch (err) {
    alert("Failed to submit complaint.");
  } finally {
    setSubmitting(false);
  }
};


  
  // TRACK COMPLAINT

  const fetchStatus = async (id = trackID) => {
    if (!id) return;

    try {
      const res = await api.get(`/customer/dispute/${id}/status`);

      // Override final resolved message
      if (res.data.status === "Reversal Processed" || res.data.progress === 100) {
        res.data.message =
          "Your reversal has been processed successfully. You'll see the credit shortly.";
      }

      console.log("Status response:", res.data);
      setStatus(res.data);
    } catch {
      alert("Invalid Ticket ID");
    }
  };

  // -------------------------------
  // UPLOAD DOCUMENT
  // -------------------------------
  const uploadDocument = async () => {
    if (!file) {
      alert("Select a file first");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    try {
      await api.post(`/customer/dispute/${trackID}/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Document uploaded");
      fetchStatus(trackID);
    } catch {
      alert("Upload failed");
    }
  };

  // Progress bar stages
  const stages = [
    "Complaint Registered",
    "Under Review",
    "Additional Information Needed",
    "Reversal Initiated",
    "Resolved",
  ];

  const currentStageIndex = stages.indexOf(status?.status) + 1;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* TOP BAR */}
      <div
        className="px-6 py-4 text-white text-xl font-semibold shadow"
        style={{ backgroundColor: bar }}
      >
        CUSTOMER DISPUTE PORTAL
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-10">

        {/* SECTION 1: SUBMIT YOUR COMPLAINT */}
        <div className="bg-white p-6 rounded-xl shadow">

          {/* Toggle Button */}
          <button
            className="px-6 py-2 text-white rounded shadow"
            style={{ backgroundColor: accent }}
            onClick={() => setShowForm(!showForm)}
          >
            Click Here To Submit Your Complaint
          </button>

          {/* COLLAPSIBLE FORM */}
          <div
            className={`transition-all duration-500 overflow-hidden ${
              showForm ? "max-h-[1000px] mt-6" : "max-h-0"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">
              Submit Your Complaint
            </h2>

            <form className="space-y-4" onSubmit={createDispute}>
              <select
                name="channel"
                required
                className="border p-2 rounded w-full"
                onChange={updateForm}
              >
                <option value="">Select Channel</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="NETBANKING">Net Banking</option>
              </select>

              <input
                type="text"
                name="transaction_id"
                required
                placeholder="Transaction ID"
                className="border p-2 rounded w-full"
                onChange={updateForm}
              />

              <input
                type="number"
                name="amount"
                required
                placeholder="Amount"
                className="border p-2 rounded w-full"
                onChange={updateForm}
              />

             {/* ISSUE CATEGORY */}
              <select
                name="issue_category"
                value={form.issue_category}
                required
                className="border p-3 rounded w-full text-gray-700 bg-white focus:ring-2 focus:ring-[#BE3F3F]"
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    issue_category: value,
                    other_issue: value !== "Other" ? "" : prev.other_issue,
                  }));
                }}
              >
  <option value="">Select Issue Category</option>
  <option value="Amount Deducted but not Credited to Beneficiary">
    Amount Deducted but not Credited to Beneficiary
  </option>
  <option value="Amount Deducted - Time Out">
    Amount Deducted - Time Out
  </option>
  <option value="Reversal Initiated but Credit to Source Not Received">
    Reversal Initiated but Credit to Source Not Received
  </option>
  <option value="Wrong Beneficiary">Wrong Beneficiary</option>
  <option value="Transaction Not Initiated by the Customer">
    Transaction Not Initiated by the Customer
  </option>
  <option value="Other">Other</option>
</select>

              {/* CUSTOM ISSUE FIELD */}
              {form.issue_category === "Other" && (
                <input
                  type="text"
                  name="other_issue"
                  placeholder="Describe your issue"
                  className="border p-3 rounded w-full mt-3 focus:ring-2 focus:ring-[#BE3F3F]"
                  value={form.other_issue}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, other_issue: e.target.value }))
                  }
                />
              )}



              <input
                type="email"
                name="email"
                placeholder="Email (optional)"
                className="border p-2 rounded w-full"
                onChange={updateForm}
              />

              <input
                type="text"
                name="mobile"
                placeholder="Mobile (optional)"
                className="border p-2 rounded w-full"
                onChange={updateForm}
              />

             <button
  disabled={submitting}
  className={`px-6 py-2 text-white rounded w-full ${
    submitting ? "opacity-60 cursor-not-allowed" : ""
  }`}
  style={{ backgroundColor: accent }}
>
  {submitting ? "Submitting..." : "Submit Complaint"}
</button>

              
            </form>

            {ticketID && (
              <p className="mt-4 font-semibold">
                Your Ticket ID:{" "}
                <span className="text-xl text-green-700">{ticketID}</span>
              </p>
            )}
          </div>
        </div>

        {/* SECTION 2: TRACK YOUR COMPLAINT */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Track Your Complaint</h2>

          <div className="flex gap-3 mb-4">
            <input
              value={trackID}
              onChange={(e) => setTrackID(e.target.value)}
              placeholder="Enter Ticket ID"
              className="border p-2 rounded flex-1"
            />
            <button
              onClick={() => fetchStatus()}
              className="px-6 py-2 text-white rounded"
              style={{ backgroundColor: accent }}
            >
              Check
            </button>
          </div>

          {/* STATUS BOX */}
          {status && (
            <div className="space-y-4">

              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Ticket ID</h4>
                  <p>{status.ticket_id}</p>
                </div>

                <div>
                  <h4 className="font-semibold">Transaction ID</h4>
                  <p>{status.transaction_id || "Not Provided"}</p>
                </div>

                <div>
                  <h4 className="font-semibold">Amount</h4>
                  <p>₹{status.amount || "—"}</p>
                </div>
              </div>

              {/* Status + Progress */}
              <p className="font-semibold">{status.status}</p>

              <div className="w-full h-3 bg-gray-300 rounded-full">
                <div
                  className="h-3 rounded-full"
                  style={{ width: `${status.progress}%`, backgroundColor: accent }}
                ></div>
              </div>

              {/* Status message */}
              <div className="p-3 bg-gray-100 rounded">
                {status.message}
              </div>

              {/* Required docs */}
              {status.required_documents?.length > 0 && (
                <div className="p-3 bg-yellow-100 rounded">
                  <h4 className="font-semibold">Documents Required:</h4>
                  <ul className="list-disc ml-6">
                    {status.required_documents.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rejection reason */}
              {status.rejection_reason && (
                <div className="p-3 bg-red-100 rounded">
                  <h4 className="font-semibold text-red-700">
                    Document Rejected
                  </h4>
                  {status.rejection_reason}
                </div>
              )}

              {/* Upload document if required or rejected */}
              {(status.pending_action === "documents_missing" || status.pending_action === "document_rejected") && (
                <div className="p-4 rounded shadow bg-white">
                  <h4 className="font-semibold mb-2">
                    {status.pending_action === "document_rejected" ? "Re-upload Document" : "Upload Required Document"}
                  </h4>

                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="mb-3"
                  />

                  <button
                    className="px-4 py-2 text-white rounded"
                    onClick={uploadDocument}
                    style={{ backgroundColor: accent }}
                  >
                    Upload
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
