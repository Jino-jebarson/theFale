# Hospital jobs, shifts and applications

The navigation calls the openings page **Jobs & Shifts** and the candidate workflow **Applications**. Openings have separate Permanent Jobs and Locum Shifts views, each with its own posting action. Completed, cancelled, rejected and expired shifts appear in History; confirmed bookings remain current.

View Applications links use `/employer/applicants?openingId=<id>&type=jobs|shifts`. The destination validates these search parameters, filters by the actual opening ID and exposes a clear-filter link. Unscoped visits default to Needs Action. Application cards group by opening, retain distinct booking IDs, display the duty schedule and collapse Candidate Insights. Match estimates are shown inside insights and do not replace credential verification.

Stage names are presentation labels: CLAIMED is New Application, CHECKED_IN/IN_PROGRESS is On Duty, and TIMESHEET_SUBMITTED is Timesheet Review. Backend transition rules remain authoritative. Candidate review, confirmation, attendance, timesheet approval, dispute and rating controls continue using existing endpoints. Occasional actions are in More actions. PINs are disclosed only through the explicit check-in panel.

The hospital application API adds `shiftId`, `shiftStartAt` and `shiftEndAt`. Restart the backend to expose these fields; no database migration is needed for this addition. Schedules use Asia/Kolkata time and include the end date for overnight duties. Missing schedules display as unavailable. Attendance accuracy describes GPS precision, not distance from the hospital.

Verification covers opening-specific links, default queues, stage filters, history isolation, grouped applications, collapsed insights, staffing counts, desktop/mobile layout and empty/error/retry states. Browser checks use isolated fixtures and make no real backend writes.
