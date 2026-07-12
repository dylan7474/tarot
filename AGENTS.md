# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project overview

Cosmic Tarot is a static, single-page web application. The primary app code lives in `index.html`, which contains the HTML, Tailwind-driven styling, and vanilla JavaScript used for tarot readings, deck exploration, provider configuration, and AI-generated interpretations.

## Development workflow

- Keep the app runnable by opening `index.html` directly in a browser unless a future change adds a build system.
- Prefer small, focused changes because the project currently has a compact file structure.
- Do not add package managers, bundlers, or frameworks unless the task explicitly requires them.
- If you add tooling, document the new commands in `README.md`.

## Code style

- Use readable vanilla JavaScript and descriptive function names.
- Keep UI copy consistent with the existing mystical/cosmic theme.
- Preserve accessibility basics: semantic labels, useful `alt` text, keyboard-friendly controls, and readable contrast.
- Never wrap imports in `try`/`catch` blocks.

## Testing and verification

- For documentation-only changes, run `git diff --check` before committing.
- For app behavior changes, open the page locally and verify the affected controls manually.
- If a static server is helpful, run `python3 -m http.server 8000` from the repository root and visit `http://localhost:8000`.

## Pull request notes

When summarizing changes, include:

- What user-facing behavior or documentation changed.
- How the change was verified.
- Any known limitations or follow-up work.
