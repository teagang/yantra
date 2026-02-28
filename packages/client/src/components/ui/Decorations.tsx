/** Cozy decorative illustrations for the game sidebars. */

export function PixelCat() {
  return (
    <svg width="80" height="88" viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left ear */}
      <polygon points="10,28 17,8 28,28" fill="#C4A882"/>
      <polygon points="13,27 17,13 25,27" fill="#D4927A"/>
      {/* Right ear */}
      <polygon points="52,28 63,8 70,28" fill="#C4A882"/>
      <polygon points="55,27 63,13 67,27" fill="#D4927A"/>
      {/* Head */}
      <circle cx="40" cy="40" r="26" fill="#C4A882"/>
      {/* Left eye — happy closed arc */}
      <path d="M24 37 Q29 31 34 37" stroke="#3B281B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Right eye */}
      <path d="M46 37 Q51 31 56 37" stroke="#3B281B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Nose */}
      <polygon points="37,44 43,44 40,48" fill="#D4927A"/>
      {/* Mouth */}
      <path d="M36 48 Q40 53 44 48" stroke="#B88870" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Whiskers left */}
      <line x1="0" y1="41" x2="20" y2="43" stroke="#A89878" strokeWidth="1" opacity="0.45"/>
      <line x1="0" y1="47" x2="20" y2="45" stroke="#A89878" strokeWidth="1" opacity="0.45"/>
      {/* Whiskers right */}
      <line x1="60" y1="43" x2="80" y2="41" stroke="#A89878" strokeWidth="1" opacity="0.45"/>
      <line x1="60" y1="45" x2="80" y2="47" stroke="#A89878" strokeWidth="1" opacity="0.45"/>
      {/* Body */}
      <ellipse cx="40" cy="74" rx="20" ry="14" fill="#C4A882"/>
      {/* Left paw */}
      <ellipse cx="24" cy="83" rx="8" ry="4.5" fill="#B8987A"/>
      {/* Right paw */}
      <ellipse cx="56" cy="83" rx="8" ry="4.5" fill="#B8987A"/>
      {/* Tail — curls around the right side */}
      <path d="M58 76 Q74 66 68 54 Q64 46 68 42" stroke="#C4A882" strokeWidth="6" fill="none" strokeLinecap="round"/>
      {/* Tail tip */}
      <circle cx="68" cy="42" r="4" fill="#B8987A"/>
    </svg>
  );
}

export function PixelPlant() {
  return (
    <svg width="62" height="76" viewBox="0 0 62 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back leaves (darker) */}
      <ellipse cx="14" cy="38" rx="15" ry="7" fill="#3E5438" transform="rotate(-42 14 38)"/>
      <ellipse cx="48" cy="38" rx="15" ry="7" fill="#3E5438" transform="rotate(42 48 38)"/>
      {/* Mid leaves */}
      <ellipse cx="18" cy="30" rx="12" ry="6" fill="#4A6040" transform="rotate(-22 18 30)"/>
      <ellipse cx="44" cy="30" rx="12" ry="6" fill="#4A6040" transform="rotate(22 44 30)"/>
      {/* Center tall leaf */}
      <ellipse cx="31" cy="22" rx="9" ry="22" fill="#5E7A52"/>
      {/* Center vein */}
      <ellipse cx="31" cy="22" rx="2.5" ry="18" fill="#6A8C5E" opacity="0.55"/>
      {/* Pot rim */}
      <rect x="8" y="46" width="46" height="7" rx="3.5" fill="#C89A78"/>
      {/* Soil */}
      <rect x="11" y="49" width="40" height="5" rx="1" fill="#3B281B" opacity="0.55"/>
      {/* Pot body (trapezoid via path) */}
      <path d="M11 53 L7 74 L55 74 L51 53 Z" fill="#B88870"/>
      {/* Pot shading */}
      <path d="M11 53 L8 68 L13 68 L16 53 Z" fill="#965A48" opacity="0.3"/>
      {/* Pot bottom highlight */}
      <rect x="7" y="71" width="48" height="3" rx="1.5" fill="#A07060" opacity="0.4"/>
    </svg>
  );
}

export function PixelCoffee() {
  return (
    <svg width="56" height="70" viewBox="0 0 56 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Steam wisps */}
      <path d="M14 13 Q10 7 14 1" stroke="#C8B896" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M28 11 Q24 5 28 1" stroke="#C8B896" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M42 13 Q38 7 42 1" stroke="#C8B896" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Mug body */}
      <rect x="2" y="15" width="42" height="40" rx="5" fill="#EDE4CC"/>
      {/* Mug inner shadow top */}
      <rect x="4" y="15" width="38" height="5" rx="2" fill="#D4C8A8" opacity="0.5"/>
      {/* Coffee surface */}
      <rect x="5" y="18" width="36" height="10" rx="3" fill="#6A4020"/>
      {/* Coffee shine */}
      <ellipse cx="16" cy="22" rx="6" ry="2.5" fill="#8A6040" opacity="0.5"/>
      {/* Handle */}
      <path d="M44 27 Q56 27 56 35 Q56 44 44 44"
        stroke="#D4C4A0" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      {/* Mug base/saucer */}
      <rect x="0" y="55" width="48" height="6" rx="3" fill="#D4C4A0"/>
      {/* Saucer shadow */}
      <rect x="3" y="59" width="42" height="2" rx="1" fill="#B8A880" opacity="0.4"/>
    </svg>
  );
}
