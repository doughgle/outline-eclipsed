## Project Definition and Value Proposition

For project definition and value proposition, refer to [Project Definition and Value Proposition](../README.md#outline-eclipsed).

The primary value of this vscode extension is to enable developers to re-order symbols in documents using their outline.

## Development Environment

For dev and test workflow, refer to [Development](../README.md#development).

- At the start of a new pull request, checkout the code and run all tests. Tests should PASS *before* making code changes. If not, call human.
- Before asking review, run all tests and ensure they PASS *after* making code changes.
- Don't use `--silent` on `npm run`.
  
## Feature Documentation

- When completing a new product increment (PI), always:
  - Add the feature to the **Features** section of `README.md`.
  - Update the **Usage** section of `README.md` with any new user-facing behaviour.
  - Add a manual smoke test for the new feature to `docs/smoke-test.md`.
  - Mark the PI as ✅ complete in `docs/ROADMAP.md` (Next Product Increments list).
  - Add a PI detail section at the bottom of `docs/ROADMAP.md` describing what was delivered.

## Agent Meta Instructions
- Standardize on `AGENTS.md` in repo root as the source of instructions.
- Ensure instructions are clear and token efficient for an LLM.