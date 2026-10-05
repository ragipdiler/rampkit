import type { CSSProperties } from "react";
import { ArrowDown } from "lucide-react";

type Variant = "source" | "palettes" | "tokens" | "contrast" | "export";
const stops = [
  [0.96, 0.025],
  [0.84, 0.055],
  [0.68, 0.085],
  [0.49, 0.09],
  [0.3, 0.06],
];
function Tone({
  index,
  children,
}: {
  index: number;
  children?: React.ReactNode;
}) {
  return (
    <span
      className="empty-tone"
      style={
        {
          "--tone-l": stops[index][0],
          "--tone-c": stops[index][1],
          "--tone-delay": `${index * 0.5}s`,
        } as CSSProperties
      }
    >
      {children}
    </span>
  );
}

/** Decorative only: these illustrations never create palette or token data. */
export function EmptyIllustration({ variant }: { variant: Variant }) {
  return (
    <div
      className={`empty-illustration empty-illustration-${variant}`}
      aria-hidden="true"
      data-decorative="true"
    >
      {variant === "palettes" && (
        <div className="empty-ramp">
          {stops.map((_, index) => (
            <Tone key={index} index={index} />
          ))}
        </div>
      )}
      {variant === "source" && (
        <div className="empty-source-swatches">
          {stops.map((_, index) => (
            <div
              className="empty-source-card"
              key={index}
              style={
                {
                  "--card-angle": `${(index - 2) * 6}deg`,
                  "--card-rise": `${Math.abs(index - 2) * 2}px`,
                } as CSSProperties
              }
            >
              <Tone index={index} />
              <span className="empty-source-caption">
                <span />
                <span />
              </span>
            </div>
          ))}
        </div>
      )}
      {variant === "tokens" && (
        <div className="empty-token-mappings">
          {[1, 2, 3].map((index) => (
            <div className="empty-token-row" key={index}>
              <Tone index={index} />
              <span className="empty-reference-line" />
              <span className="empty-reference-dot" />
            </div>
          ))}
        </div>
      )}
      {variant === "contrast" && (
        <div className="empty-contrast-pair">
          <Tone index={0}>
            <span>Aa</span>
          </Tone>
          <Tone index={4}>
            <span>Aa</span>
          </Tone>
        </div>
      )}
      {variant === "export" && (
        <div className="empty-export-file">
          <div className="empty-file-lines">
            {[1, 2, 3].map((index) => (
              <Tone key={index} index={index} />
            ))}
          </div>
          <ArrowDown className="empty-export-arrow" size={24} strokeWidth={2} />
        </div>
      )}
    </div>
  );
}
