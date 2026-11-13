import { calcDayPillar, dayPillarByJulianDay } from './ilju';

describe('calcDayPillar (일주 계산)', () => {
  it('1990-03-15는 기묘일주다', () => {
    expect(calcDayPillar(1990, 3, 15)).toBe('기묘');
  });

  it('하루가 지나면 60갑자의 다음 순서(경진)가 된다', () => {
    expect(calcDayPillar(1990, 3, 16)).toBe('경진');
  });

  it('60일 뒤에는 같은 일주가 돌아온다', () => {
    expect(calcDayPillar(1990, 5, 14)).toBe(calcDayPillar(1990, 3, 15));
  });

  it('윤일(2024-02-29)도 계산된다', () => {
    expect(calcDayPillar(2024, 2, 29)).toBe('계해');
  });

  it('지원 범위 전체(1900~2050년)에서 라이브러리 없이 구한 값과 모두 같다', () => {
    let checked = 0;
    for (let time = Date.UTC(1900, 0, 1); time <= Date.UTC(2050, 11, 31); time += 24 * 60 * 60 * 1000) {
      const date = new Date(time);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      expect(calcDayPillar(year, month, day)).toBe(dayPillarByJulianDay(year, month, day));
      checked += 1;
    }
    expect(checked).toBe(55152);
  });

  it('라이브러리가 거부하는 유효한 날짜(1956-12-31)도 계산된다', () => {
    // 앞날(신미)과 다음날(계유) 사이이므로 60갑자 순서상 임신이어야 한다
    expect(calcDayPillar(1956, 12, 30)).toBe('신미');
    expect(calcDayPillar(1956, 12, 31)).toBe('임신');
    expect(calcDayPillar(1957, 1, 1)).toBe('계유');
  });

  it('없는 날짜는 null이다', () => {
    expect(calcDayPillar(2023, 2, 30)).toBeNull();
    expect(calcDayPillar(2023, 2, 29)).toBeNull(); // 평년
    expect(calcDayPillar(2023, 13, 1)).toBeNull();
  });

  it('지원 범위(1900~2050년) 밖이면 null이다', () => {
    expect(calcDayPillar(1899, 12, 31)).toBeNull();
    expect(calcDayPillar(2051, 1, 1)).toBeNull();
  });

  it('비어 있거나 0이면 null이다', () => {
    expect(calcDayPillar(0, 3, 15)).toBeNull();
    expect(calcDayPillar(1990, 0, 15)).toBeNull();
    expect(calcDayPillar(1990, 3, 0)).toBeNull();
    expect(calcDayPillar(Number(''), 3, 15)).toBeNull();
  });
});
