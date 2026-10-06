export function DiscoveryArt() {
  return (
    <svg viewBox="0 0 420 300" className="feature-art" aria-hidden="true">
      <rect x="48" y="32" width="258" height="200" rx="24" fill="white" />
      <circle cx="70" cy="52" r="3" fill="var(--neutral-200)" />
      <circle cx="82" cy="52" r="3" fill="var(--neutral-200)" />
      <circle cx="94" cy="52" r="3" fill="var(--neutral-200)" />
      <rect
        x="74"
        y="81"
        width="86"
        height="110"
        rx="18"
        fill="var(--purple-100)"
      />
      <path
        d="M74 153 Q119 103 160 153 V173 Q160 191 142 191 H92 Q74 191 74 173Z"
        fill="var(--purple-300)"
      />
      <circle cx="117" cy="113" r="15" fill="var(--purple-500)" />
      <rect
        x="178"
        y="84"
        width="87"
        height="8"
        rx="4"
        fill="var(--neutral-300)"
      />
      <rect
        x="178"
        y="103"
        width="65"
        height="5"
        rx="2.5"
        fill="var(--neutral-100)"
      />
      <rect
        x="178"
        y="116"
        width="82"
        height="5"
        rx="2.5"
        fill="var(--neutral-100)"
      />
      <rect
        x="178"
        y="153"
        width="63"
        height="24"
        rx="12"
        fill="var(--purple-500)"
      />
      <path
        d="M247 207 C276 207 272 241 307 241"
        fill="none"
        stroke="var(--neutral-300)"
        strokeWidth="1.5"
        strokeDasharray="3 5"
      />
      <g transform="translate(282 153) rotate(12)">
        <rect width="77" height="103" rx="14" fill="white" />
        <rect
          x="8"
          y="8"
          width="61"
          height="66"
          rx="9"
          fill="var(--purple-500)"
        />
        <rect
          x="17"
          y="85"
          width="43"
          height="4"
          rx="2"
          fill="var(--neutral-200)"
        />
      </g>
      <path
        d="M340 74V98M328 86H352"
        stroke="var(--purple-400)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="50" cy="252" r="6" fill="var(--orange-200)" />
    </svg>
  );
}

export function ScaleArt() {
  const colors = [
    "var(--purple-50)",
    "var(--purple-100)",
    "var(--purple-200)",
    "var(--purple-300)",
    "var(--purple-400)",
    "var(--purple-500)",
    "var(--purple-600)",
    "var(--purple-700)",
  ];
  return (
    <svg viewBox="0 0 420 300" className="feature-art" aria-hidden="true">
      <path
        d="M43 217 Q204 245 377 207"
        fill="none"
        stroke="var(--neutral-200)"
        strokeWidth="1.5"
        strokeDasharray="3 5"
      />
      {colors.map((color, i) => (
        <g
          key={color}
          transform={
            "translate(" +
            (40 + i * 42) +
            " " +
            (105 - Math.sin((i / 7) * Math.PI) * 30) +
            ") rotate(" +
            (i - 3.5) * 3 +
            " 16 55)"
          }
        >
          <rect width="34" height="118" rx="12" fill={color} />
          <circle cx="17" cy="16" r="3" fill="white" opacity=".55" />
        </g>
      ))}
      <circle cx="270" cy="250" r="17" fill="white" />
      <path
        d="M264 250V246 A6 6 0 0 1 276 246V250M263 250H277V259H263Z"
        fill="none"
        stroke="var(--purple-600)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M92 52V70M83 61H101"
        stroke="var(--orange-400)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function TokenArt() {
  return (
    <svg viewBox="0 0 420 300" className="feature-art" aria-hidden="true">
      <g transform="translate(43 76) rotate(-7 77 75)">
        <rect width="154" height="156" rx="22" fill="white" />
        <circle cx="28" cy="28" r="9" fill="var(--orange-200)" />
        <rect
          x="24"
          y="57"
          width="100"
          height="5"
          rx="2.5"
          fill="var(--neutral-200)"
        />
        <rect
          x="24"
          y="73"
          width="75"
          height="5"
          rx="2.5"
          fill="var(--neutral-100)"
        />
        <rect
          x="24"
          y="99"
          width="49"
          height="30"
          rx="15"
          fill="var(--purple-500)"
        />
        <circle cx="119" cy="114" r="12" fill="var(--purple-100)" />
      </g>
      <g transform="translate(218 66) rotate(7 77 75)">
        <rect width="154" height="156" rx="22" fill="var(--neutral-900)" />
        <path
          d="M28 19A9 9 0 1 0 37 29A8 8 0 0 1 28 19"
          fill="var(--purple-200)"
        />
        <rect
          x="24"
          y="57"
          width="100"
          height="5"
          rx="2.5"
          fill="var(--neutral-500)"
        />
        <rect
          x="24"
          y="73"
          width="75"
          height="5"
          rx="2.5"
          fill="var(--neutral-700)"
        />
        <rect
          x="24"
          y="99"
          width="49"
          height="30"
          rx="15"
          fill="var(--purple-300)"
        />
        <circle cx="119" cy="114" r="12" fill="var(--neutral-700)" />
      </g>
      <circle cx="210" cy="253" r="4" fill="var(--purple-400)" />
      <path
        d="M169 250Q211 279 252 250"
        stroke="var(--neutral-300)"
        fill="none"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function PaintArt() {
  return (
    <svg viewBox="0 0 660 430" className="paint-art" aria-hidden="true">
      <defs>
        <linearGradient id="paint-mix" x1="0%" x2="100%">
          <stop offset="0" stopColor="var(--purple-500)" />
          <stop offset=".4" stopColor="var(--purple-300)" />
          <stop offset=".75" stopColor="var(--orange-300)" />
          <stop offset="1" stopColor="var(--orange-500)" />
        </linearGradient>
      </defs>
      <ellipse cx="328" cy="235" rx="250" ry="125" fill="white" opacity=".65" />
      <path
        d="M116 240 C170 115 231 333 300 221 S417 149 463 217 S513 225 548 193"
        stroke="url(#paint-mix)"
        strokeWidth="76"
        strokeLinecap="round"
        fill="none"
        opacity=".7"
      />
      <path
        d="M100 226 C166 126 229 313 298 211 S418 143 466 208 S508 219 551 177"
        stroke="url(#paint-mix)"
        strokeWidth="38"
        strokeLinecap="round"
        fill="none"
        opacity=".9"
      />
      <path
        d="M106 210C178 162 226 286 290 205S415 155 468 203"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        opacity=".4"
      />
      <g transform="translate(467 48) rotate(34)">
        <rect
          x="12"
          width="17"
          height="98"
          rx="8.5"
          fill="var(--neutral-200)"
        />
        <rect
          x="9"
          y="79"
          width="23"
          height="34"
          rx="4"
          fill="var(--neutral-400)"
        />
        <path d="M9 108H32V141Q20 151 9 141Z" fill="var(--purple-500)" />
        <path
          d="M15 115V136M21 115V140M27 115V135"
          stroke="var(--purple-300)"
          strokeWidth="1"
        />
      </g>
      <circle cx="130" cy="79" r="12" fill="var(--purple-300)" />
      <circle cx="91" cy="107" r="6" fill="var(--purple-200)" />
      <g transform="translate(245 336)">
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x={i * 39}
            y={i % 2 ? -5 : 0}
            width="31"
            height="35"
            rx="9"
            fill={
              [
                "var(--purple-400)",
                "var(--purple-200)",
                "var(--orange-100)",
                "var(--orange-300)",
                "var(--orange-500)",
              ][i]
            }
          />
        ))}
      </g>
      <path
        d="M590 294V318M578 306H602"
        stroke="var(--purple-300)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
