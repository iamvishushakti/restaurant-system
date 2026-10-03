import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/image/logo.png";
import { sendOtp } from "../../api";
import { useAuth } from "../../context/AuthContext";

const UserLogin = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/all-menu", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleGetOtp = async (e) => {
        if (e) e.preventDefault();

        const trimmedEmail = email.trim();
        if (!trimmedEmail || !trimmedEmail.includes("@")) {
            setError("Please enter a valid telegraphic email address.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            // Call API /api/user/send-otp
            await sendOtp(trimmedEmail);

            // Store email in sessionStorage as backup
            sessionStorage.setItem("user_email", trimmedEmail);

            // Navigate to OTP page with email in state
            navigate("/otp-verification", { state: { email: trimmedEmail } });
        } catch (err) {
            console.error("Failed to send OTP:", err);
            const serverMessage = err.response?.data?.message || err.message;
            setError(serverMessage || "Failed to dispatch telegram code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f3eb] p-4 font-editorial text-[#1a1612]">
            {/* Main Newspaper Form Box */}
            <div className="p-6 md:p-10 bg-[#fffdf9] border-4 border-[#1a1612] flex flex-col items-center justify-center max-w-md w-full newspaper-shadow-lg relative">
                {/* Top Corner Ribbon / Stamp */}
                <div className="absolute -top-3.5 bg-[#1a1612] text-[#f7f3eb] font-typewriter font-bold text-[10px] uppercase px-3 py-1 border border-black tracking-widest">
                    ★ PRESS BUREAU & SUBSCRIBER DESK ★
                </div>

                <img
                    src={logo}
                    alt="The Newspaper Restaurant Logo"
                    className="w-24 h-24 rounded-full object-cover border-2 border-[#1a1612] grayscale-[20%] mt-2"
                />

                <h2 className="font-masthead text-2xl md:text-3xl font-black text-[#1a1612] mt-3 text-center">
                    The Newspaper Restaurant
                </h2>
                
                <p className="font-typewriter text-xs text-[#5c5346] text-center mt-1 uppercase border-b border-t border-[#1a1612]/30 py-1 w-full font-bold">
                    Official Dining Pass & Subscriber Verification
                </p>

                <form onSubmit={handleGetOtp} className="flex flex-col items-center justify-center mt-5 w-full font-typewriter text-xs">
                    {error && (
                        <div className="w-full mb-3 p-2.5 bg-red-100 border-2 border-red-900 text-red-900 font-bold text-center">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="w-full text-left mb-1">
                        <label className="font-bold uppercase text-[11px] block mb-1">
                            Telegraphic Email Address:
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="reporter.name@domain.com"
                            required
                            disabled={loading}
                            className="border-2 border-[#1a1612] bg-[#eee7d7] px-3.5 py-3 rounded-none w-full text-[#1a1612] placeholder-[#8a7c6a] focus:outline-none focus:bg-[#fffcf7] font-typewriter text-sm disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-bold px-6 py-3.5 mt-4 text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full border-2 border-black newspaper-shadow transition duration-150 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? "TRANSMITTING WIRE..." : "REQUEST 6-DIGIT PRESS CODE ➔"}
                    </button>

                    <p className="font-editorial text-xs text-[#6b5f50] mt-4 text-center italic">
                        "Your email serves as your secure dining pass for placing live kitchen orders and receiving chef dispatches."
                    </p>
                </form>
            </div>
        </div>
    );
};

export default UserLogin;