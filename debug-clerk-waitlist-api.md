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

## Evidence
- Pre-fix runtime logs from the deployed page showed that both before and after `Clerk.load()`, the instance had:
  - `hasWaitlist: false`
  - `waitlistJoinType: "undefined"`
  - `joinWaitlistType: "undefined"`
- The submit attempt log showed the same shape immediately before the failing call.
- The thrown error was `TypeError: clerk.joinWaitlist is not a function`.
- Static inspection of the currently loaded `clerk.browser.js` bundle found no `joinWaitlist`, `mountWaitlist`, or `__internal_ClerkUICtor` strings.
- Later logging attempts failed because the temporary HTTPS tunnel expired and started returning `503 no tunnel here :(`.

## Analysis
- H1 confirmed: the currently loaded browser bundle / object shape does not expose the waitlist APIs we attempted to call.
- H3 and H4 are effectively confirmed together: the current loading approach is not the official JavaScript quickstart path for Clerk UI components.
- H5 is rejected: there is no hidden initialization failure masking the method; the methods are simply absent on the loaded instance.
- H2 remains possible as a secondary prerequisite, but it does not explain the missing API surface by itself.

## Next Fix
- Replace the current ad-hoc `window.Clerk + clerk.browser.js` initialization with Clerk's official JavaScript quickstart initialization path.
- Prefer the prebuilt Clerk `<Waitlist />` UI or hosted waitlist flow for this static landing page, since the user requested the simplest setup and Clerk-managed emails.
