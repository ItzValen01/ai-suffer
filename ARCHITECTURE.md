# Architecture

## Architectural Ownership

The team owns and defines the project's scaffolding. The repository must not be allowed to drift into a monolithic, single-file implementation.

The following four separation-of-concerns invariants are mandatory:

- **Documentation & Audit:** Clear architectural justification and an active AI prompt trail.
- **Asset Isolation:** Separation of multimedia files from source code.
- **Configuration Decoupling:** Global constants (speeds, screen bounds, keys) extracted from core logic.
- **Automated Testing:** Dedicated test files decoupled from presentation/rendering loops.

These rules apply whenever the project is extended or reorganized. A feature is not architecturally complete if it works but violates one of these boundaries.

## Current Project Boundaries

The current repository has two primary runtime areas:

- **Go backend:** HTTP server, profile persistence, high scores, and runtime data handling.
- **`static/`:** Browser-facing HTML, CSS, and JavaScript for the game presentation and client runtime.

Runtime-generated persistence belongs in `data.json`; it is not source code and should not be mixed into the frontend assets.

## Required Separation Rules

### 1. Documentation & Audit

Architectural decisions must be recorded in this document. Significant AI-assisted changes should also be traceable through an AI prompt trail.

For AI-assisted work, record at minimum:

- the requested change,
- the relevant architectural constraint,
- the resulting implementation decision,
- and any follow-up or known limitation.

### 2. Asset Isolation

Multimedia and other binary/static assets must remain separate from executable source code. Browser assets belong under the frontend/static area; backend source must not embed or generate unrelated multimedia files inline.

If the project gains images, fonts, audio, video, or other binary resources, place them in a dedicated asset directory under the frontend/static boundary rather than beside Go source files.

### 3. Configuration Decoupling

Global configuration must not be scattered throughout gameplay or server logic. Values such as movement speeds, screen/arena bounds, key bindings, server addresses, and tunable gameplay constants should be collected in explicit configuration/constants modules as the codebase is refactored.

New code must not introduce another unrelated collection of magic numbers when a shared configuration value is appropriate.

### 4. Automated Testing

Tests must be independent from browser rendering loops and presentation code. Go behavior should be covered with Go test files (`*_test.go`), while browser/gameplay logic that requires automated coverage should have testable modules separated from rendering and DOM orchestration.

Tests should validate behavior, not screenshots or incidental rendering details, unless a visual regression test is explicitly justified.

## Change Ownership Checklist

Before merging a structural change, verify:

- [ ] The change has a clear architectural owner/boundary.
- [ ] Documentation explains non-obvious architectural decisions.
- [ ] AI-assisted work has an entry in the prompt/audit trail when applicable.
- [ ] New multimedia assets are isolated from source code.
- [ ] New global/tunable constants are decoupled from core logic.
- [ ] New test coverage is separate from rendering/presentation loops.
- [ ] The change does not create a new monolithic source file.

## AI Prompt Trail

This file is also the project's lightweight audit trail for AI-assisted architectural work.

### Entry 001 — Repository setup and documentation

**Request:** Establish the architecture documentation, explain repository setup in English, document the Go toolchain requirement, and correct the main title presentation.

**Decision:** Keep the existing runtime behavior intact while documenting the required separation-of-concerns invariants. Future structural work must move toward explicit configuration and test boundaries rather than increasing the size of monolithic runtime files.

**Known limitation:** The current v33 codebase still contains large runtime files. This document defines the architectural constraints and the direction for subsequent refactoring; it does not falsely claim that the existing implementation has already been fully refactored into those boundaries.
