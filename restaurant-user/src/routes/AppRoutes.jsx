import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/welcome/Home";
import UserLogin from "../pages/welcome/UserLogin";
import OtpVerification from "../pages/welcome/OtpVerification";
import AllMenu from "../pages/menu/AllMenu";
import AboutUs from "../pages/AboutUs";
import Profile from "../pages/profile/Profile";
import TableConfig from "../pages/admin/TableConfig";

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/user-login" element={<UserLogin />} />
            <Route path="/otp-verification" element={<OtpVerification />} />
            <Route path="/all-menu" element={<AllMenu />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/table-config" element={<TableConfig />} />
            <Route path="/table-setup" element={<TableConfig />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/about-us" element={<AboutUs />} />
            {/* Fallback for any unknown/unmatched route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default AppRoutes;