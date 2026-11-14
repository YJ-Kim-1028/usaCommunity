import { SEARCH_MIN_LENGTH, appendUnique, normalizeSearchQuery } from './posts';

describe('appendUnique (더 보기로 불러온 글 이어 붙이기)', () => {
  it('새로 불러온 글을 뒤에 붙인다', () => {
    expect(appendUnique([{ id: 'a' }, { id: 'b' }], [{ id: 'c' }])).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  });

  it('이미 있는 글은 다시 넣지 않는다', () => {
    expect(appendUnique([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }])).toEqual([
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ]);
  });

  it('기존 순서는 그대로 두고, 이미 있는 글의 내용은 바꾸지 않는다', () => {
    const result = appendUnique([{ id: 'a', n: 1 }], [{ id: 'a', n: 2 }]);
    expect(result).toEqual([{ id: 'a', n: 1 }]);
  });

  it('빈 목록에 붙일 수 있고, 붙일 게 없으면 그대로다', () => {
    expect(appendUnique([], [{ id: 'a' }])).toEqual([{ id: 'a' }]);
    expect(appendUnique([{ id: 'a' }], [])).toEqual([{ id: 'a' }]);
  });

  it('원래 배열을 바꾸지 않는다', () => {
    const current = [{ id: 'a' }];
    appendUnique(current, [{ id: 'b' }]);
    expect(current).toEqual([{ id: 'a' }]);
  });
});

describe('normalizeSearchQuery (검색어 정리)', () => {
  it('앞뒤 공백을 지운다', () => {
    expect(normalizeSearchQuery('  새벽  ')).toBe('새벽');
  });

  it('안쪽의 연속 공백·줄바꿈은 공백 하나로 줄인다', () => {
    expect(normalizeSearchQuery('새벽   눈이\n떠져요')).toBe('새벽 눈이 떠져요');
  });

  it('공백만 있으면 빈 글자가 된다', () => {
    expect(normalizeSearchQuery('     ')).toBe('');
  });

  it('특수문자는 그대로 둔다(이스케이프는 DB 함수가 한다)', () => {
    expect(normalizeSearchQuery("100%_a'b")).toBe("100%_a'b");
  });

  it('검색은 2글자부터 한다', () => {
    expect(SEARCH_MIN_LENGTH).toBe(2);
  });
});
