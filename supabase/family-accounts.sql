-- Apply after password-accounts.sql and platform.sql. Reuses the private login registry.
begin;
create or replace function public.pp_provision_family(p_user uuid,p_username text,p_school uuid,p_class text,p_seat integer,p_kind text) returns void
language plpgsql security definer set search_path='' as $$
declare account_email text; child_name text;
begin
 if not public.pp_is_admin() then raise exception 'ADMIN_REQUIRED';end if;
 if p_username is null or p_username !~ '^[a-z][a-z0-9._-]{2,31}$' or p_kind is null or p_kind not in ('parent','student') or p_seat is null or p_seat not between 1 and 60 then raise exception 'INVALID_ACCOUNT_DETAILS';end if;
 select data#>>array['roster',p_class,'names',(p_seat-1)::text] into child_name from public.pp_school_state where school_id=p_school;
 if coalesce(child_name,'')='' then raise exception 'STUDENT_REQUIRED';end if;
 select email into account_email from auth.users where id=p_user;
 if account_email is distinct from p_username||'@teachers.point-party.invalid' then raise exception 'ACCOUNT_MISMATCH';end if;
 insert into public.pp_teacher_accounts(user_id,username,created_by) values(p_user,p_username,auth.uid());
 insert into public.pp_family_links(school_id,class_id,seat,user_id,email,kind) values(p_school,p_class,p_seat,p_user,account_email,p_kind);
end;$$;
revoke all on function public.pp_provision_family(uuid,text,uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.pp_provision_family(uuid,text,uuid,text,integer,text) to authenticated;
-- Enforce first-password change for family RPCs too, even if called directly.
do $$
declare fn text; definition text;
begin
 foreach fn in array array['public.pp_family_feed(uuid)','public.pp_submit_work(uuid,text,text,jsonb)'] loop
  select pg_get_functiondef(fn::regprocedure) into definition;
  if position('PASSWORD_CHANGE_REQUIRED' in definition)=0 then
   definition:=replace(definition,' select * into link',E' if not public.pp_password_ready() then raise exception ''PASSWORD_CHANGE_REQUIRED'';end if;\n select * into link');
   execute definition;
  end if;
 end loop;
end;$$;
drop policy if exists family_links_read on public.pp_family_links;
create policy family_links_read on public.pp_family_links for select to authenticated using(public.pp_has_school(school_id) or (public.pp_password_ready() and user_id=auth.uid() and active));
commit;
