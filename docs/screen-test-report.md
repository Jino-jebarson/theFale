# Frontend screen audit

Date: 12 November 2026.

## Results

| Check | Result |
| --- | --- |
| Production build | Passed; existing large-chunk warnings remain |
| Automated tests | 54 passed across 12 files, including shared-read and polling tests |
| Desktop browser cases | 150 passed; no detected crashes, runtime exceptions, or horizontal overflow |
| Failed-load recovery | 40 cases recovered after using the visible Retry controls |
| Mobile browser cases | 50 passed; no detected crashes, runtime exceptions, or horizontal overflow |
| TypeScript | 317 existing diagnostics; no new diagnostics compared with the prior baseline |

## Scope

All 35 route screens are included in 50 role-and-route cases. Desktop Chrome runs each case with successful, empty/not-found, and failed API responses (150 checks). Mobile Chrome runs the same cases at 390 × 844 (50 checks). Desktop width is 1366 pixels. The browser checks rendered content, runtime exceptions, horizontal overflow, and recovery using the Retry controls shown for failed loads.

| Area | Screens and variants |
| --- | --- |
| Public | `/`, `/landing`, `/login` redirect, `/verify` OTP, `/verify?id=…` credential lookup, `/privacy`, `/terms`, `/admin/login` |
| Candidate and student, each | `/home`, `/jobs`, `/jobs/:id`, `/applications`, `/shifts`, `/earnings`, `/profile`, `/learning`, `/learning/:id`, `/huddle`, `/notifications`, `/support` |
| Hospital | `/employer`, `/employer/post`, `/employer/post-shift`, `/employer/postings`, `/employer/applicants`, `/employer/candidates`, `/employer/wallet`, `/employer/profile` |
| Admin | `/admin`, `/admin/candidates`, `/admin/facilities`, `/admin/postings`, `/admin/applications`, `/admin/huddle`, `/admin/support` |
| Onboarding | Candidate, student, and hospital entry screens |

Static screens and initial forms do not make data requests in every scenario. Their empty/failure cases verify rendering only. Optional AI availability is independent of core page data. Some screens have separate profile and page requests; the recovery test clicks each visible Retry control.

## Implemented fixes

- Failed dashboard and list requests now display an error with Retry, rather than presenting the failure as an empty result. Previously loaded data is retained when a refresh fails.
- Shared profile loading and landing-page jobs expose failures. Profile errors have a separate label.
- Additional hospital and admin write handlers prevent duplicate submissions while awaiting the API.
- Candidate, student, and hospital onboarding await the server before announcing success, marking onboarding complete, or navigating. Failed saves retain the form.
- Student onboarding accepts the actual city field, restores real proof uploads and university registration input, requires explicit consent, and removes preselected academic answers and sample document names.
- Restored sessions retain the verified contact for onboarding. Missing hospital metadata stays blank.
- A missing job displays the not-found screen. Service failures remain errors.
- Copy actions confirm clipboard success before showing success feedback and handle browser refusal.

## Reproduce

Run from the frontend root with dependencies already installed:

```powershell
npm.cmd run build
npx.cmd vitest run --maxWorkers=1 --no-file-parallelism --testTimeout=30000
node scripts/screen-audit.mjs
node scripts/screen-audit.mjs --mobile
```

The browser script requires a recent Node version with native WebSocket and installed Chrome. Set `FALE_QA_BROWSER` to another Chromium executable if necessary. Reports are written to `.qa/screen-audit.json` and `.qa/screen-audit-mobile.json`. Temporary browser profiles and reports are ignored by Git. API fixtures exist only inside this QA script; they are not application fallback data. All API traffic is intercepted, external requests are blocked, and no real backend writes occur.

## Limits

This is route rendering and load/recovery coverage plus focused automated action tests, including failed onboarding saves and duplicate submission protection. It does not exhaust every button, form permutation, permission combination, or accessibility requirement. Mobile checks use Chromium emulation, not physical devices.

The live backend was not running. Database integration, SMS, payments, document verification, and live AI/provider behavior were not validated by this browser audit. A production build passes, but the repository still has 317 pre-existing TypeScript diagnostics; comparison against the prior diagnostic baseline found no new diagnostics during this audit.
