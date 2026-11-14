// 프로필 사진의 이름·크기 같은 순수한 규칙(서버·화면 코드 없이 테스트할 수 있게 따로 둔다)

/** 사진을 담는 Storage 버킷 이름(마이그레이션 20261115000001에서 만든다) */
export const AVATAR_BUCKET = 'avatars';
/** 올리기 전에 이 크기(가로, px)보다 크면 줄인다. 화면에서 가장 크게 쓰는 곳이 약 76px이라 고해상도 화면까지 넉넉한 값 */
export const AVATAR_SIZE_PX = 512;
/** 줄인 JPEG의 품질(0~1). 이 정도면 눈으로 구분하기 어렵다 */
export const AVATAR_QUALITY = 0.85;

/** 저장소 안의 파일 경로. 사용자당 파일은 하나뿐이고, 규칙(RLS)도 이 경로만 허용한다 */
export function avatarPath(userId: string): string {
  return `${userId}/avatar`;
}

/**
 * 사진을 바꿀 때마다 주소가 달라지도록 뒤에 버전을 붙인다.
 * 같은 경로를 덮어쓰면 주소가 그대로라 브라우저가 예전 사진을 계속 보여 줄 수 있기 때문이다.
 */
export function withVersion(url: string, version: number | string): string {
  return `${url.split('?')[0]}?v=${version}`;
}

/** 가로세로 중 큰 쪽이 한도보다 크면 true (작은 사진을 억지로 키우지 않으려고 확인한다) */
export function needsResize(width: number, limit: number = AVATAR_SIZE_PX): boolean {
  return width > limit;
}
