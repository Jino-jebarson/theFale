# Shared API reads

The shared layout and page components can request the same resources. `apiFetch` now combines matching in-flight GET requests and briefly reuses successful responses across page mounts. React Strict Mode stays enabled.

| Resource | Reuse window |
| --- | --- |
| Candidate and hospital profile | 60 seconds |
| Notifications | 15 seconds |
| Other GET responses | 10 seconds |
| Authentication and public credential verification | No completed-response reuse |

The cache is memory only, bounded to 200 entries, and cleared when the session token changes or logout occurs. Accepting the same token twice does not clear it. Request keys distinguish query parameters, headers, authentication options, and retry/timeout policies. Callers receive independent copies so editing or sorting one screen's data cannot change another screen's cached response.

Non-authentication writes invalidate reads before and after completion, including failures where the server may already have accepted the write. An older in-flight read cannot populate the cache after invalidation. Writes are never combined or automatically replayed by this cache. Failed reads and failed validation are not cached. Manual page Retry clears cached reads before reloading.

Polling remains enabled. Focus and visibility events share a five-second throttle, and hidden tabs do not poll. Existing page intervals remain unchanged.

For a caller that must bypass completed-response reuse, pass `cacheMs: 0`; this still shares an identical in-flight read. Use `cache: "no-store"` for a completely independent fresh request. Reads with an explicit abort signal also remain independent.

External changes from another user or system can remain unseen until the short reuse window expires and the screen requests data again. This change reduces repeated network traffic; it does not add real-time subscriptions or change the route layout hierarchy.

## Validation

New tests cover concurrent reads, expiry, independent response copies, invalidation after writes, session isolation, reads completing after invalidation, failed responses, verification freshness, and focus/poll cleanup. The full frontend suite passed 54 tests. The production build passes, and TypeScript retains the same 317 existing diagnostics with no new diagnostics.

The browser audit uses intercepted responses rather than a live backend. Its request reports now exclude CORS preflight `OPTIONS` calls and include request methods, so network duplicates can be distinguished from browser permission checks.

After adding shared reads, the 150 desktop screen cases passed again, including 40 successful Retry recoveries.

A focused browser check on the final build confirmed that candidate and student Home each make one profile GET shared by the layout and page. Each successful Home load made seven application GET requests in total, with no duplicate endpoints. The six focused success/empty/failure cases passed, including both Retry recoveries.
