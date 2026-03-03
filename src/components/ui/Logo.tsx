import React from 'react';

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M48 15C25 15 15 30 15 50C15 70 25 85 48 85C55 85 62 82 68 77C71 83 78 88 85 88C90 88 93 84 93 79C93 74 89 70 84 68C81 67 78 67 76 66C80 61 83 56 83 50C83 30 70 15 48 15Z" fill="#F26522" />
            <path d="M48 25C35 25 30 35 30 50C30 65 35 75 48 75C61 75 66 65 66 50C66 35 61 25 48 25Z" fill="white" />
            <path d="M48 28 L45 31 L49 34 L44 38 L50 42 L43 46 L51 50 L43 54 L50 58 L44 62 L49 66 L45 69 L48 72" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    );
}
