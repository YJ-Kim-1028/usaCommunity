import { CHECK_VIOLATION, RATE_LIMITED_DAILY, RATE_LIMITED_INTERVAL, friendlyDbError } from './dbError';

const FALLBACK = '문제가 생겼어요';

describe('friendlyDbError (DB 오류를 안내 문장으로)', () => {
  describe('도배 방지', () => {
    it('간격이 짧아 막힌 경우', () => {
      expect(friendlyDbError({ code: 'P0001', message: 'rate_limited:interval' }, FALLBACK)).toBe(RATE_LIMITED_INTERVAL);
    });

    it('하루 한도를 넘은 경우', () => {
      expect(friendlyDbError({ code: 'P0001', message: 'rate_limited:daily' }, FALLBACK)).toBe(RATE_LIMITED_DAILY);
    });

    it('앞뒤 공백이 있어도 알아본다', () => {
      expect(friendlyDbError({ message: '  rate_limited:daily ' }, FALLBACK)).toBe(RATE_LIMITED_DAILY);
    });

    it('정확히 일치하지 않으면 인정하지 않는다(알 수 없는 변형, 글자만 비슷한 다른 오류)', () => {
      expect(friendlyDbError({ message: 'rate_limited' }, FALLBACK)).toBe(FALLBACK);
      expect(friendlyDbError({ message: 'rate_limited:weekly' }, FALLBACK)).toBe(FALLBACK);
      expect(friendlyDbError({ message: 'daily report job failed' }, FALLBACK)).toBe(FALLBACK);
    });
  });

  describe('길이 제한 위반(23514)', () => {
    const violation = (constraint: string) => ({
      code: CHECK_VIOLATION,
      message: `new row for relation "x" violates check constraint "${constraint}"`,
    });

    it.each([
      ['posts_title_length', '제목은 1~60자로 입력해주세요'],
      ['posts_body_length', '내용은 1~5000자로 입력해주세요'],
      ['comments_body_length', '댓글은 1~500자로 입력해주세요'],
      ['reports_reason_length', '신고 사유는 1~200자로 입력해주세요'],
      ['profiles_nickname_length', '닉네임은 2~12자로 입력해주세요'],
    ])('%s → 구체적인 안내', (constraint, text) => {
      expect(friendlyDbError(violation(constraint), FALLBACK)).toBe(text);
    });

    it('모르는 제약 이름이면 기본 문구', () => {
      expect(friendlyDbError(violation('some_other_check'), FALLBACK)).toBe(FALLBACK);
    });

    it('코드가 23514가 아니면 제약 이름이 들어 있어도 인정하지 않는다', () => {
      expect(friendlyDbError({ code: '42501', message: 'violates check constraint "posts_title_length"' }, FALLBACK)).toBe(FALLBACK);
    });
  });

  it('그 밖의 오류와 빈 값은 기본 문구', () => {
    expect(friendlyDbError({ code: '42501', message: 'permission denied for table posts' }, FALLBACK)).toBe(FALLBACK);
    expect(friendlyDbError({}, FALLBACK)).toBe(FALLBACK);
    expect(friendlyDbError(null, FALLBACK)).toBe(FALLBACK);
    expect(friendlyDbError(undefined, FALLBACK)).toBe(FALLBACK);
  });
});
