import { useState, useMemo, useEffect } from "react";
import MenuContainer from "../../components/MenuContainer";
import BottomBar from "../../components/BottomBar";
import OfferSection from "../../components/OfferSection";
import { menuData } from "../../data/menuData";
import { playNewspaperFlipSound } from "../../utils/soundEffects";
import Header from "../Header";
import Filter from "./Filter";

const AllMenu = () => {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [filterType, setFilterType] = useState("all"); // 'all', 'veg', 'non-veg'
    const [searchQuery, setSearchQuery] = useState("");

    // Auto scroll smoothly to the top of the menu whenever category or filter changes
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, [selectedCategory, filterType]);

    // Filter menu by category, search query, and veg/non-veg type
    const filteredMenu = useMemo(() => {
        return menuData
            .map((category) => {
                if (selectedCategory !== "all" && category.id !== selectedCategory) {
                    return null;
                }

                const filteredItems = category.items.filter((item) => {
                    const matchesSearch =
                        !searchQuery ||
                        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchQuery.toLowerCase());

                    const matchesType =
                        filterType === "all" ||
                        (filterType === "veg" && item.veg) ||
                        (filterType === "non-veg" && !item.veg);

                    return matchesSearch && matchesType;
                });

                if (filteredItems.length === 0) return null;

                return {
                    ...category,
                    items: filteredItems,
                };
            })
            .filter(Boolean);
    }, [selectedCategory, filterType, searchQuery]);

    return (
        <div className="min-h-screen bg-[#f7f3eb] text-[#1a1612] pb-36 font-editorial">
            <Header />
            
            <Filter
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                filterType={filterType}
                onFilterType={setFilterType}
                searchQuery={searchQuery}
                onSearchQuery={setSearchQuery}
            />

            {/* Main Menu Sections */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
                {filteredMenu.length > 0 ? (
                    filteredMenu.map((category) => (
                        <MenuContainer
                            key={category.id}
                            title={category.title}
                            items={category.items}
                        />
                    ))
                ) : (
                    <div className="text-center py-20 bg-[#eee7d7] border-4 border-[#1a1612] newspaper-shadow p-8 max-w-lg mx-auto">
                        <div className="text-5xl mb-3">📰</div>
                        <h3 className="font-headline text-2xl font-black text-[#1a1612] uppercase">
                            No Articles Found In Archive
                        </h3>
                        <p className="font-editorial text-sm text-[#5c5346] mt-2">
                            The requested dish could not be retrieved from today's print edition. Try adjusting your classified search.
                        </p>
                        <button
                            onClick={() => {
                                playNewspaperFlipSound();
                                setSelectedCategory("all");
                                setFilterType("all");
                                setSearchQuery("");
                            }}
                            className="mt-5 px-6 py-2.5 bg-[#1a1612] text-[#f7f3eb] font-typewriter font-bold text-xs uppercase border-2 border-black newspaper-shadow-sm hover:bg-[#332c25] transition cursor-pointer"
                        >
                            Reset to Front Page ✕
                        </button>
                    </div>
                )}
            </main>

            {/* Special Press Offers Voucher / Floating Pill */}
            <OfferSection />

            {/* Bottom Bar: Left (Food Prep / Cart) & Right (Contact Waiter) */}
            <BottomBar />
        </div>
    );
};

export default AllMenu;