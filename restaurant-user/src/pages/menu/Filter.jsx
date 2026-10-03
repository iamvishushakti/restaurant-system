import { playNewspaperFlipSound } from "../../utils/soundEffects";

const categories = [
    { id: "all", label: "All Menu", code: "SEC-01", icon: "📰" },
    { id: "chai-coffee", label: "Morning Chai & Coffee", code: "SEC-A", icon: "☕" },
    { id: "starters", label: "Appetizers & Starters", code: "SEC-B", icon: "🍢" },
    { id: "tandoor-kebabs", label: "Tandoor & Kebabs", code: "SEC-C", icon: "🔥" },
    { id: "main-course-veg", label: "Main Course (Veg)", code: "SEC-D", icon: "🥘" },
    { id: "main-course-nonveg", label: "Main Course (Non-Veg)", code: "SEC-E", icon: "🍗" },
    { id: "biryani-rice", label: "Royal Biryani Gazette", code: "SEC-F", icon: "🍚" },
    { id: "breads", label: "Clay Oven Breads", code: "SEC-G", icon: "🫓" },
    { id: "street-food", label: "Street Food & Chaat", code: "SEC-H", icon: "🥙" },
    { id: "desserts", label: "Sweet Dispatches", code: "SEC-I", icon: "🍨" },
    { id: "beverages", label: "Liquid Chronicles", code: "SEC-J", icon: "🥤" },
];

const Filter = ({
    selectedCategory,
    onSelectCategory,
    filterType,
    onFilterType,
    searchQuery = "",
    onSearchQuery,
}) => {
    const isFilterActive = selectedCategory !== "all" || filterType !== "all" || searchQuery.trim().length > 0;

    const handleCategorySelect = (id) => {
        playNewspaperFlipSound();
        onSelectCategory(id);
    };

    const handleFilterTypeSelect = (type) => {
        playNewspaperFlipSound();
        onFilterType(type);
    };

    const handleClearAll = () => {
        playNewspaperFlipSound();
        onSelectCategory("all");
        onFilterType("all");
        if (onSearchQuery) onSearchQuery("");
    };

    return (
        <div className="bg-[#f7f3eb]/95 border-b-2 border-[#1a1612] shadow-sm backdrop-blur-md sticky top-[80px] z-30 py-2.5 px-4 md:px-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-2">
                {/* Row 1: Compact Search Box (Left) & 3-Type Dietary Selector (Right/Adjacent) */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                    {/* Compact Search Box */}
                    <div className="relative w-full sm:w-auto flex-1 max-w-xs sm:max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs">
                            🔍
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchQuery && onSearchQuery(e.target.value)}
                            placeholder="Search dishes (Paneer, Biryani...)"
                            className="w-full pl-8 pr-7 py-1.5 bg-[#eee7d7] border-2 border-[#1a1612] text-[#1a1612] placeholder-[#7d6f5d] font-typewriter text-xs focus:outline-none focus:bg-[#fffcf7] rounded transition newspaper-shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchQuery && onSearchQuery("")}
                                className="absolute inset-y-0 right-0 pr-2.5 flex items-center font-typewriter font-bold text-[#1a1612] hover:text-red-900 text-xs cursor-pointer"
                                title="Clear"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* 3-Type Dietary Selector: [ All ] [ 🟢 Pure Veg ] [ 🔴 Non-Veg ] */}
                    <div className="flex items-center gap-1.5 font-typewriter text-xs">
                        <button
                            onClick={() => handleFilterTypeSelect("all")}
                            className={`px-3 py-1.5 border-2 rounded font-bold uppercase text-[11px] sm:text-xs transition cursor-pointer ${
                                filterType === "all"
                                    ? "bg-[#1a1612] text-[#f7f3eb] border-[#1a1612] newspaper-shadow-sm"
                                    : "bg-[#eee7d7] text-[#1a1612] border-[#1a1612]/60 hover:bg-[#e4dbca]"
                            }`}
                        >
                            All
                        </button>

                        <button
                            onClick={() => handleFilterTypeSelect("veg")}
                            className={`px-3 py-1.5 border-2 rounded font-bold uppercase text-[11px] sm:text-xs flex items-center gap-1.5 transition cursor-pointer ${
                                filterType === "veg"
                                    ? "bg-green-800 text-white border-green-950 newspaper-shadow-sm"
                                    : "bg-[#eee7d7] text-green-900 border-green-800/60 hover:bg-green-100"
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-green-500 border border-black"></span>
                            <span>Pure Veg</span>
                        </button>

                        <button
                            onClick={() => handleFilterTypeSelect("non-veg")}
                            className={`px-3 py-1.5 border-2 rounded font-bold uppercase text-[11px] sm:text-xs flex items-center gap-1.5 transition cursor-pointer ${
                                filterType === "non-veg"
                                    ? "bg-red-800 text-white border-red-950 newspaper-shadow-sm"
                                    : "bg-[#eee7d7] text-red-900 border-red-800/60 hover:bg-red-100"
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-red-500 border border-black"></span>
                            <span>Non-Veg</span>
                        </button>
                    </div>
                </div>

                {/* Row 2: Section Category Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-[#1a1612]/20 pt-1.5">
                    {categories.map((cat) => {
                        const isActive = selectedCategory === cat.id;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat.id)}
                                className={`flex items-center gap-1.5 px-3 py-1 border-2 rounded font-headline font-bold text-xs whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                                    isActive
                                        ? "bg-[#1a1612] text-[#f7f3eb] border-[#1a1612] newspaper-shadow-sm"
                                        : "bg-[#eee7d7] text-[#1a1612] border-[#1a1612]/50 hover:bg-[#e2d8c3]"
                                }`}
                            >
                                <span className="font-typewriter text-[9px] opacity-75 font-normal">
                                    [{cat.code}]
                                </span>
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Active Filter Ticker */}
                {isFilterActive && (
                    <div className="flex items-center justify-between font-typewriter text-[11px] text-[#5c5346] border-t border-dashed border-[#1a1612]/30 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-red-900 uppercase">⚡ FILTER:</span>
                            {selectedCategory !== "all" && (
                                <span className="bg-[#1a1612] text-[#f7f3eb] px-1.5 py-0.2 rounded text-[10px] font-bold">
                                    {categories.find((c) => c.id === selectedCategory)?.label}
                                </span>
                            )}
                            {filterType !== "all" && (
                                <span className="bg-[#1a1612] text-[#f7f3eb] px-1.5 py-0.2 rounded text-[10px] font-bold uppercase">
                                    {filterType}
                                </span>
                            )}
                            {searchQuery && (
                                <span className="bg-[#eee7d7] border border-[#1a1612] px-1.5 py-0.2 rounded text-[10px] font-bold">
                                    "{searchQuery}"
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleClearAll}
                            className="font-bold text-red-900 hover:text-black uppercase underline text-[10px] cursor-pointer"
                        >
                            Reset Filters ✕
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Filter;