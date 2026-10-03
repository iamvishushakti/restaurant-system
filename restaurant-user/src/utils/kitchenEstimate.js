/**
 * Kitchen Preparation Time Estimator
 * Calculates realistic cooking duration for a table order
 * Rules:
 * 1. Single item / single quantity -> 1 Master Chef prepares it (exact item prep time).
 * 2. Multiple items / quantity >= 2 -> Max 2 Chefs work in parallel (total workload divided across 2 chefs).
 */

export const parsePrepMinutes = (prepTimeStr) => {
    if (!prepTimeStr) return 15;
    if (typeof prepTimeStr === "number") return prepTimeStr;

    // Extract all numbers from strings like "15-20 Mins", "Upto 25 Mins", "5-7 Mins"
    const matches = prepTimeStr.match(/\d+/g);
    if (!matches || matches.length === 0) return 15;

    // If a range like "15-20", take the upper bound (20)
    const numbers = matches.map(Number);
    return Math.max(...numbers);
};

/**
 * Detailed kitchen calculation for cart items
 */
export const calculateTablePrepDetails = (items = []) => {
    if (!items || items.length === 0) {
        return {
            estimatedMinutes: 0,
            assignedChefs: 1,
            chefLabel: "1 Master Chef",
            totalItems: 0,
        };
    }

    let totalWorkload = 0;
    let maxSingleItemTime = 0;
    let totalItems = 0;

    items.forEach((item) => {
        const qty = item.quantity || 1;
        const itemMins = parsePrepMinutes(item.prepTime);

        totalWorkload += itemMins * qty;
        totalItems += qty;
        if (itemMins > maxSingleItemTime) {
            maxSingleItemTime = itemMins;
        }
    });

    // If only 1 item is ordered, exactly 1 chef makes it (no parallel division)
    if (totalItems <= 1) {
        return {
            estimatedMinutes: Math.max(5, maxSingleItemTime),
            assignedChefs: 1,
            chefLabel: "1 Master Chef",
            totalItems: 1,
        };
    }

    // For multiple items, 2 chefs work in parallel (max 2 chefs per table)
    const parallelCookTime = Math.ceil(totalWorkload / 2);
    const estimatedMinutes = Math.max(maxSingleItemTime, parallelCookTime);

    return {
        estimatedMinutes: Math.max(5, estimatedMinutes),
        assignedChefs: 2,
        chefLabel: "2 Parallel Chefs",
        totalItems,
    };
};

/**
 * Returns estimated minutes for backward compatibility
 */
export const calculateTablePrepTime = (items = []) => {
    return calculateTablePrepDetails(items).estimatedMinutes;
};

export default calculateTablePrepTime;

