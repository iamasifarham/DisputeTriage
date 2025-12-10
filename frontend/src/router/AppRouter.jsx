import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import OTP from "../pages/auth/OTP";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import AdminUsers from "../pages/dashboard/AdminUsers";
import NewUser from "../pages/dashboard/NewUser";
import UserDetails from "../pages/dashboard/UserDetails";
import AdminCases from "../pages/dashboard/AdminCases";

import CaseDetails from "../pages/dashboard/CaseDetails";
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";
import EmployeeCaseDetails from "../pages/employee/EmployeeCaseDetails";

import CustomerPortal from "../pages/customer/CustomerPortal";


export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verify-otp" element={<OTP />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/add" element={<NewUser />} />
        <Route path="/admin/users/:id" element={<UserDetails />} />
        <Route path="/admin/cases/sorted" element={<AdminCases />} />
        <Route path="/admin/cases/:ticket_id" element={<CaseDetails />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/employee/case/:ticket_id" element={<EmployeeCaseDetails />} />
  
        <Route path="/customer" element={<CustomerPortal />} />

    </Routes>
    
    </BrowserRouter>
  );
}
