import { AVATAR_SIZE_PX, avatarPath, needsResize, withVersion } from './avatarUrl';

describe('avatarPath (저장소 안의 경로)', () => {
  it('"사용자id/avatar" 모양이다(규칙(RLS)이 허용하는 경로와 같다)', () => {
    expect(avatarPath('abc-123')).toBe('abc-123/avatar');
  });
});

describe('withVersion (예전 사진이 보이는 것을 막는 버전 붙이기)', () => {
  it('주소 뒤에 ?v=버전을 붙인다', () => {
    expect(withVersion('https://x.co/storage/avatars/u/avatar', 1700000000000)).toBe('https://x.co/storage/avatars/u/avatar?v=1700000000000');
  });

  it('이미 버전이 붙어 있으면 새 버전으로 바꾼다(?v=가 겹치지 않는다)', () => {
    expect(withVersion('https://x.co/u/avatar?v=111', 222)).toBe('https://x.co/u/avatar?v=222');
  });
});

describe('needsResize (줄여야 하는지)', () => {
  it('한도보다 크면 줄인다', () => {
    expect(needsResize(AVATAR_SIZE_PX + 1)).toBe(true);
    expect(needsResize(4000)).toBe(true);
  });

  it('한도와 같거나 작으면 그대로 둔다(작은 사진을 키우지 않는다)', () => {
    expect(needsResize(AVATAR_SIZE_PX)).toBe(false);
    expect(needsResize(200)).toBe(false);
  });
});
