# Rampkit UI conventions

Rampkit is a compact desktop color utility. Preserve the completed workflows and distinguish application chrome from the user's actual color data.

## Layout

A single top navigation row contains the logo, workspace pages, Art toggle, and public author profile. Page title, primary tabs, Token theme where applicable, and actions share the secondary row. Headings have no description underneath. Avoid blank action-only rows and excess spacing.

Text sections stay within 560px. Cards have inner padding and rounded corners. Resting content cards have no shadows; overlays may use elevation. Layout chrome has no dividers. Outline actions use transparent backgrounds and 0.5px borders. Never underline interactive text.

## Controls and hierarchy

Standard controls are 22–28px high. Command rows and multiline values use content-driven heights. Primary actions are filled, secondary actions neutral, and lower-priority actions outlined. Tabs use text-only selection: inactive weight 400, selected 450. Keep keyboard focus indicators and reduced-motion support.

Token theme is independent: neutral-50 track, white selected pill, purple-500 active text/icons, neutral-500 inactive text/icons, no border or shadow. Searchable selectors filter names without changing mappings until selection; Escape restores focus.

CopyButton holds its geometry while copy/check icons crossfade for 180ms. Success uses green-600 and resets after 1800ms. Accessible live status is visually hidden; no Copied line enters the layout. Failed writes never show success.

## Color and typography

Classic consumes exact OKLCH primitives and semantic aliases from `apps/web/app/classic-palette.css`. Art keeps its separate parchment/art colors and decorative imagery. Color data, charts in token previews, and paint pigments keep their actual values.

All UI typography uses `--app-font`: system-ui by default, locally bundled Google Sans Flex on Windows/Android. Fonts are not fetched from external services at runtime. Retain existing sizes and weights.

The Classic primary button's supplied white/purple-500 mapping has 2.86:1 contrast. This known limitation must not be described as passing normal-text AA or silently fixed by changing user-supplied palette values.

## Canvas and decorative artwork

The paper is independent of Classic/Art appearance. A padded, rounded floating supply tray contains six pigments per page and previous/next arrows. Brush settings align in three columns. Paging must not alter strokes, pigment, camera, or undo history.

Source, Palettes, Tokens, Contrast, and Export empty illustrations are decorative. Art engravings sit in normal flow above the color illustration with a 16px gap, rather than overlapping it. Animations do not generate workspace data and respect reduced motion.
