import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Code2,
  Contrast,
  LockKeyhole,
  Palette,
  Paintbrush,
  Terminal,
} from "lucide-react";
import { normalizeColor } from "../../../packages/core/src/color";
import { createPalette } from "../../../packages/core/src/palettes";
import { PalettePlay } from "../components/palette-play";
import {
  DiscoveryArt,
  ScaleArt,
  TokenArt,
  PaintArt,
} from "../components/illustrations";
import { WorkflowArt } from "../components/workflow-art";
import { HeadingColor } from "../components/heading-color";
import { StickyHeader } from "../components/sticky-header";
import { GitHubStars } from "../components/github-stars";
import { InstallCommand } from "../components/install-command";

const repository = "https://github.com/ragipdiler/rampkit";
const studies = [
  { name: "Lavender", anchor: "#918df6" },
  { name: "Terracotta", anchor: "#d37861" },
  { name: "Lagoon", anchor: "#279f93" },
].map((study) => ({
  ...study,
  colors: createPalette(study.name, [
    {
      step: 500,
      color: normalizeColor(study.anchor)!,
      locked: true,
      origin: "manual",
    },
  ]).stops.map((stop) => stop.color.hex),
}));

const details = [
  {
    icon: Contrast,
    title: "Check contrast before you ship",
    text: "Review text and UI contrast ratios against your actual colors. See failures and suggestions without changing your palette automatically.",
  },
  {
    icon: Code2,
    title: "Export in the format you use",
    text: "Get CSS variables, JSON, Tailwind CSS v4, or W3C-style tokens. Copy an integration prompt for Codex, Claude Code, or VS Code.",
  },
  {
    icon: LockKeyhole,
    title: "Keep your work on your machine",
    text: "No account, database, or paid API. Website analysis runs in a local Chromium browser. Manual color work can run offline after installation.",
  },
];

export default function Page() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <StickyHeader>
        <header className="site-header wrap">
          <Link className="site-brand" href="/" aria-label="Rampkit home">
            <Image
              src="/brand/rampkit-mark.svg"
              alt=""
              width={22}
              height={22}
            />
            Rampkit
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#workflow">How it works</a>
            <a href="#installation">Installation</a>
          </nav>
          <GitHubStars />
        </header>
      </StickyHeader>

      <main id="main">
        <section className="hero wrap">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="status-dot" />
              Open-source color system builder
            </span>
            <h1>
              Turn a color into
              <br />a usable <HeadingColor />
            </h1>
            <p className="hero-description">
              Extract colors from a website or start with your own. Build OKLCH
              palettes, map light and dark tokens, and export them for your app.
            </p>
            <div className="hero-actions">
              <a className="site-button main-button" href="#installation">
                Get started <ArrowDown size={16} />
              </a>
              <a
                className="site-button outline-button"
                href={repository}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub <ArrowUpRight size={16} />
              </a>
            </div>
            <p className="hero-note">
              Free to use. Runs locally. Your colors stay yours.
            </p>
          </div>
          <PalettePlay studies={studies} />
        </section>

        <div className="principles wrap" aria-label="Project principles">
          <span>
            <Check size={14} />
            MIT licensed
          </span>
          <span>
            <Check size={14} />
            No account
          </span>
          <span>
            <Check size={14} />
            No database
          </span>
          <span>
            <Check size={14} />
            No paid API
          </span>
        </div>

        <section className="features wrap section" id="features">
          <div className="section-heading">
            <span className="eyebrow">WHY RAMPKIT</span>
            <h2>A palette is only the beginning.</h2>
            <p>
              A few good colors still need consistent scales, clear roles,
              accessible pairings, and usable exports. Rampkit brings those
              steps into one local workspace.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <div className="art-stage">
                <DiscoveryArt />
              </div>
              <div className="feature-copy">
                <span className="feature-number">01 / DISCOVER</span>
                <h3>Start with colors you already use.</h3>
                <p>
                  Analyze a website to find useful colors and see where they
                  appear. Or add a HEX, RGB, or OKLCH color yourself. You choose
                  what becomes a palette.
                </p>
              </div>
            </article>
            <article className="feature-card">
              <div className="art-stage">
                <ScaleArt />
              </div>
              <div className="feature-copy">
                <span className="feature-number">02 / GENERATE</span>
                <h3>Build a consistent color scale.</h3>
                <p>
                  Generate 12-stop OKLCH palettes around your original colors.
                  Lock anchors, adjust generation, and keep the exact values you
                  started with.
                </p>
              </div>
            </article>
            <article className="feature-card">
              <div className="art-stage">
                <TokenArt />
              </div>
              <div className="feature-copy">
                <span className="feature-number">03 / MAP</span>
                <h3>Give every color a clear role.</h3>
                <p>
                  Map background, surface, text, border, action, and status
                  tokens. Edit Light and Dark separately, then try your mappings
                  in component previews.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className="paint-section wrap" aria-labelledby="paint-title">
          <div className="paint-copy">
            <span className="eyebrow">
              <Paintbrush size={14} />
              THE CANVAS
            </span>
            <h2 id="paint-title">
              Paint, mix, and
              <br />
              collect new colors.
            </h2>
            <p>
              Some colors are easier to find by making them. Paint on an
              infinite canvas, blend pigments, and sample the colors or
              gradients you discover.
            </p>
            <p>
              Turn a study into palette anchors when you are ready. Save your
              painting locally and come back to it later.
            </p>
            <span className="small-note">
              Pigment mixing is an approximation of paint, not a physical
              simulation.
            </span>
          </div>
          <div className="paint-illustration">
            <PaintArt />
            <span className="art-label">
              <Palette size={14} />
              Explore first. Build a palette when you are ready.
            </span>
          </div>
        </section>

        <section className="details wrap section" aria-label="More features">
          {details.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <span className="detail-icon">
                <Icon size={21} strokeWidth={1.5} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </section>

        <section className="workflow wrap section" id="workflow">
          <div className="section-heading">
            <span className="eyebrow">HOW IT WORKS</span>
            <h2>From a starting color to your app.</h2>
            <p>
              Four steps from a starting color to a system you can use. You
              choose the colors and keep control of every mapping.
            </p>
          </div>
          <ol className="workflow-steps">
            <li>
              <div className="workflow-art-stage">
                <WorkflowArt step={1} />
                <span className="step-badge">01</span>
              </div>
              <h3>Choose your colors</h3>
              <p>
                Extract from a website, enter a color, or sample your canvas.
              </p>
            </li>
            <li>
              <div className="workflow-art-stage">
                <WorkflowArt step={2} />
                <span className="step-badge">02</span>
              </div>
              <h3>Create your palettes</h3>
              <p>Lock your starting colors. Generate and refine the scale.</p>
            </li>
            <li>
              <div className="workflow-art-stage">
                <WorkflowArt step={3} />
                <span className="step-badge">03</span>
              </div>
              <h3>Map and check</h3>
              <p>
                Assign light and dark roles. Preview components and check
                contrast.
              </p>
            </li>
            <li>
              <div className="workflow-art-stage">
                <WorkflowArt step={4} />
                <span className="step-badge">04</span>
              </div>
              <h3>Export and apply</h3>
              <p>
                Copy CSS, download tokens, or hand off to your coding assistant.
              </p>
            </li>
          </ol>
        </section>

        <section className="installation wrap section" id="installation">
          <div className="installation-heading">
            <span className="eyebrow">
              <Terminal size={14} />
              INSTALLATION
            </span>
            <h2>Run Rampkit on your machine.</h2>
            <p>
              Copy the commands into your terminal. Install once, then open the
              local app whenever you need it.
            </p>
          </div>
          <InstallCommand />
          <div className="installation-meta">
            <div className="requirements">
              <span>YOU WILL NEED</span>
              <p>
                <a
                  href="https://nodejs.org/en/download"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Node.js 22.13 or newer <ArrowUpRight size={13} />
                </a>
                <br />
                npm · Git · macOS, Windows, or Linux
              </p>
            </div>
            <p className="small-note">
              On Linux, use{" "}
              <code>npx playwright install --with-deps chromium</code> if
              Chromium needs system libraries.
            </p>
            <a
              className="text-link"
              href={repository + "#installation"}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the setup guide <ArrowUpRight size={15} />
            </a>
          </div>
        </section>

        <section className="faq wrap section" aria-labelledby="faq-title">
          <div className="section-heading">
            <span className="eyebrow">A FEW USEFUL DETAILS</span>
            <h2 id="faq-title">Before you start.</h2>
          </div>
          <div className="faq-list">
            <details>
              <summary>
                Is there an online version of the studio?<span>+</span>
              </summary>
              <p>
                This website introduces Rampkit. The studio runs locally,
                including its Chromium-based website analysis. Follow the
                installation steps above to use the full app.
              </p>
            </details>
            <details>
              <summary>
                Does Rampkit save my workspace?<span>+</span>
              </summary>
              <p>
                The color-system workspace stays in memory. Export before
                reloading or closing the tab. Paintings and color studies have
                separate save and open controls for local files.
              </p>
            </details>
            <details>
              <summary>
                Will the generated colors always meet WCAG?<span>+</span>
              </summary>
              <p>
                No. Rampkit reports contrast ratios and failures for the pairs
                you check. Review your mappings and application usage; a passing
                color pair does not establish full application accessibility.
              </p>
            </details>
            <details>
              <summary>
                Can I use it in a commercial project?<span>+</span>
              </summary>
              <p>
                Yes. Rampkit is MIT licensed. You can use and modify the source
                under the license terms. Dependencies and brand assets keep
                their own licenses, documented in the repository.
              </p>
            </details>
            <details>
              <summary>
                What makes OKLCH useful here?<span>+</span>
              </summary>
              <p>
                OKLCH separates perceived lightness, chroma, and hue. That gives
                Rampkit a consistent way to shape a scale around your anchors,
                while retaining their normalized values.
              </p>
            </details>
          </div>
        </section>

        <section className="closing wrap">
          <div>
            <span className="eyebrow">OPEN SOURCE. LOCAL FIRST.</span>
            <h2>Use it. Learn from it. Make it your own.</h2>
            <p>
              Built for designers and developers who want more control over
              their colors.
            </p>
          </div>
          <a className="site-button main-button" href="#installation">
            Install Rampkit <ArrowDown size={16} />
          </a>
        </section>
      </main>

      <footer className="site-footer wrap">
        <Link className="site-brand" href="/" aria-label="Rampkit home">
          <Image src="/brand/rampkit-mark.svg" alt="" width={20} height={20} />
          Rampkit
        </Link>
        <span>A local-first color system builder.</span>
        <nav aria-label="Footer navigation">
          <a href={repository}>Source</a>
          <a href={repository + "/blob/main/CONTRIBUTING.md"}>Contribute</a>
          <a href={repository + "/blob/main/LICENSE"}>MIT license</a>
        </nav>
      </footer>
    </>
  );
}
