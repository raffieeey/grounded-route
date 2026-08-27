# Grounded Route — Documentation Guide

This folder contains the design and quality-assurance record for the project.
Here is what each part is for:

## For judges and new readers (start here)

- [`../README.md`](../README.md) — what the project is, how to run it, how to test the WebMCP path
- [`TECHNICAL_DESIGN.md`](TECHNICAL_DESIGN.md) — canonical design document
- [`evidence/`](evidence) — verification evidence per feature (FDN-XXX): test proofs (RED→GREEN), geometry verification, release-rights review. Each feature's evidence file records exactly what was built and how it was verified.

## What is `process-archive/`?

[`process-archive/`](process-archive) holds the **internal multi-model review record**: during development, independent AI models (DeepSeek, GLM, Codex) reviewed each feature and their findings were tracked to resolution. These are historical QA artifacts — some findings are marked FAIL/BLOCK because that is what a review that catches real bugs looks like; every reported blocker was subsequently fixed (see the matching evidence file in `evidence/`).

They are kept for provenance and honesty about the development process, not as a statement of current state. For the current state, see the tests (`npm run test`, `npx playwright test`) and the evidence files.

## Process files

- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) — the phased implementation plan (M0 scope)
- [`PROGRESS.md`](PROGRESS.md) — running build log
- [`DEMO_VIDEO_SCRIPT.md`](DEMO_VIDEO_SCRIPT.md) — shooting script for the demo video