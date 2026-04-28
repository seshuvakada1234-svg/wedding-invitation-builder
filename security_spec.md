# Security Specification for Wedding Website Builder

## Data Invariants
1. A wedding invitation cannot exist without a user ID.
2. The `slug` must be unique (enforced via document ID).
3. `isPaid` can only be set to `true` via a trusted source (or strictly controlled update if mock payment is local, but rules should ideally block client-side promotion).
4. `views` can only be incremented, not decremented.
5. `viewLimit` is immutable for standard users.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Attempt to create an invite with another user's `userId`.
2. **Slug Hijacking**: Attempt to overwrite an existing invite by using their slug.
3. **Price Manipulation**: Attempt to set `isPaid: true` without payment.
4. **View Spying**: Attempt to read all invites without being the owner or admin.
5. **PII Leak**: Attempt to read `email` or private profile info of other users (if implemented).
6. **Large Payload**: Attempt to inject 1MB of text into the `groomName`.
7. **Invalid Template**: Attempt to use `template: 'gothic'`.
8. **Negative Views**: Attempt to set `views: -100`.
9. **Limit Bypass**: Attempt to set `viewLimit: 999999`.
10. **ID Poisoning**: Attempt to use a 2KB string as a slug.
11. **Unauthorized Delete**: Attempt to delete another person's invite.
12. **Future Dating**: Attempt to set `createdAt` to 2027.

## Test Runner Plan
Use `firestore.rules` with `isValidInvite` helper.
