# Class permissions and learning rewards

Apply `supabase/class-access.sql` after `source-access.sql` and `family-accounts.sql`.
It is transactional and safe to reapply. It does not approve, revoke or alter any
existing teacher assignment. Existing memberships retain all-class access until
an administrator chooses a subset in My account.

`class_ids = NULL` means all current and future classes; an empty array means no
classes. Explicit IDs apply within one school, alongside approval and the existing
points, activities, materials, roster and invitation permissions. Administrator
access remains unrestricted. Each scope change increments the school revision;
teachers reload the school after an administrator changes their assignment.

The database projects rosters, points, grades, attendance, lessons, suggestions and
materials to the permitted classes. Scoped saves merge those classes with the
original hidden records, then run the existing tool-permission and linked-family
checks. Family/submission table policies and private file downloads enforce the
same class boundary. Restricted teachers cannot invite another teacher to the
whole school. ID and private-path collisions cannot relabel hidden material or
assessment data into an allowed class.

The reward trail derives milestones from existing points. Skill buttons select a
real teacher-awarded skill; they do not issue points automatically. Pet milestones
remain unchanged, with additional virtual gem, trophy and star badges at 60, 100
and 150 points. Suggested class treats fill the existing reward field for teacher
review and saving. No redemption, spending, purchases or automatic gifts are implied.

Six original child illustrations cover science, reading, maths, art, teamwork and
celebration. Each page has its own motivational motif and motion timing. Motion
respects the operating system's reduced-motion setting; school data never changes
because of decoration or a celebration.

Validation: PGlite tests exercise 405/407-only access, hidden 406 records, empty and
all-class scopes, forged IDs and private paths, self-grant denial, family/submission
isolation, material preservation, and point saves. UI tests cover the class picker,
skill navigation and earned milestone collections.
