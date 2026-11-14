import { nextMode, planSync, resolveMode } from './colorMode';

describe('resolveMode (화면 모드 정하기)', () => {
  it('직접 고른 값이 없으면 기기 설정을 따른다', () => {
    expect(resolveMode(null, true)).toBe('dark');
    expect(resolveMode(null, false)).toBe('light');
  });

  it('직접 고른 값이 있으면 기기 설정보다 우선한다', () => {
    expect(resolveMode('light', true)).toBe('light');
    expect(resolveMode('dark', false)).toBe('dark');
  });
});

describe('nextMode (눌렀을 때 바뀌는 값)', () => {
  it('밝은 모드와 어두운 모드를 서로 바꾼다', () => {
    expect(nextMode('light')).toBe('dark');
    expect(nextMode('dark')).toBe('light');
  });
});

describe('planSync (로그인했을 때 계정 값과 이 기기 값 맞추기)', () => {
  it('계정에 값이 있으면 그것을 적용하고, 서버에는 올리지 않는다', () => {
    expect(planSync('dark', 'light')).toEqual({ apply: 'dark', push: null });
    expect(planSync('light', null)).toEqual({ apply: 'light', push: null });
  });

  it('계정에 값이 없고 이 기기에 값이 있으면, 그 값을 계정에 올린다', () => {
    expect(planSync(null, 'dark')).toEqual({ apply: null, push: 'dark' });
  });

  it('둘 다 없으면 아무것도 하지 않는다(기기 설정을 따른다)', () => {
    expect(planSync(null, null)).toEqual({ apply: null, push: null });
  });
});
