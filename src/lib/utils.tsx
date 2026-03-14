
import React from "react";

/**
 * Formats a number as a currency string with a custom Styled Naira symbol.
 * Returns a React element for premium UI rendering.
 */
export function fmtCurrency(n: number) {
    const formatted = n.toLocaleString();
    return (
        <span className="inline-flex items-baseline font-inherit">
            <span className="text-[0.8em] font-bold text-gray-400 mr-0.5">₦</span>
            <span>{formatted}</span>
        </span>
    );
}

/**
 * Formats a number as a short currency string (e.g. 1.2K, 5M).
 */
export function fmtCurrencyShort(n: number) {
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
    return `₦${n.toLocaleString()}`;
}

/**
 * Formats a number as a currency string without React elements.
 */
export function formatNaira(n: number) {
    return `₦${n.toLocaleString()}`;
}
