import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../../api/auth";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "employee"
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.password || !form.role) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const res = await loginRequest(form);
      console.log("OTP sent:", res.data);

      navigate("/verify-otp", {
        state: { username: form.username, role: form.role }
      });
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message === "Network Error") {
        setError("Cannot reach backend (network error)");
      } else if (err.response?.status) {
        setError(`Request failed (${err.response.status})`);
      } else {
        setError("Login failed");
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
          Sign In
        </h1>

        {error && (
          <p className="text-red-600 text-center mb-4">{error}</p>
        )}

        <div className="flex gap-4 mb-6">
          {["employee", "admin"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setForm({ ...form, role })}
              className={`flex-1 py-2 rounded-full font-medium border border-[#BB3F3F] transition ${
                form.role === role
                  ? "bg-[#BB3F3F] text-white"
                  : "bg-white text-[#BB3F3F]"
              }`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>

        <label className="block mb-2 font-medium">Username</label>
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={update}
          className="w-full mb-4 p-2 border border-[#BB3F3F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BB3F3F]"
          placeholder="Enter your username"
          required
        />

        <label className="block mb-2 font-medium">Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={update}
          className="w-full mb-6 p-2 border border-[#BB3F3F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BB3F3F]"
          placeholder="Enter password"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-[#BB3F3F] text-white rounded-full text-lg font-medium hover:bg-red-700 transition disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>

        <p className="text-center mt-4 text-gray-600 text-sm">
          You will receive an OTP in your email.
        </p>
      </form>
    </div>
  );
}
