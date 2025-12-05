import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtpRequest } from "../../api/auth";

export default function OTP() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!state) {
    // If user directly opens /verify-otp without login
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg">Invalid navigation.</p>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp) {
      setError("OTP is required");
      return;
    }

    try {
      setLoading(true);

      const res = await verifyOtpRequest({
        username: state.username,
        role: state.role,
        otp
      });

      console.log("OTP VERIFIED SUCCESSFULLY"); // <-- add this
      // Store JWT
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("username", res.data.username);
      await new Promise(r => setTimeout(r, 10)); // helps on fast navigation
      // Navigate based on role
      if (res.data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/employee");
      }

    } catch (err) {
      console.error("OTP ERROR:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message === "Network Error") {
        setError("Cannot reach backend");
      } else {
        setError("OTP verification failed");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white shadow-md p-6 rounded-xl"
      >
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Enter OTP
        </h1>

        {error && (
          <p className="text-red-600 text-center mb-4">{error}</p>
        )}

        <label className="block mb-2 font-medium">6-Digit OTP</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full mb-6 p-2 border border-[#BB3F3F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BB3F3F]"
          placeholder="Enter OTP"
          maxLength="6"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-[#BB3F3F] text-white rounded-full text-lg font-medium hover:bg-red-700 transition disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <p className="text-center mt-4 text-gray-600 text-sm">
          OTP was sent to your registered email.
        </p>
      </form>
    </div>
  );
}
