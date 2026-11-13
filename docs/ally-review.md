# Ally improvements

Updated 13 November 2026.

Ally now distinguishes supplied facts, missing evidence and suggestions. Missing credentials, experience, bed counts, scores and queue totals stay unknown instead of becoming default values. Zero values remain zero.

## Review boundaries

Backend prompts treat document text and metadata as untrusted data. Credential and posting reviews cannot assert registry verification or legal clearance. Review responses are constrained to require human review, and fabricated confidence/suitability percentages are suppressed. Malformed or empty structured reviews trigger provider failover or an error rather than a positive result. Short numeric registration identifiers are no longer automatically described as invalid.

Admin screens label AI results as reviews or suggestions, with a source-check note. Unknown or ambiguous moderation/screening responses cannot become approvals based on reassuring prose. AI assessment caches are now memory-only, scoped to the session token and expire after ten minutes; old sessionStorage assessments are ignored. Relevant record changes are included in assessment cache keys.

## Practical assistance

- Pay suggestions use comparable published FALE shifts for the requested role and city. Returned ranges must fit the observed rates. Published asking rates are not accepted pay, legal minimums, or a market-wide benchmark. If comparable records are missing, the user can enter a rate manually. Analysis runs on request rather than on every edit.
- Staffing outlooks distinguish loaded postings from active shifts. Invented surge formulas, fixed queue counts, default regions and unsupported fill-time promises were removed. Historical data is required for a numeric forecast.
- Candidate summaries retain unknown experience rather than assuming three years. Job explanations retain unknown qualifications and match scores.
- Chat actions offer a button for confirmation. Availability changes occur only after the user clicks and the server confirms. Duplicate clicks are guarded. Chat history is cleared locally only after the server accepts the reset.
- Streaming requires a valid completion event. Partial answers, malformed streams, timeouts and provider failures remain errors. Provider/rate-limit failures are not automatically replayed. Standard chat is used only when streaming is unsupported or authentication needs recovery.

## Spinner

Ally uses the existing `ButtonSpinner` from `components/ui/button.tsx`, including chat thinking, review badges and other Ally loading indicators. No new animation style was introduced.

## Verification

- Frontend suite: 67 tests passed, including explicit action confirmation, rejected saves, shared-spinner rendering, evidence boundaries, account cache isolation and streaming failures.
- Backend unit/regression tests: 29 passed, including 10 Ally service tests.
- Browser checks: 150 desktop cases and 50 mobile cases passed against intercepted responses, including successful review fixtures and service failures.
- TypeScript comparison during this work: 315 existing diagnostics, with no new diagnostics against the previous baseline of 317.

Tests use controlled responses; they do not establish live model accuracy, medical correctness, regulatory verification, forecasting calibration, latency or provider cost. Those require representative real-provider evaluation and authoritative source integrations. No deployment was performed.
