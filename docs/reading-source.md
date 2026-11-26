# Reading the effective game source

Status: source-reading guide, not a complete subsystem map. Base source inspection: `69997572a43473255b0aa2dc35653909bac3ffe9`. Build-variant inspection: `b69e328805f51ae965c3545c040d5cfa4a51032a`. Both revisions are on `work/docs-release-guide`, reviewed 2026-11-24. No builds or tests were executed for this guide.

## Scope and inspected entry points

- [Base HTML builder](../scripts/build_game.py)
- [Split-source reader](../scripts/split_script_sources.py)
- [Core inliner](../scripts/core_sources.py)
- [Node engine loader](../scripts/lib_engine_load.cjs)
- [Hero variant builder](../scripts/build_arms_hero.py)
- [Entry-screen builder](../scripts/build_entry_preview.py)
- [Combined candidate builder](../scripts/build_combined_preview.py)

This page describes source assembly and candidate variants. For release triggers and packaging, see the [release section](../DEVELOPMENT.md#production-boundary). It is not a save-compatibility acceptance report.

## Source layers

```text
Base script file OR ordered source parts
  -> matching edits.json files in filename order
  -> core module inlining
  -> substitution into the HTML template
  -> base preview/index.html
```

Reading a base script alone is not enough to establish effective behavior. An edit may replace that code, and an inserted marker may load a separate core module. Inspect all relevant layers and callers.

## Reading split sources completely

The builder calls `read_source` for each numbered script. If the corresponding `.parts` directory exists, the reader uses its `manifest.json`; otherwise it reads the whole `.txt` file.

Read the manifest and all listed `part-NNN.txt` files in order. The reader requires consecutive names starting at `part-001.txt`, checks for missing or extra matching parts, validates UTF-8, byte lengths and SHA256 values, and checks the reconstructed source length and hash. Each part must be nonempty and no larger than 12000 bytes. This is a project limit, not a guarantee about every AI tool's retrieval or context limits.

If the whole source file is retained, the reader also requires it to match the joined parts byte for byte. Do not treat the whole file and the parts as independent editable versions. Before changing a split source, inspect how its mirror and manifest must be updated together. This guide does not authorize regenerating them blindly.

Record which parts were obtained in full. If retrieval is truncated, obtain the missing content before claiming a complete review.

## Following applied edits

For a script stem, the builder finds matching `*.edits.json` files and sorts their names. Each edit specification must match the original source SHA256 or Git blob SHA1. Its edits then run sequentially on the evolving source; every nonempty old fragment must occur exactly once at the time it is replaced.

Inspect relevant edit files in that same order, including later edits that can change earlier results. Do not rename, reorder, or squash them merely for readability: names affect application order. Such changes require a separate equivalence check and regression review.

## Following core modules

After applying edits, the builder calls `inline_core`. The inspected inliner resolves the ability-progression marker from `src/core/ability-progression.js`, rejects duplicate markers when present, and rejects unsafe or unresolved core content. Follow the referenced module rather than treating a marker as the full implementation.

## Node-test loader difference to investigate

The inspected Node engine loader reads the whole `.txt` file directly, then applies sorted edits and inlines core. It does not use the Python split-source reader. The base HTML builder can read the parts and checks them against a retained whole file when present.

This is an observed input-reading difference, not proof that tests currently fail or disagree with the game. Before changing either path, inspect consumers, mirror checks, and fixtures; compare effective source and behavior. No loader changes are included here.

## Build variants

The following describes default invocations; `build_game.py --entry-screen` is a separate option that also adds the entry screen to the base output.

| Output | Builder | Added transformation |
|---|---|---|
| `preview/index.html` | `build_game.py` | Base source assembly. |
| `preview/arms-hero.html` | `build_arms_hero.py` | Rebuilds the base, then inserts `window.__AZEROT_ARMS_HERO__=true;` before its first script. |
| `preview/entry.html` | `build_entry_preview.py` | Rebuilds the base, then embeds the entry screen into a separate output. |
| `preview/combined.html` | `build_combined_preview.py` | Runs the hero builder, then embeds the entry screen into the hero variant. |

```text
Game sources -> base preview/index.html
  + entry screen -> preview/entry.html
  + hero flag -> preview/arms-hero.html
                   + entry screen -> preview/combined.html
                                      -> release checks and packaging
```

The inspected release workflow packages `preview/combined.html`, not the base or entry-only variant. When reporting a browser check, identify which output and source revision were tested. A result for one variant is not automatically acceptance of another.

The combined builder checks for exactly one entry overlay and hero flag, checks that combining does not modify the existing base and hero outputs, and records their hashes and source commit in `preview/combined-build.json`. These guards do not establish complete gameplay or save compatibility.

## Where to investigate an entry-screen fix

| Concern | Starting point |
|---|---|
| Markup | [Entry HTML](../src/entry/screen.html) |
| Layout and styling | [Entry CSS](../src/entry/screen.css) |
| Buttons and runtime behavior | [Entry JavaScript](../src/entry/screen.js) |
| Artwork selection and embedding | [Entry builder](../scripts/build_entry_preview.py) and `src/assets/entry/` |
| Hero-mode behavior | Find consumers of `__AZEROT_ARMS_HERO__`; the hero builder only enables the flag. |
| Release packaging | [Pages workflow](../.github/workflows/pages.yml) |

These entry source paths were identified from the builder; their contents and runtime correctness were not audited for this addition. The entry assembler embeds HTML, CSS and JavaScript and converts the selected PNGs to data URIs. It checks the selected images' format, dimensions and Git blob hashes. Do not silently substitute artwork or change these guards.

## Save-safety boundary

The hero builder inserts a flag; that alone does not prove save isolation or compatibility. Preview-only wording in a builder or manifest is not a safety guarantee, especially when the combined output is used by the release workflow. Trace flag consumers and save/load paths and run targeted acceptance before making claims about ordinary saves. No save behavior is changed or accepted by this documentation update.

## Before choosing where to fix a problem

1. Record the exact revision.
2. Read the base source or all its parts.
3. Follow matching edits in application order and any inlined core.
4. Inspect callers, data inputs, saved state, and related tests.
5. Identify later candidate-build transformations if the affected behavior depends on them.
6. Choose the owning source layer; do not default to editing generated HTML.
7. Report inspections, executed checks, and remaining uncertainty separately.
