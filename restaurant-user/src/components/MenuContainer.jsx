import { useState } from "react";
import { useCart } from "../context/CartContext";
import DishDetailModal from "./DishDetailModal";

const MenuContainer = ({ title, items = [], className = "" }) => {
    const { getItemQuantity, addToCart } = useCart();
    const [selectedDish, setSelectedDish] = useState(null);

    return (
        <section className={`mb-14 ${className}`}>
            {/* Newspaper Section Header Rule */}
            <div className="border-t-4 border-b-2 border-[#1a1612] py-2 mb-6 bg-[#eee7d7] px-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <span className="font-typewriter text-xs font-bold bg-[#1a1612] text-[#f7f3eb] px-2 py-0.5 uppercase">
                        Section Feature
                    </span>
                    <h2 className="font-headline text-2xl md:text-3xl font-black text-[#1a1612] tracking-tight uppercase">
                        {title}
                    </h2>
                </div>
                <div className="font-typewriter text-xs text-[#5c5346] font-bold">
                    <span>★ {items.length} {items.length === 1 ? "Dispatches" : "Dispatches"} In This Column</span>
                </div>
            </div>

            {/* Newspaper Column Grid (3 Column Broadsheet Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => {
                    const quantity = getItemQuantity(item.id);

                    return (
                        <article
                            key={item.id}
                            className="bg-[#fffdf9] border-2 border-[#1a1612] p-4 flex flex-col justify-between newspaper-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150 relative group"
                        >
                            {/* Top Headline & Tag */}
                            <div>
                                <div className="flex items-start justify-between gap-2 border-b border-[#1a1612]/30 pb-2 mb-2.5">
                                    {/* Dietary Tag Stamp */}
                                    <div className="flex items-center gap-1.5 font-typewriter text-[10px] uppercase font-bold tracking-wider">
                                        <div
                                            className={`w-3 h-3 flex items-center justify-center border ${
                                                item.veg ? "border-green-800 bg-green-50" : "border-red-800 bg-red-50"
                                            }`}
                                        >
                                            <div
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    item.veg ? "bg-green-700" : "bg-red-700"
                                                }`}
                                            ></div>
                                        </div>
                                        <span className={item.veg ? "text-green-800" : "text-red-800"}>
                                            {item.veg ? "Veg" : "Non-Veg"}
                                        </span>
                                    </div>

                                    {/* Prep Time Badge */}
                                    <span className="font-typewriter text-[10px] font-bold bg-[#1a1612] text-[#f7f3eb] px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <span>⏱️</span>
                                        <span>{item.prepTime ? (item.prepTime.startsWith("Upto") ? item.prepTime : `Upto ${item.prepTime}`) : "Upto 15 Mins"}</span>
                                    </span>

                                    {/* Rating Star */}
                                    {item.rating && (
                                        <span className="font-typewriter text-[11px] font-bold bg-[#eee7d7] border border-[#1a1612] px-1.5 py-0.5">
                                            ★ {item.rating} / 5.0
                                        </span>
                                    )}
                                </div>

                                {/* Article Headline (Clickable to open Origin Modal) */}
                                <h3 
                                    onClick={() => setSelectedDish(item)}
                                    className="font-headline text-xl md:text-2xl font-black text-[#1a1612] leading-tight mb-2 hover:underline cursor-pointer group-hover:text-red-950 transition"
                                >
                                    {item.name}
                                </h3>

                                {/* Image with Photo Border (Clickable to open Origin Modal) */}
                                <div 
                                    onClick={() => setSelectedDish(item)}
                                    className="border border-[#1a1612] p-1 bg-[#eee7d7] mb-3 cursor-pointer group/img"
                                >
                                    <div className="relative w-full h-44 overflow-hidden bg-[#e0d7c3]">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover grayscale-[20%] group-hover/img:grayscale-0 group-hover/img:scale-105 transition duration-300"
                                            onError={(e) => {
                                                e.target.src =
                                                    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80";
                                            }}
                                        />
                                        <div className="absolute bottom-1 right-1 bg-[#1a1612]/90 text-[#f7f3eb] font-typewriter text-[9px] px-1.5 py-0.5 uppercase tracking-wider rounded">
                                            📖 Read History
                                        </div>
                                    </div>
                                    <div className="font-typewriter text-[9px] text-[#5c5346] text-center pt-1 italic uppercase tracking-wider">
                                        [ Fig. {item.id} — Origin: {item.origin ? item.origin.split(",")[0] : "Heritage Kitchen"} ]
                                    </div>
                                </div>

                                {/* Story / Article Body */}
                                <p className="font-editorial text-sm text-[#2b241e] leading-relaxed mb-2.5 line-clamp-3">
                                    <span className="font-headline font-bold text-lg text-[#1a1612] float-left mr-1 leading-none">
                                        {item.description.charAt(0)}
                                    </span>
                                    {item.description.slice(1)}
                                </p>

                                {/* Origin & Recipe Quick Link */}
                                <button
                                    onClick={() => setSelectedDish(item)}
                                    className="font-typewriter text-[11px] font-bold text-red-900 hover:text-black uppercase underline flex items-center gap-1 cursor-pointer mb-2"
                                >
                                    <span>📜 Read Origin, History & Recipe ➔</span>
                                </button>
                            </div>

                            {/* Column Box Footer: Price Rate & Order Stamp Button */}
                            <div className="border-t-2 border-dashed border-[#1a1612]/50 pt-3 mt-1 flex items-center justify-between">
                                <div>
                                    <span className="font-typewriter text-[10px] uppercase font-bold text-[#6b5f50] block">
                                        Classified Rate:
                                    </span>
                                    <span className="font-headline text-xl font-black text-[#1a1612]">
                                        {item.price}
                                    </span>
                                </div>

                                {quantity === 0 ? (
                                    <button
                                        onClick={() => addToCart(item, 1)}
                                        className="bg-[#1a1612] hover:bg-[#383129] active:scale-95 text-[#f7f3eb] font-typewriter font-bold text-xs uppercase px-4 py-2 border-2 border-[#1a1612] newspaper-shadow-sm transition cursor-pointer flex items-center gap-1.5"
                                    >
                                        <span>+ ADD TO PRINT</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center bg-[#eee7d7] border-2 border-[#1a1612] rounded font-typewriter overflow-hidden newspaper-shadow-sm">
                                        <button
                                            onClick={() => addToCart(item, -1)}
                                            className="px-2.5 py-1 text-[#1a1612] hover:bg-[#ded4be] font-bold text-sm transition active:scale-90 cursor-pointer"
                                        >
                                            -
                                        </button>
                                        <span className="px-2.5 py-1 bg-[#1a1612] text-[#f7f3eb] font-bold text-xs">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => addToCart(item, 1)}
                                            className="px-2.5 py-1 text-[#1a1612] hover:bg-[#ded4be] font-bold text-sm transition active:scale-90 cursor-pointer"
                                        >
                                            +
                                        </button>
                                    </div>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* Dynamic Dish Origin, History & Recipe Modal */}
            {selectedDish && (
                <DishDetailModal
                    dish={selectedDish}
                    onClose={() => setSelectedDish(null)}
                />
            )}
        </section>
    );
};

export default MenuContainer;