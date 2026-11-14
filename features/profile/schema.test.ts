import { profileEditSchema } from './schema';

describe('profileEditSchema (내 정보 수정 입력 검사)', () => {
  it('정상 값은 통과한다', () => {
    expect(profileEditSchema.safeParse({ nickname: '달빛여우', mbti: 'ENFP' }).success).toBe(true);
  });

  it('닉네임은 앞뒤 공백을 지운 뒤 길이를 센다', () => {
    const result = profileEditSchema.safeParse({ nickname: '  달빛  ', mbti: 'INTJ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.nickname).toBe('달빛');
  });

  it('공백만 있는 닉네임은 거절한다', () => {
    expect(profileEditSchema.safeParse({ nickname: '     ', mbti: 'INTJ' }).success).toBe(false);
  });

  it('닉네임이 1자이거나 13자이면 거절한다', () => {
    expect(profileEditSchema.safeParse({ nickname: '가', mbti: 'INTJ' }).success).toBe(false);
    expect(profileEditSchema.safeParse({ nickname: '가'.repeat(13), mbti: 'INTJ' }).success).toBe(false);
  });

  it('닉네임 경계값(2자, 12자)은 통과한다', () => {
    expect(profileEditSchema.safeParse({ nickname: '가나', mbti: 'INTJ' }).success).toBe(true);
    expect(profileEditSchema.safeParse({ nickname: '가'.repeat(12), mbti: 'INTJ' }).success).toBe(true);
  });

  it('목록에 없는 MBTI는 거절한다', () => {
    expect(profileEditSchema.safeParse({ nickname: '달빛여우', mbti: 'ABCD' }).success).toBe(false);
    expect(profileEditSchema.safeParse({ nickname: '달빛여우', mbti: 'enfp' }).success).toBe(false);
  });
});
