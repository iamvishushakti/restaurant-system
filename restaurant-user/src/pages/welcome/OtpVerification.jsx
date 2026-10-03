import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/image/logo.png";
import { sendOtp, verifyOtp } from "../../api";
import { useAuth } from "../../context/AuthContext";

const OtpVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Get email passed from UserLogin via route state or sessionStorage
    const email = location.state?.email || sessionStorage.getItem("user_email") || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [timer, setTimer] = useState(30);

    // If no email found, redirect back to user-login
    useEffect(() => {
        if (!email) {
            navigate("/user-login", { replace: true });
        }
    }, [email, navigate]);

    // 30s Countdown timer for Resend OTP
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Resend OTP handler
    const handleResendOtp = async () => {
        if (!email || timer > 0 || loading) return;

        try {
            setLoading(true);
            setError("");
            setSuccessMessage("");
            const res = await sendOtp(email);
            setSuccessMessage(res?.message || "A fresh telegraphic code has been dispatched.");
            setTimer(30);
        } catch (err) {
            console.error("Resend OTP Error:", err);
            setError(err.response?.data?.message || err.message || "Failed to re-transmit wire. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP handler
    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();

        const trimmedOtp = otp.trim();
        if (!trimmedOtp || trimmedOtp.length < 4) {
            setError("Please enter the complete 6-digit telegraph code.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setSuccessMessage("");

            // Call API /api/user/verify-otp
            const res = await verifyOtp(email, trimmedOtp);
            setSuccessMessage(res?.message || "Press pass credentials verified!");

            // Save user to Auth Context
            const userData = res?.user || { email };
            const authToken = res?.token || "demo-token";
            login(userData, authToken);

            // Redirect to all menu page
            setTimeout(() => {
                navigate("/all-menu", { replace: true });
            }, 1000);
        } catch (err) {
            console.error("Verify OTP Error:", err);
            setError(err.response?.data?.message || err.message || "Invalid telegraphic code. Wire rejected.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f3eb] p-4 font-editorial text-[#1a1612]">
            <div className="p-6 md:p-10 bg-[#fffdf9] border-4 border-[#1a1612] flex flex-col items-center justify-center w-full max-w-md newspaper-shadow-lg relative">
                {/* Stamp */}
                <div className="absolute -top-3.5 bg-red-900 text-white font-typewriter font-bold text-[10px] uppercase px-3 py-1 border border-black tracking-widest">
                    ★ TELEGRAPH WIRE VERIFICATION ★
                </div>

                <img
                    src={logo}
                    alt="The Newspaper Restaurant Logo"
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#1a1612] grayscale-[20%] mt-2"
                />

                <h2 className="font-headline text-2xl md:text-3xl font-black text-[#1a1612] mt-3 text-center uppercase tracking-tight">
                    Verify Press Pass
                </h2>

                <p className="font-typewriter text-xs text-[#5c5346] text-center mt-1 border-b border-t border-[#1a1612]/30 py-1.5 w-full">
                    Wire Dispatched to: <br />
                    <span className="font-bold text-[#1a1612] text-sm">{email}</span>
                </p>

                {/* Error Message */}
                {error && (
                    <div className="w-full mt-3 p-2.5 bg-red-100 border-2 border-red-900 text-red-900 font-typewriter font-bold text-xs text-center">
                        ⚠️ {error}
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="w-full mt-3 p-2.5 bg-green-100 border-2 border-green-900 text-green-900 font-typewriter font-bold text-xs text-center">
                        ✅ {successMessage}
                    </div>
                )}

                <form onSubmit={handleVerifyOtp} className="w-full mt-4 flex flex-col gap-3 font-typewriter text-xs">
                    <div>
                        <label className="font-bold uppercase text-[11px] block mb-1 text-center">
                            Enter 6-Digit Telegraph Code:
                        </label>
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.trim())}
                            placeholder="• • • • • •"
                            required
                            autoFocus
                            disabled={loading}
                            className="w-full px-4 py-3 bg-[#eee7d7] border-2 border-[#1a1612] text-[#1a1612] text-center text-2xl tracking-[0.3em] font-headline font-black focus:outline-none focus:bg-[#fffcf7] disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-bold py-3.5 px-6 text-xs sm:text-sm uppercase tracking-wider border-2 border-black newspaper-shadow transition duration-150 disabled:opacity-50 cursor-pointer mt-1"
                    >
                        {loading ? "AUTHENTICATING TELEGRAM..." : "VERIFY CODE & OPEN MENU ➔"}
                    </button>

                    {/* Resend OTP & Change Email options */}
                    <div className="flex items-center justify-between mt-2 text-xs font-typewriter font-bold">
                        <button
                            type="button"
                            onClick={() => navigate("/user-login")}
                            className="text-[#6b5f50] hover:text-black underline cursor-pointer"
                        >
                            [Edit Email Address]
                        </button>

                        <button
                            type="button"
                            disabled={timer > 0 || loading}
                            onClick={handleResendOtp}
                            className="text-red-900 hover:text-black underline disabled:text-[#a89d8f] disabled:no-underline cursor-pointer"
                        >
                            {timer > 0 ? `Re-transmit Wire (${timer}s)` : "Re-transmit Wire"}
                        </button>
                    </div>
                </form>

                <small className="font-editorial text-[11px] text-[#6b5f50] mt-4 text-center italic">
                    "Official publication of The Newspaper Restaurant. All rights reserved."
                </small>
            </div>
        </div>
    );
};

export default OtpVerification;
