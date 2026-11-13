import { getGapja } from '@fullstackfamily/manseryeok';

// 일주 계산.
// 일주는 태어난 "날"로만 정해지는 값이라 시간은 받지 않는다.
// 결과는 "기묘"처럼 두 글자이고, 화면에서 "일주"를 붙여 보여 준다.

const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']; // 천간 10개
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']; // 지지 12개

// 라이브러리가 지원하는 연도 범위
const SUPPORTED_MIN_YEAR = 1900;
const SUPPORTED_MAX_YEAR = 2050;

function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * 라이브러리 없이 일주를 구하는 방법(율리우스 일수).
 * 일주는 60일마다 같은 값이 돌아오는 구조라서, 날짜를 "며칠째인지"로 바꾸면 60으로 나눈 나머지로 정해진다.
 * 이 계산은 두 가지 용도로 쓴다.
 *  1) 테스트에서 라이브러리 결과를 검증하는 독립적인 정답
 *  2) 라이브러리가 달력상 유효한 날짜를 거부하는 경우(1956-12-31)의 대체 계산
 */
export function dayPillarByJulianDay(year: number, month: number, day: number): string {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const julianDay =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  const index = (julianDay + 49) % 60; // 0이 갑자
  return STEMS[index % 10] + BRANCHES[index % 12];
}

/**
 * 생년월일로 일주를 계산한다.
 * 계산할 수 없는 입력(비었거나, 없는 날짜이거나, 지원 범위 1900~2050년 밖)이면 null을 돌려준다.
 */
export function calcDayPillar(year: number, month: number, day: number): string | null {
  if (!year || !month || !day) return null;
  if (year < SUPPORTED_MIN_YEAR || year > SUPPORTED_MAX_YEAR) return null;
  if (!isRealDate(year, month, day)) return null;
  try {
    return getGapja(year, month, day).dayPillar;
  } catch {
    // 달력상 유효한 날짜인데 라이브러리가 거부하는 경우(1956-12-31 하루뿐임을 전체 날짜 조사로 확인)
    return dayPillarByJulianDay(year, month, day);
  }
}
