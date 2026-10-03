import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { defaultWeatherData, fetchLiveWeather } from "../data/weatherData";
import logo from "../assets/image/logo.png";

const Header = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [weather, setWeather] = useState(defaultWeatherData);


    // Live clock ticker
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Load weather from local file and check for 2-hour cached updates
    useEffect(() => {
        let isMounted = true;
        fetchLiveWeather(2).then((data) => {
            if (isMounted && data) {
                setWeather(data);
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    // Dynamic greeting based on hour of day
    const getGreetingInfo = (date) => {
        const hour = date.getHours();
        if (hour >= 5 && hour < 12) {
            return {
                text: "Good Morning",
                icon: "🌅",
            };
        } else if (hour >= 12 && hour < 17) {
            return {
                text: "Good Afternoon",
                icon: "☀️",
            };
        } else if (hour >= 17 && hour < 22) {
            return {
                text: "Good Evening",
                icon: "🌇",
            };
        } else {
            return {
                text: "Good Night",
                icon: "🌙",
            };
        }
    };

    const greetingInfo = getGreetingInfo(currentTime);

    // Format date & time strings
    const formattedDate = currentTime.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const formattedTime = currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    const handleLogout = () => {
        logout();
        navigate("/user-login", { replace: true });
    };

    const displayEmail = user?.email || (typeof user === "string" ? user : "");
    const shortEmail = displayEmail.length > 18 ? `${displayEmail.slice(0, 16)}...` : displayEmail;

    return (
        <>
            <header className="bg-[#f7f3eb] border-b-2 border-[#1a1612] text-[#1a1612] sticky top-0 z-50 shadow-sm">
                {/* Top Vintage Continuous Telegraph Running Wire Ticker */}
                <div className="bg-[#1a1612] text-[#f7f3eb] border-b-2 border-black h-[26px] overflow-hidden select-none font-typewriter text-[10px] sm:text-[11px] flex items-center">
                    {/* Left Fixed Badge */}
                    <div className="bg-red-900 text-white px-2 sm:px-3 h-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex-shrink-0 z-10 border-r border-black shadow flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-300 animate-ping inline-block"></span>
                        <span>⚡ PRESS WIRE</span>
                    </div>

                    {/* Smooth Continuous Running Ticker */}
                    <div className="overflow-hidden flex-1 relative flex items-center h-full">
                        <div className="animate-news-ticker flex items-center gap-6 font-semibold tracking-wide text-[#f4eedf]">
                            {[0, 1].map((copyIdx) => (
                                <span key={copyIdx} className="flex items-center gap-6 flex-shrink-0">
                                    <span className="text-amber-300 font-bold">
                                        {greetingInfo.icon} {greetingInfo.text.toUpperCase()}, ESTEEMED PATRON
                                    </span>
                                    <span className="text-[#8a7c6a]">•</span>
                                    <span className="text-[#f7f3eb]">
                                        📍 LOCATION: {weather.city.toUpperCase()}, {weather.country.toUpperCase()}
                                    </span>
                                    <span className="text-[#8a7c6a]">•</span>
                                    <span className="text-amber-200">
                                        {weather.icon} WEATHER: {weather.temperature} • {weather.condition.toUpperCase()}
                                    </span>
                                    <span className="text-[#8a7c6a]">•</span>
                                    <span className="text-emerald-400 font-mono">
                                        🕒 LIVE PRESS CLOCK: {formattedDate.toUpperCase()} | {formattedTime}
                                    </span>
                                    <span className="text-[#8a7c6a]">•</span>
                                    <span className="text-[#ded4be]">
                                        ★ THE NEWSPAPER RESTAURANT • ALL AUTHENTIC FLAVOURS FIT TO PRINT • LIVE TANDOORS BURNING HOT ★
                                    </span>
                                    <span className="text-[#8a7c6a]">•</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Header Masthead Row */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-[54px] flex items-center justify-between gap-3">
                    {/* Brand / Title (Left) */}
                    <div 
                        onClick={() => navigate("/all-menu")}
                        className="flex items-center gap-2.5 cursor-pointer select-none group"
                    >
                        <img
                            src={logo}
                            alt="The Newspaper Restaurant Logo"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-[#1a1612] newspaper-shadow-sm group-hover:scale-105 transition duration-200"
                        />
                        <div>
                            <h1 className="font-headline text-lg sm:text-xl md:text-2xl font-black tracking-tight text-[#1a1612] group-hover:opacity-80 transition leading-tight">
                                The Newspaper Restaurant
                            </h1>
                            <span className="font-typewriter text-[9px] sm:text-[10px] text-[#6b5f50] font-bold uppercase tracking-wider block">
                                Daily Food Gazette • Est. 1982
                            </span>
                        </div>
                    </div>

                    {/* User & Logout Actions (Right) */}
                    <div className="flex items-center gap-2 font-typewriter">
                        {isAuthenticated && displayEmail ? (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <button
                                    onClick={() => navigate("/profile")}
                                    title="View & Edit Profile Dossier"
                                    className="flex items-center gap-1.5 bg-[#eee7d7] hover:bg-[#e4dac5] border border-[#1a1612] px-2.5 py-1 rounded font-typewriter text-[11px] transition cursor-pointer shadow-sm"
                                >
                                    <span className="font-black text-[9px] bg-[#1a1612] text-[#f7f3eb] px-1 rounded">
                                        PASS
                                    </span>
                                    <span className="font-bold truncate max-w-[90px] sm:max-w-[130px]" title={user?.name || displayEmail}>
                                        {user?.name || shortEmail}
                                    </span>
                                    <span className="text-[10px]">⚙️</span>
                                </button>

                                <button
                                    onClick={handleLogout}
                                    title="Sign out"
                                    className="bg-red-900 hover:bg-red-950 active:scale-95 text-white font-typewriter font-bold text-xs uppercase px-2.5 py-1.5 border border-black rounded transition duration-150 cursor-pointer flex items-center gap-1 shadow-sm"
                                >
                                    <span>🚪</span>
                                    <span className="hidden md:inline">Logout</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate("/user-login")}
                                className="bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-typewriter font-bold text-xs uppercase px-3.5 py-1.5 border border-black rounded transition cursor-pointer shadow-sm"
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;