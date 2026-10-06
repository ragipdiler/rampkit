"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";

export function GitHubStars() {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("https://api.github.com/repos/ragipdiler/rampkit", {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (
          Number.isSafeInteger(data?.stargazers_count) &&
          data.stargazers_count >= 0
        )
          setStars(data.stargazers_count);
      })
      .catch(() => {
        /* Keep the repository link usable when GitHub is unavailable. */
      });
    return () => controller.abort();
  }, []);
  return (
    <a
      className="github-link github-stars"
      href="https://github.com/ragipdiler/rampkit"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        stars === null
          ? "Rampkit on GitHub"
          : `Rampkit on GitHub, ${stars} stars`
      }
    >
      <Image src="/brand/github-invertocat.svg" alt="" width={18} height={18} />
      <span>GitHub</span>
      <Star size={14} aria-hidden="true" />
      <span className="star-count">
        {stars === null
          ? "—"
          : new Intl.NumberFormat("en", { notation: "compact" }).format(stars)}
      </span>
    </a>
  );
}
