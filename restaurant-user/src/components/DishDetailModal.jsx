import { useCart } from "../context/CartContext";

const DishDetailModal = ({ dish, onClose }) => {
    const { getItemQuantity, addToCart } = useCart();

    if (!dish) return null;

    const quantity = getItemQuantity(dish.id);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-[#fffdf9] border-4 border-[#1a1612] max-w-2xl w-full max-h-[92vh] flex flex-col newspaper-shadow-lg text-[#1a1612] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Top Header (Archival Dispatch Ribbon) */}
                <div className="bg-[#eee7d7] border-b-2 border-[#1a1612] p-3 sm:p-4 flex items-center justify-between font-typewriter text-xs">
                    <div className="flex items-center gap-2">
                        <span className="bg-[#1a1612] text-[#f7f3eb] px-2 py-0.5 font-bold uppercase text-[10px] rounded">
                            HISTORICAL DOSSIER
                        </span>
                        <span className="font-bold text-[#1a1612] hidden sm:inline">
                            ARCHIVE RECORD #{dish.id}
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        className="bg-[#1a1612] text-[#f7f3eb] px-2 py-1 font-bold hover:bg-red-900 transition cursor-pointer text-xs rounded"
                    >
                        [✕ CLOSE]
                    </button>
                </div>

                {/* Modal Scrollable Content */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-5 font-editorial">
                    {/* Top Row: Headline + Dietary Tag */}
                    <div>
                        <div className="flex items-center gap-2 mb-1.5 font-typewriter text-xs font-bold">
                            <span
                                className={`px-2 py-0.5 border rounded uppercase ${
                                    dish.veg
                                        ? "bg-green-100 text-green-900 border-green-800"
                                        : "bg-red-100 text-red-900 border-red-800"
                                }`}
                            >
                                {dish.veg ? "🟢 PURE VEGETARIAN" : "🔴 NON-VEGETARIAN"}
                            </span>

                            {dish.rating && (
                                <span className="bg-[#eee7d7] border border-[#1a1612] px-2 py-0.5 rounded">
                                    ★ {dish.rating} / 5.0 Rating
                                </span>
                            )}

                            {dish.prepTime && (
                                <span className="bg-[#f2ecde] border border-[#1a1612] px-2 py-0.5 rounded text-[#1a1612] font-semibold">
                                    ⏱️ Upto {dish.prepTime}
                                </span>
                            )}

                            {dish.spiceLevel && (
                                <span className="bg-[#eee7d7] border border-[#1a1612] px-2 py-0.5 rounded text-[#5c5346]">
                                    🌶️ {dish.spiceLevel}
                                </span>
                            )}
                        </div>

                        <h2 className="font-headline text-2xl sm:text-4xl font-black text-[#1a1612] leading-tight">
                            {dish.name}
                        </h2>
                    </div>

                    {/* Image & Archival Frame */}
                    <div className="border-2 border-[#1a1612] p-1.5 bg-[#eee7d7]">
                        <div className="relative w-full h-52 sm:h-64 overflow-hidden bg-[#ded4be]">
                            <img
                                src={dish.image}
                                alt={dish.name}
                                className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition duration-300"
                                onError={(e) => {
                                    e.target.src =
                                        "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80";
                                }}
                            />
                        </div>
                        <div className="font-typewriter text-[10px] text-[#5c5346] text-center pt-1.5 uppercase font-semibold">
                            [ Fig. {dish.id} — Master Kitchen Archival Plate • Estimated Prep: Upto {dish.prepTime || "15 Mins"} ]
                        </div>
                    </div>

                    {/* Section 1: Kahan Ka Dish Hai (Origin & Region) */}
                    <div className="bg-[#eee7d7] border-2 border-[#1a1612] p-4 rounded newspaper-shadow-sm">
                        <div className="flex items-center gap-2 font-typewriter text-xs font-bold text-red-900 uppercase mb-1">
                            <span>📍</span>
                            <span>GEOGRAPHIC ORIGIN & REGION:</span>
                        </div>
                        <p className="font-headline text-lg sm:text-xl font-bold text-[#1a1612]">
                            {dish.origin || "Traditional Indian Heritage Kitchens"}
                        </p>
                    </div>

                    {/* Section 2: Kab Iski Khoj Hui (History & Invention) */}
                    <div className="border-l-4 border-[#1a1612] pl-4 py-1 space-y-1">
                        <div className="flex items-center gap-2 font-typewriter text-xs font-bold text-[#5c5346] uppercase">
                            <span>⏳</span>
                            <span>HISTORICAL DISCOVERY & BACKSTORY:</span>
                        </div>
                        <p className="font-editorial text-sm sm:text-base text-[#2b241e] leading-relaxed text-justify">
                            {dish.history || dish.description}
                        </p>
                    </div>

                    {/* Section 3: Kaise Banaya Jata Hai (Culinary Recipe & Preparation) */}
                    <div className="bg-[#f7f3eb] border border-[#1a1612] p-4 rounded space-y-2">
                        <div className="flex items-center gap-2 font-typewriter text-xs font-bold text-[#1a1612] uppercase">
                            <span>🍳</span>
                            <span>MASTER CHEF'S CULINARY METHOD (KAISE BANAYA JATA HAI):</span>
                        </div>
                        <p className="font-editorial text-sm sm:text-base text-[#3a3229] leading-relaxed text-justify">
                            {dish.howMade || dish.description}
                        </p>
                    </div>

                    {/* Section 4: Secret Key Ingredients */}
                    {dish.keyIngredients && dish.keyIngredients.length > 0 && (
                        <div>
                            <span className="font-typewriter text-xs font-bold text-[#5c5346] uppercase block mb-2">
                                🌿 KEY SPICES & INGREDIENTS:
                            </span>
                            <div className="flex flex-wrap gap-1.5 font-typewriter text-xs">
                                {dish.keyIngredients.map((ing, idx) => (
                                    <span
                                        key={idx}
                                        className="bg-[#eee7d7] border border-[#1a1612] px-2.5 py-1 rounded text-[#1a1612] font-semibold"
                                    >
                                        • {ing}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer (Order & Add to Kitchen Wire) */}
                <div className="bg-[#eee7d7] border-t-2 border-[#1a1612] p-4 flex flex-wrap items-center justify-between gap-3 font-typewriter">
                    <div>
                        <span className="text-[10px] text-[#5c5346] uppercase font-bold block">
                            Edition Rate:
                        </span>
                        <span className="font-headline text-2xl font-black text-[#1a1612]">
                            {dish.price}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {quantity === 0 ? (
                            <button
                                onClick={() => addToCart(dish, 1)}
                                className="bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-bold text-xs uppercase px-5 py-2.5 border-2 border-black rounded newspaper-shadow-sm transition cursor-pointer flex items-center gap-1.5"
                            >
                                <span>+ ADD TO KITCHEN ORDER</span>
                            </button>
                        ) : (
                            <div className="flex items-center bg-[#fffdf9] border-2 border-[#1a1612] rounded overflow-hidden newspaper-shadow-sm">
                                <button
                                    onClick={() => addToCart(dish, -1)}
                                    className="px-3 py-1.5 text-[#1a1612] hover:bg-[#eee7d7] font-bold text-sm cursor-pointer"
                                >
                                    -
                                </button>
                                <span className="px-3 py-1.5 bg-[#1a1612] text-[#f7f3eb] font-bold text-xs">
                                    {quantity} in Order
                                </span>
                                <button
                                    onClick={() => addToCart(dish, 1)}
                                    className="px-3 py-1.5 text-[#1a1612] hover:bg-[#eee7d7] font-bold text-sm cursor-pointer"
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DishDetailModal;
