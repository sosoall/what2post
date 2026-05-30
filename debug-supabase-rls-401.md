# [OPEN] supabase-rls-401

## Symptoms
- Browser POST to `https://zwlxarnwsotkjsqjkurm.supabase.co/rest/v1/waitlist` returns `401`.
- Frontend surfaces `new row violates row-level security policy for table "waitlist"`.

## Hypotheses
- H1: `index.html` uses an anon key that does not belong to project ref `zwlxarnwsotkjsqjkurm`.
- H2: Cloudflare Pages is still serving an older build with outdated Supabase credentials.
- H3: Supabase REST is receiving the request as a role other than `anon`.
- H4: Another database object in the write path (trigger, view, or policy on related object) is causing the insert to fail despite the visible `waitlist` policy being correct.
- H5: The current browser request differs from the expected payload or headers in a way that changes how PostgREST authorizes it.

## Evidence Plan
- Compare the hard-coded browser credentials against the project ref in the JWT payload.
- Reproduce the REST call outside the browser with the exact same endpoint and anon key.
- Inspect response body and headers from Supabase for auth or policy clues.
- If needed, verify whether Cloudflare Pages is serving the latest `index.html`.

## Evidence Collected
- JWT payload matches project ref `zwlxarnwsotkjsqjkurm` and role `anon`.
- Reproducing the POST with `Prefer: return=representation` returns `401` with `code: 42501` and hint to grant `SELECT` on `public.waitlist`.
- Reproducing the POST with `Prefer: return=minimal` returns `201` for a new email.
- Repeating the same email with `Prefer: return=minimal` returns `409` with `code: 23505`.

## Conclusion
- Root cause is not the insert policy itself.
- `return=representation` forces PostgREST to read the inserted row back, which requires `SELECT` permission and a readable RLS path.
- The intended secure setup is `INSERT`-only for `anon`, so the frontend should use `return=minimal` and avoid unconditional JSON parsing on success.
