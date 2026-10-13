-- Apply after source-access.sql and family-accounts.sql. Existing scopes remain unchanged.
begin;
alter table public.pp_memberships add column if not exists class_ids text[] default null;
create or replace function public.pp_class_access_version() returns integer
language sql stable security definer set search_path='' as $$select 1$$;
create or replace function public.pp_class_scope(p_school uuid) returns text[]
language plpgsql stable security definer set search_path='' as $$
declare ids text[];
begin
 if not public.pp_has_school(p_school) then raise exception 'SCHOOL_ACCESS_REQUIRED';end if;
 if public.pp_is_admin() then return null;end if;
 select class_ids into ids from public.pp_memberships where school_id=p_school and user_id=auth.uid() and status='approved';
 return ids;
end;$$;
create or replace function public.pp_has_class(p_school uuid,p_class text) returns boolean
language sql stable security definer set search_path='' as $$
 select public.pp_has_school(p_school) and (public.pp_is_admin() or exists(
 select 1 from public.pp_memberships m where m.school_id=p_school and m.user_id=auth.uid() and m.status='approved'
 and (m.class_ids is null or p_class=any(m.class_ids))));
$$;
create or replace function public.pp_school_classes() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.pp_is_admin() then raise exception 'ADMIN_REQUIRED';end if;
 return coalesce((select jsonb_object_agg(s.school_id,coalesce((select jsonb_agg(k order by k) from jsonb_object_keys(coalesce(s.data->'roster','{}')) k),'[]')) from public.pp_school_state s),'{}');
end;$$;
create or replace function public.pp_set_member_classes(p_member uuid,p_classes text[]) returns void
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if not public.pp_is_admin() then raise exception 'ADMIN_REQUIRED';end if;
 select school_id into sid from public.pp_memberships where id=p_member;
 if not found then raise exception 'MEMBER_NOT_FOUND';end if;
 if p_classes is not null and (cardinality(p_classes)>200 or exists(select 1 from unnest(p_classes) c where c is null or c='' or not exists(select 1 from public.pp_school_state s where s.school_id=sid and coalesce(s.data->'roster','{}') ? c))) then raise exception 'INVALID_CLASSES';end if;
 update public.pp_memberships set class_ids=case when p_classes is null then null else array(select distinct c from unnest(p_classes) c order by c) end,reviewed_by=auth.uid(),reviewed_at=now() where id=p_member;
 -- In-flight saves must reload after an access change; they cannot restore a removed class.
 update public.pp_school_state set revision=revision+1 where school_id=sid;
end;$$;

create or replace function public.pp_class_map(p_map jsonb,p_ids text[]) returns jsonb
language sql immutable set search_path='' as $$
 select coalesce(jsonb_object_agg(key,value),'{}') from jsonb_each(coalesce(p_map,'{}')) where key=any(p_ids);
$$;
create or replace function public.pp_class_list(p_list jsonb,p_ids text[],p_field text default 'classId') returns jsonb
language sql immutable set search_path='' as $$
 select coalesce(jsonb_agg(value order by ord),'[]') from jsonb_array_elements(coalesce(p_list,'[]')) with ordinality a(value,ord)
 where coalesce(value->>p_field,'')='' or value->>p_field=any(p_ids);
$$;
create or replace function public.pp_project_classes(p_data jsonb,p_ids text[]) returns jsonb
language plpgsql immutable set search_path='' as $$
declare out_data jsonb; portal jsonb; mat jsonb; days jsonb; ids text[];
begin
 if p_ids is null then return p_data;end if;
 portal:=jsonb_build_object('lessons',coalesce(p_data#>'{portal,lessons}','[]'),'assessments',coalesce(p_data#>'{portal,assessments}','[]'),'announcements',coalesce(p_data#>'{portal,announcements}','[]'),'scores',coalesce(p_data#>'{portal,scores}','{}'),'attendance',coalesce(p_data#>'{portal,attendance}','{}'));
 mat:=jsonb_build_object('plans',coalesce(p_data#>'{materials,plans}','[]'),'resources',coalesce(p_data#>'{materials,resources}','[]'),'results',coalesce(p_data#>'{materials,results}','[]'),'suggestions',coalesce(p_data#>'{materials,suggestions}','[]'));
 portal:=portal||jsonb_build_object('lessons',public.pp_class_list(portal->'lessons',p_ids),'assessments',public.pp_class_list(portal->'assessments',p_ids),'announcements',public.pp_class_list(portal->'announcements',p_ids));
 select coalesce(array_agg(x->>'id'),array[]::text[]) into ids from jsonb_array_elements(portal->'assessments') x;
 select coalesce(jsonb_object_agg(key,public.pp_class_map(value,p_ids)),'{}') into days from jsonb_each(coalesce(portal->'attendance','{}'));
 portal:=portal||jsonb_build_object('scores',public.pp_class_map(portal->'scores',ids),'attendance',days);
 mat:=mat||jsonb_build_object('plans',public.pp_class_list(mat->'plans',p_ids),'resources',public.pp_class_list(mat->'resources',p_ids),'results',public.pp_class_list(mat->'results',p_ids));
 select coalesce(array_agg(x->>'id'),array[]::text[]) into ids from jsonb_array_elements(mat->'plans') x;
 mat:=mat||jsonb_build_object('suggestions',coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(mat->'suggestions','[]')) x where x->>'planId'=any(ids)),'[]'));
 out_data:=jsonb_build_object('roster',public.pp_class_map(p_data->'roster',p_ids),'classes',public.pp_class_map(p_data->'classes',p_ids),'portal',portal,'materials',mat,'links',public.pp_class_list(p_data->'links',p_ids,'cls'),'gameImportReceipts',coalesce(p_data->'gameImportReceipts','[]'),'ui',coalesce(p_data->'ui','{}'));
 if not coalesce(out_data#>>'{ui,cur}','')=any(p_ids) then out_data:=jsonb_set(out_data,'{ui,cur}',coalesce(to_jsonb(p_ids[1]),'null'));end if;
 return out_data;
end;$$;
-- Keep hidden classes byte-for-byte, including grades, attendance and resource metadata.
create or replace function public.pp_merge_class_scope(p_old jsonb,p_new jsonb,p_ids text[]) returns jsonb
language plpgsql immutable set search_path='' as $$
declare out_data jsonb:=p_old; container text; field text; old_part jsonb;new_part jsonb; visible jsonb; ids text[]; d record;
begin
 if p_ids is null then return p_new;end if;
 if p_new is distinct from public.pp_project_classes(p_new,p_ids) then raise exception 'CLASS_ACCESS_REQUIRED';end if;
 foreach field in array array['roster','classes'] loop
  out_data:=jsonb_set(out_data,array[field],(coalesce(p_old->field,'{}')-p_ids)||coalesce(p_new->field,'{}'));
 end loop;
 foreach container in array array['portal','materials'] loop
  old_part:=coalesce(p_old->container,'{}');new_part:=coalesce(p_new->container,'{}');
  foreach field in array (case when container='portal' then array['lessons','assessments','announcements'] else array['plans','resources','results'] end) loop
   visible:=public.pp_class_list(old_part->field,p_ids);
   if exists(select 1 from jsonb_array_elements(coalesce(old_part->field,'[]')) a,jsonb_array_elements(coalesce(new_part->field,'[]')) b where not visible @> jsonb_build_array(a) and ((a->>'id' is not null and a->>'id'=b->>'id') or (field='resources' and coalesce(a->>'path','')<>'' and a->>'path'=b->>'path'))) then raise exception 'CLASS_ACCESS_REQUIRED';end if;
   if visible is distinct from coalesce(new_part->field,'[]') then
    old_part:=jsonb_set(old_part,array[field],coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(old_part->field,'[]')) x where not visible @> jsonb_build_array(x)),'[]')||coalesce(new_part->field,'[]'));
   end if;
  end loop;
  if container='portal' then
   select coalesce(array_agg(x->>'id'),array[]::text[]) into ids from jsonb_array_elements(public.pp_class_list(p_old#>'{portal,assessments}',p_ids)) x;
   old_part:=old_part||jsonb_build_object('scores',(coalesce(old_part->'scores','{}')-ids)||coalesce(new_part->'scores','{}'));
   for d in select key,value from jsonb_each(coalesce(old_part->'attendance','{}')) loop
    old_part:=jsonb_set(old_part,array['attendance',d.key],d.value-p_ids);
   end loop;
   for d in select key,value from jsonb_each(coalesce(new_part->'attendance','{}')) loop
    old_part:=jsonb_set(old_part,'{attendance}',coalesce(old_part->'attendance','{}')||jsonb_build_object(d.key,coalesce(old_part#>array['attendance',d.key],'{}')||d.value));
   end loop;
  else
   select coalesce(array_agg(x->>'id'),array[]::text[]) into ids from jsonb_array_elements(public.pp_class_list(p_old#>'{materials,plans}',p_ids)) x;
   visible:=coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(old_part->'suggestions','[]')) x where x->>'planId'=any(ids)),'[]');
   if visible is distinct from coalesce(new_part->'suggestions','[]') then
    old_part:=old_part||jsonb_build_object('suggestions',coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(old_part->'suggestions','[]')) x where not x->>'planId'=any(ids)),'[]')||coalesce(new_part->'suggestions','[]'));
   end if;
  end if;
  out_data:=jsonb_set(out_data,array[container],old_part);
 end loop;
 visible:=public.pp_class_list(p_old->'links',p_ids,'cls');
 if visible is distinct from coalesce(p_new->'links','[]') then out_data:=out_data||jsonb_build_object('links',coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(p_old->'links','[]')) x where not visible @> jsonb_build_array(x)),'[]')||coalesce(p_new->'links','[]'));end if;
 out_data:=out_data||jsonb_build_object('ui',p_new->'ui','gameImportReceipts',p_new->'gameImportReceipts');
 return out_data;
end;$$;
create or replace function public.pp_open_school(p_school uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare school_data jsonb;school_revision bigint;
begin
 if not public.pp_has_school(p_school) then raise exception 'SCHOOL_ACCESS_REQUIRED';end if;
 select data,revision into school_data,school_revision from public.pp_school_state where school_id=p_school;
 if not found then raise exception 'SCHOOL_NOT_FOUND';end if;
 school_data:=public.pp_project_classes(school_data,public.pp_class_scope(p_school));
 if not public.pp_can_school(p_school,'materials') then school_data:=jsonb_set(school_data,'{materials}',jsonb_build_object('results',coalesce(school_data#>'{materials,results}','[]')));end if;
 return jsonb_build_object('data',school_data,'revision',school_revision);
end;$$;
-- Put scope merging before the existing capability and linked-family checks.
do $$declare definition text;needle text:=' if not public.pp_is_admin() and not public.pp_can_school(p_school,''materials'') then';merge_call text:=' p_data:=public.pp_merge_class_scope(old_data,p_data,public.pp_class_scope(p_school));';restore_sources text:=$guard$
 if not public.pp_is_admin() and public.pp_class_scope(p_school) is not null and not public.pp_can_school(p_school,'materials') then
  if public.pp_school_domain(p_data,'materials') is distinct from public.pp_school_domain('{}'::jsonb,'materials')
   and public.pp_school_domain(p_data,'materials') is distinct from public.pp_school_domain(public.pp_project_classes(old_data,public.pp_class_scope(p_school)),'materials') then raise exception 'PERMISSION_MATERIALS_REQUIRED';end if;
  p_data:=jsonb_set(p_data,'{materials}',((public.pp_project_classes(old_data,public.pp_class_scope(p_school))->'materials')-'results')||jsonb_build_object('results',coalesce(p_data#>'{materials,results}','[]')));
 end if;
$guard$;begin
 select pg_get_functiondef('public.pp_save_school(uuid,bigint,jsonb)'::regprocedure) into definition;
 if position('pp_merge_class_scope' in definition)=0 then
  if position(needle in definition)=0 then raise exception 'SOURCE_ACCESS_MIGRATION_REQUIRED';end if;
  definition:=replace(definition,needle,merge_call||E'\n'||needle);
 end if;
 if position('public.pp_project_classes(old_data' in definition)=0 then definition:=replace(definition,merge_call,restore_sources||merge_call);end if;
 execute definition;
end;$$;
do $$declare definition text; fn text;guard text;begin
 foreach fn in array array['public.pp_invite_family(uuid,text,integer,text,text)','public.pp_revoke_family(uuid)','public.pp_review_work(uuid,numeric,numeric,text)'] loop
  select pg_get_functiondef(fn::regprocedure) into definition;
  guard:=case when fn like '%invite_family%' then ' if not public.pp_has_class(p_school,p_class) then raise exception ''CLASS_ACCESS_REQUIRED'';end if;'
   when fn like '%revoke_family%' then ' if not public.pp_has_class(link.school_id,link.class_id) then raise exception ''CLASS_ACCESS_REQUIRED'';end if;'
   else ' if not public.pp_has_class(submission.school_id,submission.class_id) then raise exception ''CLASS_ACCESS_REQUIRED'';end if;' end;
  if position('CLASS_ACCESS_REQUIRED' in definition)=0 then
   if fn like '%invite_family%' then definition:=replace(definition,'begin',E'begin\n'||guard);
   else definition:=replace(definition,'end if;',E'end if;\n'||guard);end if;
   execute definition;
  end if;
 end loop;
end;$$;
-- A class-limited teacher cannot invite another teacher to the entire school.
do $$declare definition text;begin
 select pg_get_functiondef('public.pp_invite(uuid,text)'::regprocedure) into definition;
 if position('CLASS_SCOPE_INVITE_REQUIRED' in definition)=0 then
  definition:=replace(definition,'begin',E'begin\n if public.pp_class_scope(p_school) is not null then raise exception ''CLASS_SCOPE_INVITE_REQUIRED'';end if;');execute definition;
 end if;
end;$$;
drop policy if exists family_invites_read on public.pp_family_invitations;
create policy family_invites_read on public.pp_family_invitations for select to authenticated using(public.pp_has_class(school_id,class_id));
drop policy if exists family_links_read on public.pp_family_links;
create policy family_links_read on public.pp_family_links for select to authenticated using(public.pp_has_class(school_id,class_id) or (public.pp_password_ready() and user_id=auth.uid() and active));
drop policy if exists submissions_read on public.pp_submissions;
create policy submissions_read on public.pp_submissions for select to authenticated using(public.pp_has_class(school_id,class_id));
-- Class-specific files cannot be downloaded using a guessed resource path.
create or replace function public.pp_can_read_material(p_name text) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare sid uuid:=public.pp_material_school(p_name);ids text[];begin
 if sid is null or not public.pp_can_school(sid,'materials') then return false;end if;
 ids:=public.pp_class_scope(sid);if ids is null then return true;end if;
 return exists(select 1 from public.pp_school_state s,jsonb_array_elements(coalesce(s.data#>'{materials,resources}','[]')) r where s.school_id=sid and r->>'path'=p_name and (coalesce(r->>'classId','')='' or r->>'classId'=any(ids)));
end;$$;
drop policy if exists pp_materials_read on storage.objects;
create policy pp_materials_read on storage.objects for select to authenticated using(bucket_id='pp-materials' and public.pp_can_read_material(name));
revoke all on function public.pp_class_map(jsonb,text[]),public.pp_class_list(jsonb,text[],text),public.pp_project_classes(jsonb,text[]),public.pp_merge_class_scope(jsonb,jsonb,text[]) from public,anon,authenticated;
revoke all on function public.pp_class_access_version(),public.pp_class_scope(uuid),public.pp_has_class(uuid,text),public.pp_school_classes(),public.pp_set_member_classes(uuid,text[]),public.pp_can_read_material(text) from public,anon,authenticated;
grant execute on function public.pp_class_access_version(),public.pp_class_scope(uuid),public.pp_has_class(uuid,text),public.pp_school_classes(),public.pp_set_member_classes(uuid,text[]),public.pp_can_read_material(text) to authenticated;
commit;
