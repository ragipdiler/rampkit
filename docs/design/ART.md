# Art — Atelier de couleur

Art is an optional presentation theme inspired by pigment, paper, engraving, and architectural forms. It never changes user colors, palette anchors, token mappings, or exports.

- Parchment `#f6f1e7` is shared by the navigation and content background. Ink, ultramarine, terracotta, and brass accents remain isolated from Classic UI tokens.
- Typography follows the application's platform font: system-ui, or locally bundled Google Sans Flex on Windows and Android.
- Original `atelier.svg` and `tessera.svg` interpret arches, perspective, cypress trees, rosettes, and geometric mosaics. They are not reproductions of historical artworks.
- Artwork is decorative, hidden from assistive technology, and does not capture pointer events. Empty-state compositions reserve separate space for engraving and product illustrations; user color inventories receive no decorative filters.
- Compact controls, keyboard access, responsive layout, and reduced-motion preferences remain available.

Implementation: `apps/web/app/art.css`, `apps/web/components/art-switcher.tsx`, and `apps/web/public/art/`. Browser checks: `tests/art-theme.spec.ts`.
