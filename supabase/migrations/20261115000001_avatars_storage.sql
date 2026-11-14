-- 20261115000001_avatars_storage.sql
-- 프로필 사진을 담는 파일 저장소(Storage 버킷) "avatars"와 접근 규칙.
--
-- 개념
--   - 사진 "파일"은 DB 표가 아니라 Storage(파일 저장소)에 둔다. DB(profiles.photo_url)에는 그 파일의 주소(글자)만 저장한다.
--     (글 목록을 불러올 때 사진 데이터가 딸려 오지 않고, 같은 주소는 브라우저가 한 번만 받아 재사용한다)
--   - 버킷(bucket)은 Storage 안의 폴더 같은 단위다. Storage 기능은 Supabase 프로젝트에 이미 들어 있어 따로 연결할 것은 없고, 버킷만 만들면 된다.
--
-- 설계 메모
--   1) public = true: 사진 주소를 아는 사람은 로그인 없이도 볼 수 있다. 프로필 사진은 로그인한 모든 사용자에게
--      피드에서 보여 주는 공개용 정보이고, 구현이 단순해서 선택했다(비공개로 하면 사진마다 서명된 임시 주소를 받아야 한다).
--      그래서 파일 경로에는 사용자 id만 쓰고 이름·이메일 같은 개인정보는 넣지 않는다.
--   2) 크기 2MB, 형식은 JPEG·PNG·WebP만: 버킷 설정으로 서버에서 막는다(앱 화면의 검사는 우회될 수 있다).
--   3) 파일 이름은 "내 id/avatar" 하나로 고정한다: 규칙(RLS)이 이 경로만 허용하므로 사용자당 파일이 1개로 유지되고
--      (저장 공간을 마구 쓰는 것을 막고), 사진을 바꾸면 같은 경로를 덮어쓴다.
--   4) 올리기·바꾸기·지우기는 본인 경로만 가능하다. upsert(덮어쓰기)는 insert·update·select 권한이 모두 필요해서
--      select 규칙도 "본인 경로"에 한해 열어 둔다. (보기 자체는 공개 버킷이라 주소로 누구나 가능)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatars: users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

create policy "avatars: users can replace their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar'
  )
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

create policy "avatars: users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

create policy "avatars: users can see their own avatar file"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar'
  );
