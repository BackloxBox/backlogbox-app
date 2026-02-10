# PRD: Book Section Enhancements

**Date:** 2026-02-10

---

## Problem Statement

### What problem are we solving?

The books section has inconsistencies compared to the recently enhanced movies section, and misses opportunities to store useful metadata from OpenLibrary. Specific issues:

- **Card subtitle omits year**: Movies show `Year · Genre`, but books show `Author · Genre` with no year
- **Manual add form missing ISBN**: Schema stores it, search populates it, detail panel displays it, but manual entry has no ISBN field
- **Duplicated card logic**: KanbanCard and MobileCard have identical subtitle/badge derivation logic copy-pasted
- **Underutilized OpenLibrary data**: Language and publisher are available from search but not stored. Could be useful for multilingual readers or edition tracking.

### Why now?

Movies were just enhanced with director, cast, description, runtime badge. Books should reach parity in data richness and UI consistency before moving to the next media type.

### Who is affected?

- **Primary users:** Readers tracking their book backlog who add books via search or manually

---

## Proposed Solution

### Overview

Enrich the book data model with additional OpenLibrary fields (language, publisher), fix the card subtitle to include year, add ISBN to the manual add form, and extract duplicated card logic into a shared utility.

### User Experience

- **Card year badge**: Release year shown as a pill on cover bottom-right (like runtime on movies, season on series) — e.g. `1965`
- **Card subtitle**: Stays `Author · Genre` (no year — it's in the badge now)
- **Detail panel**: Shows language and publisher when available, in addition to existing fields
- **Manual add form**: Gains an optional ISBN field

---

## End State

When this PRD is complete, the following will be true:

- [ ] `book_meta` schema has `language` and `publisher` columns
- [ ] OpenLibrary search populates language and publisher in results
- [ ] Book cards show release year as cover badge pill (like runtime/season badges)
- [ ] Book card subtitle stays `Author · Genre`
- [ ] Detail panel shows language and publisher for books
- [ ] Manual add form includes optional ISBN field
- [ ] KanbanCard and MobileCard subtitle/badge logic extracted to shared utility
- [ ] All acceptance criteria pass
- [ ] `svelte-check` passes with 0 errors

---

## Acceptance Criteria

### Feature: Enriched book data model

- [ ] `book_meta` table has `language text` and `publisher text` columns
- [ ] Migration generated and applied
- [ ] `extractMeta` in `data.remote.ts` includes `language` and `publisher` for books
- [ ] `addItemSchema` valibot schema includes `language` and `publisher`

### Feature: OpenLibrary search enrichment

- [ ] Search requests include `language` and `publisher` fields
- [ ] First language (ISO 639 code) stored; displayed as human-readable name
- [ ] First publisher stored (from the often-noisy array)
- [ ] Existing fields (author, genre, pageCount, isbn, description) continue to work

### Feature: Book card year badge

- [ ] KanbanCard shows release year as pill badge on cover bottom-right (same position as runtime/season badges)
- [ ] MobileCard matches KanbanCard behavior
- [ ] Badge styled consistently with runtime badge (solid `bg-muted`, `ring-border`)

### Feature: Detail panel metadata

- [ ] Language shown in meta entries when present
- [ ] Publisher shown in meta entries when present
- [ ] Existing entries (Author, Genre, Pages, ISBN) unchanged

### Feature: Manual add form ISBN

- [ ] ISBN text input added to manual book form (optional)
- [ ] ISBN stored correctly via `collectManualData()` and `extractMeta()`

### Feature: Shared card utility

- [ ] Subtitle derivation logic extracted from KanbanCard and MobileCard into shared module
- [ ] Badge derivation logic (seasonBadge, runtimeBadge) extracted similarly
- [ ] Both card components import and use the shared logic
- [ ] No behavioral change — pure refactor

---

## Technical Context

### Existing Patterns

- `src/lib/server/search/openlibrary.ts` — Search provider, already fetches subjects/genre/description
- `src/routes/(app)/[type=mediaType]/data.remote.ts` — `extractMeta()` maps flat fields to meta tables, `addItemSchema` validates input
- `src/lib/components/board/KanbanCard.svelte` — Desktop card with DnD, subtitle/badge logic
- `src/lib/components/board/MobileCard.svelte` — Mobile card, identical subtitle/badge logic

### Key Files

- `src/lib/server/db/schema.ts` — `bookMeta` table definition
- `src/lib/server/search/openlibrary.ts` — OpenLibrary provider + `fetchBookDescription`
- `src/routes/(app)/[type=mediaType]/data.remote.ts` — Add/update commands, meta extraction
- `src/lib/components/board/AddItemModal.svelte` — Manual add form per media type
- `src/lib/components/board/KanbanCard.svelte` — Desktop kanban card
- `src/lib/components/board/MobileCard.svelte` — Mobile kanban card
- `src/lib/components/board/ItemDetailPanel.svelte` — Side panel detail view

---

## Risks & Mitigations

| Risk                                                     | Likelihood | Impact | Mitigation                                           |
| -------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------- |
| OpenLibrary `publisher` array is noisy (many editions)   | High       | Low    | Take first publisher only; acceptable approximation  |
| OpenLibrary `language` is ISO 639 codes, not human names | High       | Low    | Map common codes to display names (en→English, etc.) |
| Shared card utility refactor breaks DnD or rendering     | Low        | Medium | `svelte-check` + manual visual test after refactor   |

---

## Non-Goals (v1)

Explicitly out of scope for this PRD:

- **Reading progress tracking** (current page / total pages) — overkill per user decision
- **Page count badge on cover** — skipped, not as glanceable as runtime/season
- **Star rating changes** — keep current behavior (only show when rated)
- **Book series/volume detection** — OpenLibrary lacks structured series data in search API
- **Edition-level data** (specific publisher per edition, specific ISBN selection) — too complex for v1

---

## Open Questions

| Question             | Owner | Status                                                     |
| -------------------- | ----- | ---------------------------------------------------------- |
| Book subtitle format | User  | Resolved — keep `Author · Genre`, year goes in cover badge |
| Language display     | User  | Resolved — map ISO codes to human names                    |
