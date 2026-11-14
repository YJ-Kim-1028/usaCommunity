// DB가 돌려주는 오류를 사용자에게 보여 줄 한국어 문장으로 바꾼다.
// 알려진 경우는 하나씩 직접 적어 두고(글자가 "들어 있는지"가 아니라 정확히 일치하는 것만 인정한다),
// 모르는 경우는 호출한 쪽이 넘겨 준 기본 문구를 그대로 쓴다.

export type DbError = { code?: string | null; message?: string | null } | null | undefined;

export const RATE_LIMITED_INTERVAL = '너무 빠르게 올리고 있어요. 잠시 후 다시 시도해주세요';
export const RATE_LIMITED_DAILY = '오늘 올릴 수 있는 만큼 모두 올렸어요. 내일 다시 시도해주세요';

/** 도배 방지 트리거(enforce_rate_limit)가 던지는 메시지. 이 글자와 정확히 같을 때만 인정한다 */
const BY_MESSAGE: Record<string, string> = {
  'rate_limited:interval': RATE_LIMITED_INTERVAL,
  'rate_limited:daily': RATE_LIMITED_DAILY,
};

/** 길이 제한 위반(check_violation): 오류 메시지에 어긴 제약 이름이 들어 있다 */
export const CHECK_VIOLATION = '23514';
const BY_CONSTRAINT: Record<string, string> = {
  posts_title_length: '제목은 1~60자로 입력해주세요',
  posts_body_length: '내용은 1~5000자로 입력해주세요',
  comments_body_length: '댓글은 1~500자로 입력해주세요',
  reports_reason_length: '신고 사유는 1~200자로 입력해주세요',
  profiles_nickname_length: '닉네임은 2~12자로 입력해주세요',
};

export function friendlyDbError(error: DbError, fallback: string): string {
  if (!error) return fallback;
  const message = (error.message ?? '').trim();

  if (message in BY_MESSAGE) return BY_MESSAGE[message];

  if (error.code === CHECK_VIOLATION) {
    for (const [constraint, text] of Object.entries(BY_CONSTRAINT)) {
      if (message.includes(`"${constraint}"`)) return text;
    }
  }
  return fallback;
}
