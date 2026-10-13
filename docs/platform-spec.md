# ClassGrove school platform

## Objective and acceptance
Extend the existing browser classroom board without losing school workspaces or
601–607. Teachers prepare and publish lessons, assignments and quizzes, record
daily attendance and assessments, and review individual progress. Verified
students submit their work; linked parents see only their own child's progress.
The intended global administrator is shafiphysika@gmail.com. An email entered
in a browser never establishes an identity or grants an administrator role.

## Architecture and commands
Preserve the static GitHub Pages frontend and the existing Supabase/PostgreSQL
backend. Keep auth sessions in memory. Configure only a public Supabase URL and
publishable key in config.js. Production OTP delivery requires configured SMTP.
No real roster is committed to public source or automatically uploaded.

Install: `npm ci --ignore-scripts`
Tests: `npm test`
Audit: `npm audit --audit-level=high`
Preview: `python -m http.server 8765 --bind 127.0.0.1`
There is no transpilation/build step.

## Structure and style
Existing index.html, schools.js, party-core.js and party.css retain board logic.
portal-core.js owns validated lesson, attendance and assessment data and progress
calculations. portal.js supplies teacher and family interfaces.
supabase/platform.sql extends the deployed base schema transactionally.
tests/ uses node:test and PGlite to test actual authorization and SQL RPCs.
Use plain JavaScript, escaped text, bounded inputs, HTTPS resource links,
descriptive errors, named actions, and the existing classroom palette.

Example: `const percentage = score === null ? null : Math.round(score / maximum * 100);`
Zero is an actual grade; missing grades are not zero.

## Trust boundaries
Teacher school access is existing approved membership or verified global admin.
Family invitation identifies a school, class, seat, email and student/parent role.
Only a verified matching email can redeem it. Family roles never get school-state
SELECT permission. A server RPC returns a projection for just the linked seat,
published class materials and that seat's grades/attendance/submissions. Quiz
answer keys remain server-side until a submission has been scored.
Student submissions are bounded and authorized server-side; parents cannot
submit as students. Teachers review only submissions in approved schools.
Bootstrap admin designation is server-side and bound to confirmed auth email.

Always validate requests, run regression tests, preserve device backups, and
explain cloud setup and save failures. Never commit credentials, distribute
student records in public source, use browser role flags as authorization, or
claim live email delivery was tested without an actual received OTP.
Human-only steps: sign in to provider accounts, accept any provider terms,
perform security-sensitive grants with action-time confirmation, configure
private SMTP credentials, and enter an OTP when needed.

## Implementation order and verification
1. Data contracts and tests: lessons, assessments, attendance, quiz parsing,
   missing/zero grades, invalid URLs and schema limits.
2. SQL migration and adversarial tests: invitation redemption, isolation,
   parent write denial, quiz answer protection, grading and revoked access.
3. Teacher pages: dashboard, lessons, attendance, progress, gradebook and quizzes.
4. Account configuration/error handling and student/parent portal.
5. Browser verification with synthetic data, regression tests, audit, deploy.
6. Configure Supabase, OTP template/SMTP and verified admin; verify live auth,
   upload a chosen school explicitly, invite a test account and test isolation.

## Completion boundary
Code completion and live service completion are separate checks. Until a real
Supabase project and SMTP provider are configured, teacher pages work in device
workspaces, but online login, family sharing and live submissions are unavailable.
