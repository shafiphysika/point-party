# Account-first school access

Opening Point Party shows the education login page. Device rosters are retained for administrator recovery and are not rendered for guests. An authenticated account opens only its approved online schools. The owner uses their existing email identity; co-teachers can use administrator-provided usernames.

## Backend deployment

1. Apply `supabase/password-accounts.sql` after the existing four migrations.
2. Deploy `supabase/teacher-accounts.ts` as the `teacher-accounts` Supabase Edge Function. For projects using ECC signing keys, turn OFF the legacy-only gateway JWT toggle and use this function's mandatory custom Auth verification. The function verifies the caller with Auth and checks the database admin role before using the server-only service-role secret. Do not remove either check. The legacy-only gateway option rejects valid ECC user sessions.
3. The owner signs in with the existing verified email identity and sets their own password through My account. If necessary, use the existing owner email recovery. Password entry and changes must be completed by the account holder.
4. In My account, create co-teacher accounts using a username, temporary password and school. Share the credentials privately. No invitation email is needed. Teachers must choose their own password on first login.
5. Use the existing teacher permission panel to grant points, activity/grade editing, material editing/uploads, roster/attendance editing and invitation rights per school. Revocation blocks school reads and writes. These editing rights do not constitute field-level read restrictions inside an approved school.

The username maps to an internal Auth email at `teachers.point-party.invalid`; that address is an identifier and is never used for email delivery. Passwords are hashed and stored by Supabase Auth, never by the school JSON or teacher-account table. The first-password flag can only be cleared by a server trigger observing a real Auth password-hash change; client metadata cannot bypass it. Existing verified email accounts are unaffected by the new temporary-password rule.

## Roster recovery

Browser-local rosters and shared online school state were previously separate. Publishing a page does not transfer those rosters. Before clearing browser data, keep backups of every device school.

The administrator can use **Recover classes saved in this browser** in My account to add missing classes to an existing online school. Review the school destination and class list. The merge preserves every existing online class, points and learning record; it does not replace a class with a device copy. The database revision check rejects concurrent conflicting changes. Use the original Restore saved school control to transfer a whole device school into an empty online school, including its lessons and resources.

## Hosting

The existing GitHub Pages address is already a free HTTPS website address. A new domain is optional and does not fix authentication, email delivery or missing school data. Cloudflare Pages also provides free `pages.dev` addresses, but changing hosts would change the browser-storage origin and require exporting local rosters first. Retain the current address while repairing the account and data flow.

## Validation and limits

Automated tests cover guest rendering, first-password database enforcement, minimal teacher permissions, self-escalation denial, revocation, account provisioning authorization, rollback after failed membership setup, and preservation of online data during missing-class recovery. Real owner login, co-teacher provisioning, password change and cross-device online roster verification must also be completed against the deployed backend. Local tests do not prove those production steps occurred.
