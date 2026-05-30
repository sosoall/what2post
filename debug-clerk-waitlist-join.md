# [OPEN] clerk-waitlist-join

## Symptoms
- Submitting the waitlist form throws `TypeError: Cannot read properties of undefined (reading 'join')`.
- The error points to the line calling `clerk.waitlist.join({ emailAddress: email })`.

## Hypotheses
- H1: The browser `Clerk` object loaded from `clerk.browser.js` does not expose `waitlist` on the instance, and the correct method is a different API such as `joinWaitlist()`.
- H2: `clerk.load()` completes, but waitlist functionality is unavailable because Waitlist mode is not enabled in the Clerk Dashboard.
- H3: The loaded Clerk bundle version differs from the docs example and exposes a different JavaScript surface than the package-based SDK.
- H4: The script loads a global `window.Clerk` object shape that differs from the instance returned by our initialization path.
- H5: The publishable key points to the right instance, but the app configuration is missing email/waitlist capabilities, so the waitlist resource is absent.

## Plan
- Inspect the runtime `Clerk` object shape from the browser SDK docs and local reproduction.
- Instrument the page to capture which waitlist-related methods exist at runtime.
- Reproduce the submit flow and confirm the exact available API surface before applying a minimal fix.
