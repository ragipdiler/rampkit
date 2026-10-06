"use client";
import { useState, type CSSProperties } from "react";

export type PaletteStudy = { name: string; anchor: string; colors: string[] };

export function PalettePlay({ studies }: { studies: PaletteStudy[] }) {
  const [selected, setSelected] = useState(0);
  const study = studies[selected];
  return (
    <div className="palette-play">
      <div className="hero-art" aria-hidden="true">
        <div className="hero-orbit" />
        <span className="orbit-dot dot-one" />
        <span className="orbit-dot dot-two" />
        <span className="orbit-dot dot-three" />
        <div className="swatch-fan">
          {[1, 3, 5, 7, 9].map((stop, i) => (
            <div
              className={"swatch-paper paper-" + i}
              key={stop}
              style={
                {
                  "--swatch": study.colors[stop],
                  "--angle": (i - 2) * 15 + "deg",
                } as CSSProperties
              }
            >
              <div className="paper-color">
                <span className="paper-hole" />
              </div>
              <div className="paper-caption">
                <span>{[50, 200, 400, 600, 800][i]}</span>
                <span className="paper-dashes" />
              </div>
            </div>
          ))}
        </div>
        <div className="anchor-note">
          <span style={{ background: study.anchor }} />
          <span>
            Your starting color
            <br />
            <strong>{study.anchor}</strong>
          </span>
          <span className="anchor-star">✳</span>
        </div>
        <div className="orbit-caption">
          12 stops. your starting color preserved.
        </div>
        <svg className="hero-spark" viewBox="0 0 46 46">
          <path
            d="M23 2V44M2 23H44M8 8L38 38M8 38L38 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className="study-controls">
        <span>Pick a starting point</span>
        <div
          className="study-options"
          role="radiogroup"
          aria-label="Illustration starting color"
        >
          {studies.map((item, i) => (
            <button
              key={item.name}
              type="button"
              role="radio"
              aria-checked={i === selected}
              tabIndex={i === selected ? 0 : -1}
              onClick={() => setSelected(i)}
              onKeyDown={(event) => {
                let next = selected;
                if (event.key === "ArrowRight" || event.key === "ArrowDown")
                  next = (selected + 1) % studies.length;
                else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
                  next = (selected - 1 + studies.length) % studies.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = studies.length - 1;
                else return;
                event.preventDefault();
                setSelected(next);
                event.currentTarget.parentElement
                  ?.querySelectorAll<HTMLButtonElement>("button")
                  [next]?.focus();
              }}
            >
              <span className="study-dot" style={{ background: item.anchor }} />
              {item.name}
            </button>
          ))}
        </div>
      </div>
      <p className="sr-only" role="status">
        {study.name} palette generated from {study.anchor}. Your anchor stays
        unchanged.
      </p>
    </div>
  );
}
