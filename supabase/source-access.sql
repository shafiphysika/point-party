-- Apply after password-accounts.sql. Shared materials require the materials grant.
begin;
create or replace function public.pp_source_access_version() returns integer
language sql stable security definer set search_path='' as $$select 1$$;
create or replace function public.pp_open_school(p_school uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare school_data jsonb;school_revision bigint;
begin
 if not public.pp_has_school(p_school) then raise exception 'SCHOOL_ACCESS_REQUIRED';end if;
 select data,revision into school_data,school_revision from public.pp_school_state where school_id=p_school;
 if not found then raise exception 'SCHOOL_NOT_FOUND';end if;
 if not public.pp_can_school(p_school,'materials') then
  school_data:=jsonb_set(school_data,'{materials}',jsonb_build_object('results',coalesce(school_data#>'{materials,results}','[]'::jsonb)));
 end if;
 return jsonb_build_object('data',school_data,'revision',school_revision);
end;$$;
-- Co-teachers use the projected RPC; direct table reads cannot bypass projection.
drop policy if exists state_read on public.pp_school_state;
create policy state_read on public.pp_school_state for select to authenticated using(public.pp_is_admin());
drop policy if exists pp_materials_read on storage.objects;
create policy pp_materials_read on storage.objects for select to authenticated
 using(bucket_id='pp-materials' and public.pp_material_school(name) is not null
 and public.pp_can_school(public.pp_material_school(name),'materials'));

-- Preserve hidden material fields when a teacher saves their projected point board.
-- Reject attempts to supply new hidden resource data rather than silently accepting it.
do $patch$
declare definition text;needle text:=' if not public.pp_is_admin() then';addition text:=$body$
 if not public.pp_is_admin() and not public.pp_can_school(p_school,'materials') then
  if public.pp_school_domain(p_data,'materials') is distinct from public.pp_school_domain('{}'::jsonb,'materials')
   and public.pp_school_domain(p_data,'materials') is distinct from public.pp_school_domain(old_data,'materials') then
   raise exception 'PERMISSION_MATERIALS_REQUIRED';
  end if;
  p_data:=jsonb_set(p_data,'{materials}',(coalesce(old_data->'materials','{}'::jsonb)-'results')||
   jsonb_build_object('results',coalesce(p_data#>'{materials,results}','[]'::jsonb)));
 end if;
$body$;
begin
 select pg_get_functiondef('public.pp_save_school(uuid,bigint,jsonb)'::regprocedure) into definition;
 if position('public.pp_school_domain(p_data,''materials'')' in definition)=0 then
  if position(needle in definition)=0 or position('old_data jsonb' in definition)=0 then raise exception 'UNSUPPORTED_SCHOOL_SAVE';end if;
  execute replace(definition,needle,addition||needle);
 end if;
end;$patch$;
revoke all on function public.pp_source_access_version(),public.pp_open_school(uuid) from public,anon,authenticated;
grant execute on function public.pp_source_access_version(),public.pp_open_school(uuid) to authenticated;
commit;
