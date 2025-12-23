# PRODUCT_DECISIONS

This document captures product and UX decisions made for the tasks application, including priorities, accessibility, and performance criteria.

## UX choices

- **Single-page workflow**: all actions (create/edit/complete/delete/filter) are available from one screen to minimize navigation friction.
- **Create/Edit in dialogs**: dialogs keep context and reduce page complexity while supporting keyboard focus management.
- **Clear feedback loops**:
  - **Loading**: skeleton placeholders while fetching.
  - **Errors**: inline error card with a Retry button.
  - **Success/failure**: toasts for create/update/delete operations.
- **Density vs readability**: tasks are shown as cards with key metadata (priority/status/due date) and optional description.

## Feature prioritization

1. **Core CRUD + persistence** (must-have): create, read, update, delete; JSON file storage.
2. **Task status + filtering**: complete/pending plus filter for quick focus.
3. **Robust UX states**: loading, error, success feedback.
4. **Accessibility baseline**: labels, keyboard navigation, focus visibility.
5. **Performance**: virtualized list to keep the UI responsive with large datasets.

De-scoped intentionally:
- Authentication / multi-user support
- Advanced search / tags
- Recurring tasks
- Server-side pagination

## Accessibility considerations

- **Form labels** are wired via `htmlFor` + input `id`.
- **Dialog accessibility** relies on Radix primitives (focus trap, ARIA roles/attributes).
- **Keyboard support**:
  - Open dialogs via button, close via close button / escape (Radix default).
  - Inputs support standard tab flow and focus-visible styles.
- **Color and focus**: Tailwind/shadcn patterns provide visible focus rings; badges are supplemental and not the only status cue.

## Performance criteria

- **Large list rendering**: the list is virtualized with TanStack Virtual so only visible rows are mounted.
- **Dynamic height support**: rows are measured (`measureElement`) to handle variable content (e.g., descriptions).
- **Network**:
  - Minimal fetches: initial load + mutations only.
  - UI remains usable on slow networks via loading and error recovery.

## Trade-offs

- **JSON file persistence** is simple and matches requirements, but is not optimized for high concurrency.
- **Virtualization** improves runtime performance but adds implementation complexity and requires careful measurement for variable row heights.


