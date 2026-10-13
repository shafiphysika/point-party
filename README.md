# ClassGrove

ClassGrove now opens on an account-first education login page. Guests do not see device rosters. See [Account-first school access](docs/reliable-login.md) for the current password-account deployment and safe recovery of browser-local classes into shared online schools. The older email-only setup below remains relevant to legacy family accounts and owner recovery.


A colorful classroom point board with growing pets, 14 learning skills, teams,
mystery boxes, goals, game imports, and a separate workspace for each school.

The teaching workspace includes draft/published lectures, HTTPS resources,
assignments, server-graded quizzes, dated attendance, assessment scores and
feedback, individual progress and CSV exports, and class announcements. Backups
include learning records. Classroom reward points remain separate from grades.
Connected students submit work; linked parents view only their own child's
materials, attendance, grades, feedback, and point history.

## Device workspaces

The site works immediately without an account. Existing `pointparty-v1` classes
stay in **My first school**. Use **Schools** to rename it or add another school.
Each school has its own classes, points, links, teams, and records. Device
workspaces are organizational sections; they do not provide account security.
Backups contain the currently open school's classroom data. Keep a backup for
each school before clearing browser data or moving devices.

## Connect online teacher and admin accounts

Online login is disabled until a Supabase project is configured. No browser PIN,
role selector, or hidden button grants admin privileges.

1. Use a Supabase project where you have database administrator access. Run
   `supabase/schema.sql`, `supabase/platform.sql`, `supabase/materials.sql`,
   then `supabase/permissions.sql`, in that order, in its SQL editor.
2. Enable email authentication and email sign-ups. The site accepts the default
   verified email sign-in link. With custom SMTP, you can also set the **Magic Link**
   email template to show `{{ .Token }}` for optional numeric-code sign-in.
   Set the site URL to `https://shafiphysika.github.io/point-party/`. Configure
   production email delivery and the Auth email rate limits in Supabase. Add
   `https://shafiphysika.github.io/point-party/` to allowed Auth redirect URLs.
3. Put the project URL and **publishable key** in `config.js`. Do not place a
   service-role key, password, or personal access token in this repository.
4. The platform migration designates `shafiphysika@gmail.com` as the intended
   owner. Sign in and verify that email. The server claims the admin role only
   after checking the confirmed email in `auth.users`; typing the email into
   the interface alone grants nothing. For another installation, review and
   change the owner address in the migration before applying it.

5. Refresh approvals in **Teacher & admin**. The global admin can create schools.
   Open a school and add classes, or deliberately load that school's backup.
   Device workspaces are kept separately and are never automatically uploaded.
6. Create a co-teacher invitation for the school and their email. Share the site
   and sign-in instructions yourself; the invitation action records an invitation
   and does not send an email. Invitations expire in seven days. The invited
   teacher signs in and receives **pending** membership. The global admin approves
   or rejects the request. In **Teacher permission panel**, grant the teacher
   the extra tools they need for that school. Newly approved teachers can award
   points; activities and grades, shared-material editing/uploads, roster and
   attendance editing, and invitations each require an explicit admin grant.
   Teachers cannot approve access or change their own permissions.

Admin roles and school access are checked in PostgreSQL. Revocation blocks future
reads and writes. Only the global admin can access all schools. Sessions are kept
in the current browser tab's session storage, so reloads retain verified login
and reopen the remembered approved school. Closing the tab ends that tab's
session. Signing out returns to the device workspace.

School saves use a revision check. If another teacher saved first, the stale
save is rejected instead of overwriting their work. Download your unsaved backup,
reload the saved school, and reconcile your changes. This first version supports
shared school access but does not automatically merge simultaneous edits.

## Student and parent access

An approved teacher with invitation permission opens **Student & parent portal**, selects a class/seat,
and records a parent or student email invitation. Share the site and sign-in
instructions with that person. These access records do not send invitation
emails. Email codes are delivered by your configured Supabase email service.
The verified recipient receives a private link after signing in. Parent access
is read-only; student access allows assignment and quiz submissions. Quiz
answers are stripped from family responses and graded on the server. Teachers
review written work in **Gradebook**. Revoke linked access before reassigning a
linked seat/name, so a family cannot silently inherit another child's records.

Do not commit real rosters or backups to this public repository. The old public
roster file was removed from the current tree; older Git history may retain it.

## Deployment status and email verification

`config.js` contains only the public project URL and publishable key. Their
presence alone does not prove email delivery or database setup. This repository
cannot deliver emails by itself. Production setup requires project access, all four database migrations,
a public client key, the allowed site/redirect URL, and production SMTP.
Do not publish a service-role key or SMTP credentials in client files.

Missing student/family migrations do not block teacher sign-in. The account
page identifies unavailable features. Missing permissions migration disables
co-teacher editing until setup is complete. Reapply `permissions.sql` after
any later rerun of platform or materials migrations so their older write rules
cannot replace the final permission checks.

Before onboarding families, verify an actual owner OTP, approved teacher OTP,
student submission and parent view in separate accounts, revocation, school
isolation, and email delivery to addresses outside the project team. Database
tests are not evidence of real email delivery.

## Verification

```sh
npm ci --ignore-scripts
npm test
npm audit --audit-level=high
python -m http.server 8765 --bind 127.0.0.1
```

Tests use PGlite's PostgreSQL engine to exercise the actual SQL migration with
authenticated and anonymous roles, invitations, pending access, admin approval,
school isolation, direct-write denial, revocation, and conflicting revisions.
PGlite is a development dependency and is not loaded by the website. Production
email delivery and login must also be verified against your connected Supabase
project before using online classrooms.

Official references: [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security),
[email sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithotp),
[OTP verification](https://supabase.com/docs/reference/javascript/auth-verifyotp).
