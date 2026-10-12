-- Apply after permissions.sql. Password hashes remain in Supabase Auth only.
begin;
create table if not exists public.pp_teacher_accounts(
 user_id uuid primary key references auth.users(id) on delete cascade,
 username text unique not null check(username ~ '^[a-z][a-z0-9._-]{2,31}$'),
 must_change_password boolean not null default true,
 created_by uuid not null references auth.users(id),created_at timestamptz not null default now()
);
alter table public.pp_teacher_accounts enable row level security;
revoke all on public.pp_teacher_accounts from public,anon,authenticated;
grant select on public.pp_teacher_accounts to authenticated;
drop policy if exists teacher_accounts_read on public.pp_teacher_accounts;
create policy teacher_accounts_read on public.pp_teacher_accounts for select to authenticated
 using(user_id=auth.uid() or public.pp_is_admin());

create or replace function public.pp_password_ready() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and not exists(select 1 from public.pp_teacher_accounts
 where user_id=auth.uid() and must_change_password);
$$;
create or replace function public.pp_account_status() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('username',(select username from public.pp_teacher_accounts where user_id=auth.uid()),
 'must_change_password',not public.pp_password_ready());
$$;
create or replace function public.pp_password_changed() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.encrypted_password is distinct from old.encrypted_password and coalesce(new.encrypted_password,'')<>'' then
  update public.pp_teacher_accounts set must_change_password=false where user_id=new.id;
 end if;
 return new;
end;$$;
drop trigger if exists pp_password_changed on auth.users;
create trigger pp_password_changed after update of encrypted_password on auth.users
 for each row execute function public.pp_password_changed();

create or replace function public.pp_has_school(p_school uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select public.pp_password_ready() and (public.pp_is_admin() or exists(select 1 from public.pp_memberships
 where school_id=p_school and user_id=auth.uid() and status='approved'));
$$;
create or replace function public.pp_can_school(p_school uuid,p_permission text) returns boolean
language sql stable security definer set search_path='' as $$
 select public.pp_password_ready() and p_permission in ('points','activities','materials','roster','invite') and
 (public.pp_is_admin() or exists(select 1 from public.pp_memberships m where m.school_id=p_school
 and m.user_id=auth.uid() and m.status='approved' and m.permissions->p_permission='true'::jsonb));
$$;
-- Only the verified admin caller can attach a freshly created Auth account.
create or replace function public.pp_provision_teacher(p_user uuid,p_username text,p_school uuid) returns void
language plpgsql security definer set search_path='' as $$
declare account_email text;
begin
 if not public.pp_is_admin() then raise exception 'ADMIN_REQUIRED';end if;
 if p_username !~ '^[a-z][a-z0-9._-]{2,31}$' then raise exception 'INVALID_USERNAME';end if;
 if not exists(select 1 from public.pp_schools where id=p_school) then raise exception 'SCHOOL_NOT_FOUND';end if;
 select email into account_email from auth.users where id=p_user;
 if account_email is distinct from p_username||'@teachers.point-party.invalid' then raise exception 'ACCOUNT_MISMATCH';end if;
 insert into public.pp_teacher_accounts(user_id,username,created_by) values(p_user,p_username,auth.uid());
 insert into public.pp_memberships(school_id,user_id,email,status,reviewed_by,reviewed_at,permissions)
 values(p_school,p_user,account_email,'approved',auth.uid(),now(),
 '{"points":true,"activities":false,"materials":false,"roster":false,"invite":false}');
end;$$;
revoke all on function public.pp_password_ready(),public.pp_account_status(),public.pp_password_changed(),public.pp_provision_teacher(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.pp_password_ready(),public.pp_account_status(),public.pp_provision_teacher(uuid,text,uuid) to authenticated;
commit;
