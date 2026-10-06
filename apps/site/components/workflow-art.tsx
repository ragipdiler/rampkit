/** Small color studies that explain each step without showing dashboard screens. */
export function WorkflowArt({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <svg
      className="workflow-art"
      viewBox="0 0 220 150"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="110" cy="126" rx="66" ry="8" fill="var(--purple-50)" />
      {step === 1 && (
        <>
          <rect
            x="49"
            y="41"
            width="54"
            height="64"
            rx="18"
            fill="var(--orange-200)"
            transform="rotate(-14 49 41)"
          />
          <rect
            x="93"
            y="26"
            width="54"
            height="64"
            rx="18"
            fill="var(--purple-400)"
            transform="rotate(10 93 26)"
          />
          <rect
            x="130"
            y="64"
            width="44"
            height="53"
            rx="15"
            fill="var(--green-200)"
            transform="rotate(18 130 64)"
          />
          <circle cx="114" cy="69" r="7" fill="white" fillOpacity=".8" />
          <path d="m97 90 23 14-12 3-5 12-6-29Z" fill="var(--neutral-950)" />
          <circle cx="171" cy="29" r="4" fill="var(--orange-200)" />
        </>
      )}
      {step === 2 && (
        <>
          {[
            "--purple-100",
            "--purple-200",
            "--purple-400",
            "--purple-600",
            "--purple-800",
          ].map((color, i) => (
            <g
              key={color}
              transform={`translate(${45 + i * 23} ${41 - Math.sin((i / 4) * Math.PI) * 14}) rotate(${(i - 2) * 10} 18 40)`}
            >
              <rect width="36" height="79" rx="10" fill={`var(${color})`} />
              <circle cx="18" cy="12" r="3" fill="white" fillOpacity=".65" />
            </g>
          ))}
          <circle cx="170" cy="23" r="4" fill="var(--orange-200)" />
        </>
      )}
      {step === 3 && (
        <>
          <g transform="rotate(-9 75 74)">
            <rect x="34" y="30" width="77" height="88" rx="19" fill="white" />
            <rect
              x="47"
              y="45"
              width="32"
              height="9"
              rx="4.5"
              fill="var(--purple-200)"
            />
            <text
              x="47"
              y="86"
              fill="var(--neutral-950)"
              fontSize="26"
              fontFamily="system-ui,sans-serif"
            >
              Aa
            </text>
            <rect
              x="47"
              y="99"
              width="49"
              height="5"
              rx="2.5"
              fill="var(--neutral-100)"
            />
          </g>
          <g transform="rotate(9 145 73)">
            <rect
              x="112"
              y="25"
              width="76"
              height="91"
              rx="19"
              fill="var(--neutral-950)"
            />
            <rect
              x="125"
              y="40"
              width="32"
              height="9"
              rx="4.5"
              fill="var(--purple-400)"
            />
            <text
              x="125"
              y="82"
              fill="white"
              fontSize="26"
              fontFamily="system-ui,sans-serif"
            >
              Aa
            </text>
            <rect
              x="125"
              y="95"
              width="49"
              height="5"
              rx="2.5"
              fill="var(--neutral-700)"
            />
          </g>
          <circle cx="109" cy="114" r="12" fill="var(--green-200)" />
          <path
            d="m104 114 4 4 7-8"
            stroke="var(--green-800)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {step === 4 && (
        <>
          <g transform="rotate(-7 105 77)">
            <rect x="63" y="22" width="87" height="99" rx="18" fill="white" />
            <path
              d="m90 42-7 7 7 7m23-14 7 7-7 7"
              stroke="var(--purple-500)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="81"
              y="73"
              width="49"
              height="6"
              rx="3"
              fill="var(--purple-200)"
            />
            <rect
              x="81"
              y="87"
              width="33"
              height="6"
              rx="3"
              fill="var(--purple-100)"
            />
          </g>
          <circle cx="153" cy="102" r="22" fill="var(--purple-500)" />
          <path
            d="M153 91v21m-8-8 8 8 8-8"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="45" cy="59" r="5" fill="var(--orange-200)" />
        </>
      )}
    </svg>
  );
}
