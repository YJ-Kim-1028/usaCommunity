import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { AVATAR_BUCKET, AVATAR_QUALITY, AVATAR_SIZE_PX, avatarPath, needsResize, withVersion } from '@/lib/avatarUrl';
import { supabase } from '@/lib/supabase';

// 프로필 사진 올리기·지우기. 파일은 Storage(avatars 버킷)에 두고, DB(profiles.photo_url)에는 그 주소만 저장한다.

export type AvatarResult = { ok: true; url: string | null } | { ok: false; message: string };

const UPLOAD_FAILED = '사진을 올리지 못했어요. 잠시 후 다시 시도해주세요';
const REMOVE_FAILED = '사진을 지우지 못했어요. 잠시 후 다시 시도해주세요';

/** 사진을 512px 이하·JPEG로 줄인 뒤 올리고, 새 주소를 프로필에 저장한다 */
export async function uploadAvatar(userId: string, localUri: string): Promise<AvatarResult> {
  try {
    // 1) 줄이기: 이미 작은 사진은 키우지 않는다
    const original = await ImageManipulator.manipulate(localUri).renderAsync();
    const image = needsResize(original.width)
      ? await ImageManipulator.manipulate(original).resize({ width: AVATAR_SIZE_PX }).renderAsync()
      : original;
    const saved = await image.saveAsync({ compress: AVATAR_QUALITY, format: SaveFormat.JPEG });
    const blob = await (await fetch(saved.uri)).blob();

    // 2) 올리기(같은 경로가 있으면 덮어쓴다)
    const path = avatarPath(userId);
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
    if (error) {
      console.warn('사진 업로드 실패', error.message);
      return { ok: false, message: UPLOAD_FAILED };
    }

    // 3) 주소를 프로필에 저장(바꿀 때마다 주소가 달라지도록 버전을 붙인다)
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const url = withVersion(data.publicUrl, Date.now());
    const { error: dbError } = await supabase.from('profiles').update({ photo_url: url }).eq('id', userId);
    if (dbError) {
      console.warn('사진 주소 저장 실패', dbError.message);
      return { ok: false, message: UPLOAD_FAILED };
    }
    return { ok: true, url };
  } catch (e) {
    console.warn('사진 처리 실패', e);
    return { ok: false, message: UPLOAD_FAILED };
  }
}

/** 저장소의 파일을 지우고, 프로필의 사진 주소를 비운다 */
export async function removeAvatar(userId: string): Promise<AvatarResult> {
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath(userId)]);
  if (error) {
    console.warn('사진 삭제 실패', error.message);
    return { ok: false, message: REMOVE_FAILED };
  }
  const { error: dbError } = await supabase.from('profiles').update({ photo_url: null }).eq('id', userId);
  if (dbError) {
    console.warn('사진 주소 삭제 실패', dbError.message);
    return { ok: false, message: REMOVE_FAILED };
  }
  return { ok: true, url: null };
}
