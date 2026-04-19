# TierDuel: Refactoring to Multi-List Architecture

## Objective
Convert a single-list application into a multi-list management system with persistence.

## Current State
- App manages one global array of items in `src/lib/store.ts`.
- Components directly subscribe to this single store.

## Desired State
1. **Multi-List Storage**:
   - Primary store (`lists`) contains an array of `List` objects.
   - Each `List` has: `{ id: string, name: string, items: Item[], lastUpdated: number }`.
2. **Persistence**:
   - Use `localStorage` to save/load the entire lists array.
   - Implementation: A wrapper around Svelte stores or a custom store with `subscribe`.
3. **UI/UX**:
   - Home page (`+page.svelte`) becomes a dashboard/selector.
   - Button "Create New Tierlist" at the top.
   - Ability to rename lists.

## Implementation Steps
- [ ] Refactor `src/lib/store.ts` to handle `ListState` (collection of lists).
- [ ] Implement `activeListId` to track which list is currently being edited.
- [ ] Create a `localStorage` wrapper in `src/lib/store.ts`.
- [ ] Update `src/routes/+page.svelte` to show the list of all tierlists.
- [ ] Ensure `rankedItems` and `pendingComparisons` in `store.ts` are derived from the *active* list.
