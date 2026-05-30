# [OPEN] clerk-waitlist-api

## Symptoms
- On the deployed Cloudflare Pages site, submitting the waitlist form throws `TypeError: clerk.joinWaitlist is not a function`.
- A previous attempt using `clerk.waitlist.join()` also failed with `Cannot read properties of undefined (reading 'join')`.

## Hypotheses
- H1: The loaded browser Clerk instance exposes neither `waitlist.join()` nor `joinWaitlist()`, and the actual API surface differs from the package docs.
- H2: Waitlist mode is disabled in the Clerk Dashboard, so no waitlist capability is attached to the runtime instance.
- H3: The script loading pattern returns an incompletely initialized Clerk object, so waitlist methods are absent at submit time.
- H4: The deployed page is loading a different Clerk bundle/version than expected, causing API mismatch.
- H5: An earlier initialization error is occurring and being masked, leaving a partial object that lacks waitlist methods.

## Plan
- Add minimal runtime instrumentation only.
- Reproduce on the deployed site and inspect which Clerk methods actually exist.
- Compare evidence against hypotheses before changing business logic.
