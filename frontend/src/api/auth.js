import api from "./axios";

export function loginRequest(data) {
  return api.post("/auth/login", data);
}

export function verifyOtpRequest(data) {
  return api.post("/auth/verify-otp", data);
}
