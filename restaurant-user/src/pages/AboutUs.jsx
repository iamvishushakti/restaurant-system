import { useNavigate } from "react-router-dom";
import Header from "./Header";
import BottomBar from "../components/BottomBar";

const pillars = [
    {
        number: "01",
        title: "Pure Clay & Babool Charcoal",
        icon: "🔥",
        tag: "Tandoor Mastery",
        description:
            "Every kebab and bread is baked at 480°C in traditional earthen clay pots using authentic babool charcoal for an inimitable deep smoky aroma.",
    },
    {
        number: "02",
        title: "Stone-Ground Masalas",
        icon: "🌿",
        tag: "Sil-Batta Tradition",
        description:
            "We never use pre-packaged powders. Whole spices are sun-dried, roasted at dawn, and ground daily using traditional stone grinders.",
    },
    {
        number: "03",
        title: "Slow-Simmered Dum Pukht",
        icon: "👑",
        tag: "Royal Heritage",
        description:
            "Our Dal Makhani simmers for 18 hours overnight, and our Biryani handis are sealed with dough to trap every drop of aromatic steam.",
    },
];

const timeline = [
    {
        year: "1982",
        headline: "The First Daily Edition",
        description: "Founded beside an old printing press in Old Delhi with 4 wooden tables and 1 clay tandoor.",
        badge: "Origin",
    },
    {
        year: "1998",
        headline: "Royal Dum Biryani Kitchen",
        description: "Introduced ancestral Awadhi and Mughlai recipes guarded across generations.",
        badge: "Expansion",
    },
    {
        year: "2012",
        headline: "500,000 Diners Milestone",
        description: "Awarded Best Heritage Indian Dining by the National Culinary Gazette.",
        badge: "Acclaim",
    },
    {
        year: "2026",
        headline: "The Digital Broadpaper",
        description: "Real-time kitchen press wire, table telegraph ordering, and live food preparation tracking.",
        badge: "Today",
    },
];

const reviews = [
    {
        critic: "The Gourmet Chronicle",
        rating: "★★★★★",
        quote: "The Dal Makhani slow-cooked for 18 hours overnight is an absolute work of journalistic culinary art.",
        author: "Food Editor, 2025",
    },
    {
        critic: "Delhi Culinary Times",
        rating: "★★★★★",
        quote: "The best charcoal butter chicken and mutton seekh kebabs in the entire capital region.",
        author: "Chief Critic, 2026",
    },
    {
        critic: "Heritage Dining Guild",
        rating: "★★★★★",
        quote: "An extraordinary blend of vintage broadsheet nostalgia and unapologetically authentic Indian cuisine.",
        author: "National Guild Review",
    },
];

const AboutUs = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#f7f3eb] text-[#1a1612] pb-36 font-editorial selection:bg-[#1a1612] selection:text-[#f7f3eb]">
            <Header />

            <main className="max-w-6xl mx-auto px-4 md:px-8 mt-6">
                {/* Editorial Top Wire */}
                <div className="border-t-2 border-b-2 border-[#1a1612] py-1.5 mb-6 bg-[#eee7d7] px-4 flex flex-wrap items-center justify-between gap-2 font-typewriter text-xs">
                    <div className="flex items-center gap-2">
                        <span className="bg-[#1a1612] text-[#f7f3eb] px-2 py-0.5 font-bold uppercase text-[10px]">
                            SPECIAL DISPATCH
                        </span>
                        <span className="font-bold text-[#1a1612]">
                            RETROSPECTIVE EDITION • 44 YEARS OF HERITAGE
                        </span>
                    </div>
                    <button
                        onClick={() => navigate("/all-menu")}
                        className="font-bold text-red-900 hover:text-black uppercase underline cursor-pointer"
                    >
                        ← Return to Menu & Ordering
                    </button>
                </div>

                {/* Hero Front-Page Headline */}
                <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-6 sm:p-10 md:p-12 newspaper-shadow-lg mb-10">
                    <div className="text-center max-w-3xl mx-auto border-b-2 border-[#1a1612] pb-6 mb-8">
                        <span className="font-typewriter text-xs font-bold uppercase tracking-widest text-red-900 block mb-2">
                            ★ HISTORIC CHRONICLE & CULINARY FOLKLORE ★
                        </span>
                        <h1 className="font-headline text-3xl sm:text-5xl md:text-6xl font-black uppercase text-[#1a1612] leading-tight mb-3">
                            The Story Behind The Press
                        </h1>
                        <p className="font-editorial italic text-base sm:text-xl text-[#4a4237] max-w-2xl mx-auto">
                            "How a 1980s letterpress workshop and generations of earthen clay-oven mastery gave birth to India's most authentic dining newspaper."
                        </p>
                        
                        <div className="mt-4 font-typewriter text-xs text-[#6b5f50] uppercase flex flex-wrap justify-center items-center gap-3 pt-2 border-t border-dashed border-[#1a1612]/30">
                            <span>Byline: Executive Chef Vishal</span>
                            <span>•</span>
                            <span>Archival Record #42,109</span>
                            <span>•</span>
                            <span>Est. 1982 • New Delhi</span>
                        </div>
                    </div>

                    {/* Section 1: The Origin Story (2 Columns with Photo) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b-2 border-[#1a1612]/30 pb-10 mb-10">
                        <div className="lg:col-span-7 space-y-4">
                            <h2 className="font-headline text-2xl md:text-3xl font-bold uppercase text-[#1a1612]">
                                I. The First Broadsheet Print (1982)
                            </h2>
                            <p className="font-editorial text-base sm:text-lg text-justify text-[#2b241e] leading-relaxed">
                                <span className="font-headline font-black text-5xl float-left mr-2.5 leading-none text-[#1a1612]">
                                    I
                                </span>
                                n the chilly winter of 1982, in an alley right behind Old Delhi's historic printing district, our founding chef ignited a modest charcoal tandoor. Because paper was scarce, the day's special recipes were hand-inked directly onto spare newspaper broadsheets fresh off the morning presses.
                            </p>
                            <p className="font-editorial text-sm sm:text-base text-justify text-[#4a4237] leading-relaxed">
                                Patrons gathered not merely to savor the velvety Dal Makhani and smoky Seekh Kebabs, but to read the day's gastronomic dispatches hot off the press. That legendary blend of rich journalism and authentic North Indian heritage lives on today.
                            </p>

                            <div className="border-l-4 border-[#1a1612] pl-4 py-2 bg-[#eee7d7] font-editorial italic text-sm text-[#1a1612]">
                                "A recipe without history is just food. But when married to heritage and fire, it becomes literature you can taste."
                                <span className="block font-typewriter font-bold not-italic text-right text-[11px] mt-1 text-[#5c5346]">
                                    — Founding Head Chef (1982)
                                </span>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="border-2 border-[#1a1612] p-2 bg-[#eee7d7] newspaper-shadow-sm">
                                <img
                                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80"
                                    alt="Historic Kitchen and Tandoor"
                                    className="w-full h-64 object-cover border border-[#1a1612] grayscale-[20%]"
                                />
                                <div className="font-typewriter text-[10px] text-[#5c5346] text-center pt-2 uppercase font-semibold">
                                    [ Archival Plate: The Original Heritage Kitchen & Clay Tandoor ]
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: The Three Editorial Pillars */}
                    <div className="border-b-2 border-[#1a1612]/30 pb-10 mb-10">
                        <div className="text-center max-w-xl mx-auto mb-8">
                            <span className="font-typewriter text-xs font-bold uppercase tracking-wider text-red-900 block mb-1">
                                OUR CORE FOUNDATION
                            </span>
                            <h2 className="font-headline text-2xl md:text-3xl font-black uppercase text-[#1a1612]">
                                II. The Three Culinary Pillars
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {pillars.map((pillar) => (
                                <div
                                    key={pillar.number}
                                    className="bg-[#eee7d7] border-2 border-[#1a1612] p-5 flex flex-col justify-between newspaper-shadow-sm"
                                >
                                    <div>
                                        <div className="flex items-center justify-between border-b border-[#1a1612]/30 pb-2 mb-3">
                                            <span className="font-typewriter text-xs font-bold bg-[#1a1612] text-[#f7f3eb] px-2 py-0.5 rounded">
                                                RULE {pillar.number}
                                            </span>
                                            <span className="text-2xl">{pillar.icon}</span>
                                        </div>
                                        <span className="font-typewriter text-[10px] uppercase font-bold text-[#6b5f50] block">
                                            {pillar.tag}
                                        </span>
                                        <h3 className="font-headline text-xl font-bold text-[#1a1612] mt-1 mb-2">
                                            {pillar.title}
                                        </h3>
                                        <p className="font-editorial text-sm text-[#3a3229] leading-relaxed">
                                            {pillar.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Historical Timeline */}
                    <div className="border-b-2 border-[#1a1612]/30 pb-10 mb-10">
                        <div className="text-center max-w-xl mx-auto mb-8">
                            <span className="font-typewriter text-xs font-bold uppercase tracking-wider text-red-900 block mb-1">
                                HISTORICAL CHRONOLOGY
                            </span>
                            <h2 className="font-headline text-2xl md:text-3xl font-black uppercase text-[#1a1612]">
                                III. Four Decades of Dispatches
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-typewriter text-xs">
                            {timeline.map((item) => (
                                <div
                                    key={item.year}
                                    className="bg-[#eee7d7] border-2 border-[#1a1612] p-4 text-left flex flex-col justify-between newspaper-shadow-sm"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-headline text-2xl font-black text-red-900">
                                                {item.year}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold bg-[#1a1612] text-[#f7f3eb] px-1.5 py-0.5 rounded">
                                                {item.badge}
                                            </span>
                                        </div>
                                        <h4 className="font-headline font-bold text-sm text-[#1a1612] mb-1.5">
                                            {item.headline}
                                        </h4>
                                        <p className="text-[11px] text-[#5c5346] leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Press Acclaim & Reviews */}
                    <div className="mb-10">
                        <div className="text-center max-w-xl mx-auto mb-8">
                            <span className="font-typewriter text-xs font-bold uppercase tracking-wider text-red-900 block mb-1">
                                CRITICAL TESTIMONIALS
                            </span>
                            <h2 className="font-headline text-2xl md:text-3xl font-black uppercase text-[#1a1612]">
                                IV. Words From The Press
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {reviews.map((rev, index) => (
                                <div
                                    key={index}
                                    className="bg-[#eee7d7] border-2 border-[#1a1612] p-5 flex flex-col justify-between font-editorial text-sm newspaper-shadow-sm"
                                >
                                    <div>
                                        <div className="font-typewriter text-xs font-bold text-red-900 tracking-wider mb-2">
                                            {rev.rating} {rev.critic}
                                        </div>
                                        <p className="italic text-[#2b241e] leading-relaxed mb-4">
                                            "{rev.quote}"
                                        </p>
                                    </div>
                                    <div className="font-typewriter text-[11px] text-[#6b5f50] border-t border-[#1a1612]/30 pt-2 font-bold uppercase">
                                        — {rev.author}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 5: Bureau Details & CTA */}
                    <div className="bg-[#eee7d7] border-2 border-[#1a1612] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 newspaper-shadow-sm">
                        <div className="space-y-1 text-left">
                            <h3 className="font-headline text-2xl font-black uppercase text-[#1a1612]">
                                Ready To Experience Today's Print?
                            </h3>
                            <p className="font-editorial text-sm text-[#4a4237]">
                                Tables are set and the charcoal fires are ablaze. Place your table dispatch right now.
                            </p>
                            <div className="font-typewriter text-xs text-[#6b5f50] pt-1">
                                <span>📍 Old Delhi Heritage Bureau</span>
                                <span className="mx-2">•</span>
                                <span>⏰ 11:30 AM – 11:30 PM Daily</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate("/all-menu")}
                            className="bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-typewriter font-bold py-3.5 px-8 text-xs sm:text-sm uppercase tracking-wider border-2 border-black newspaper-shadow transition cursor-pointer whitespace-nowrap"
                        >
                            🗞️ OPEN DAILY MENU & ORDER ➔
                        </button>
                    </div>
                </div>
            </main>

            {/* Bottom Bar: Left (Food Prep / Cart) & Right (Contact Waiter) */}
            <BottomBar />
        </div>
    );
};

export default AboutUs;
