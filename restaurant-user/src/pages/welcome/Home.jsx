import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/image/logo.png";
import { useAuth } from "../../context/AuthContext";

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/all-menu", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleStartOrder = () => {
        if (isAuthenticated) {
            navigate("/all-menu");
        } else {
            navigate("/user-login");
        }
    };

    return (
        <div className="min-h-screen bg-[#f7f3eb] text-[#1a1612] flex flex-col justify-between p-4 md:p-8 font-editorial">
            {/* Top Wire */}
            <div className="border-b-2 border-t-2 border-[#1a1612] py-1.5 font-typewriter text-xs flex justify-between items-center tracking-widest text-[#4a4237] max-w-5xl mx-auto w-full">
                <span className="font-bold">VOL. CXXIV • GRAND OPENING EDITION</span>
                <span className="font-bold text-red-900">★ ★ ★ ★ ★ FIVE STAR CULINARY CHRONICLE</span>
                <span className="hidden sm:inline font-bold">WEATHER: 100% FLAVOR</span>
            </div>

            {/* Main Front Page Broadsheet Card */}
            <main className="max-w-4xl mx-auto w-full my-6 p-6 md:p-12 bg-[#fffdf9] border-4 border-[#1a1612] newspaper-shadow-lg flex flex-col items-center text-center">
                {/* Vintage Logo & Masthead */}
                <div className="flex items-center gap-3 mb-2">
                    <img
                        src={logo}
                        alt="Newspaper Restaurant Logo"
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#1a1612] grayscale-[20%]"
                    />
                </div>

                <h1 className="font-masthead text-4xl sm:text-6xl md:text-7xl font-black text-[#1a1612] tracking-tight leading-none mb-2">
                    The Newspaper Restaurant
                </h1>

                <p className="font-headline italic text-sm md:text-base text-[#5c5346] tracking-wider uppercase font-semibold border-b-2 border-t-2 border-[#1a1612] py-1.5 w-full max-w-2xl my-3">
                    "All The Authentic Heritage Flavours Fit To Print"
                </p>

                {/* Big Front Page Headline */}
                <div className="my-6 max-w-2xl">
                    <div className="inline-block bg-[#1a1612] text-[#f7f3eb] font-typewriter text-xs uppercase px-3 py-1 font-bold mb-3">
                        📰 BREAKING GASTRONOMIC DISPATCH
                    </div>
                    <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-black leading-tight uppercase mb-4 text-[#1a1612]">
                        A Royal Feast of Charcoal Tandoor, Aromatic Curries & Spices
                    </h2>
                    <p className="font-editorial text-base sm:text-lg text-[#3a3229] leading-relaxed max-w-xl mx-auto">
                        Special Correspondent reports from the kitchen press: Master chefs have finalized today's grand menu. Tables are set, tandoors are burning hot, and every dish tells a story.
                    </p>
                </div>

                {/* Main Action Button */}
                <button
                    onClick={handleStartOrder}
                    className="bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-typewriter font-bold text-base sm:text-lg uppercase px-8 sm:px-12 py-4 border-2 border-black newspaper-shadow-lg transition duration-200 cursor-pointer flex items-center gap-3 mt-4"
                >
                    <span>🗞️ READ TODAY'S MENU & ORDER</span>
                    <span>➔</span>
                </button>

                <div className="mt-8 font-typewriter text-xs text-[#6b5f50] border-t border-[#1a1612]/30 pt-3 w-full flex flex-wrap justify-around">
                    <span>• Dine-In Table Service</span>
                    <span>• Live Tandoor Kitchen</span>
                    <span>• Authentic Mughlai & Indian</span>
                </div>
            </main>

            {/* Bottom Footer Rule */}
            <footer className="border-t-2 border-[#1a1612] py-2 text-center font-typewriter text-xs text-[#5c5346] max-w-5xl mx-auto w-full">
                <span>© The Newspaper Restaurant • Printed & Published Daily for Esteemed Patrons</span>
            </footer>
        </div>
    );
};

export default Home;