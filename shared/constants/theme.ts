import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────
// 색상 기준. 화면은 아래 `Colors`만 참조하므로 여기를 바꾸면 앱 전체 분위기가 함께 바뀐다.
// 밝은 모드(light)와 어두운 모드(dark) 팔레트를 따로 두고, 글자·바탕 대비는
// `theme.test.ts`가 숫자로 검사한다(WCAG AA 기준).
// ─────────────────────────────────────────────────────────────

export const lightPalette = {
  background: '#f5f5f7', // 화면 바탕
  card: '#ffffff', // 카드 바탕
  border: '#e9e9ee', // 카드·구분선 테두리(얇게)
  divider: '#e9e9ee',
  surfaceBorder: '#17141f', // 진한 색: 주요 버튼 바탕, 선택된 항목
  onInk: '#ffffff', // 진한 바탕 위의 글자색
  text: '#17141f',
  bodyText: '#3b3a4d', // 글 본문
  textMuted: '#5a5870',
  textFaint: '#6b6983', // 시간·보조 설명 같은 작은 글자
  placeholder: '#8a889e', // 입력칸 안내 글자
  accent: '#6247f5', // 강조 글자(선명한 보라)
  accentSurface: '#ebe7ff', // 강조 바탕(연한 라벤더)
  tag: '#f0edff', // 태그 칩 바탕
  tagText: '#5a43d6',
  danger: '#c42b1c', // 오류 글자
  hover: '#ececf1', // 마우스를 올렸을 때 바탕
  track: '#dcdce4', // 진행 막대 빈 칸
  deco: '#d9d0ff', // 꾸밈용 원
  shell: '#ece8ff', // 가입·로그인 카드 바깥 바탕
  tint0: '#ffe0ea', // 아바타 바탕 3종
  tint1: '#dff0ff',
  tint2: '#fff0c9',
  // 게시판 배너 바탕과 꾸밈 원
  lavender: '#ece8ff',
  lavenderDeco: '#ddd5ff',
  pink: '#ffe3ec',
  pinkDeco: '#ffcddc',
  sky: '#dff0ff',
  skyDeco: '#c6e2fb',
  yellow: '#fff0cc',
  yellowDeco: '#ffe29e',
  peach: '#ffe6dc',
  peachDeco: '#ffd0bd',
  periwinkle: '#e9ecff',
  periwinkleDeco: '#d7dcff',
} as const;

export type ColorKey = keyof typeof lightPalette;

export const darkPalette: Record<ColorKey, string> = {
  background: '#121116',
  card: '#1c1b23',
  border: '#2d2b38',
  divider: '#2d2b38',
  surfaceBorder: '#f4f3fb', // 어두운 모드에서는 진한 색이 밝은색으로 뒤집힌다
  onInk: '#17141f',
  text: '#f3f2f9',
  bodyText: '#d7d5e6',
  textMuted: '#b9b7cc',
  textFaint: '#9a98b2',
  placeholder: '#7d7b94',
  accent: '#a99bff',
  accentSurface: '#2a2548',
  tag: '#2c2848',
  tagText: '#cdc5ff',
  danger: '#ff8f85',
  hover: '#272531',
  track: '#3a3847',
  deco: '#3a3166',
  shell: '#0d0c10',
  tint0: '#5a3347',
  tint1: '#2f4a5e',
  tint2: '#5a4d2c',
  lavender: '#2a2548',
  lavenderDeco: '#352f5e',
  pink: '#3d2330',
  pinkDeco: '#4d2c3c',
  sky: '#1f3345',
  skyDeco: '#284459',
  yellow: '#3a3320',
  yellowDeco: '#4a4128',
  peach: '#3d2a22',
  peachDeco: '#4e362b',
  periwinkle: '#262a48',
  periwinkleDeco: '#30355a',
};

// 웹에서는 CSS 변수(var(--c-이름))로 내보내서, 사용자의 기기 설정(밝게/어둡게)에 따라 색이 저절로 바뀐다.
// 앱(iOS·안드로이드)에서는 CSS 변수를 쓸 수 없어 밝은 모드 색을 그대로 쓴다.
const useCssVariables = Platform.OS === 'web';
const pick = (key: ColorKey): string => (useCssVariables ? `var(--c-${key})` : lightPalette[key]);

const base = Object.fromEntries((Object.keys(lightPalette) as ColorKey[]).map((key) => [key, pick(key)])) as Record<
  ColorKey,
  string
>;

export const Colors = {
  ...base,
  avatarTints: [base.tint0, base.tint1, base.tint2] as const,
};

/** 직접 고른 화면 모드를 저장하는 브라우저 저장소 이름 */
export const THEME_STORAGE_KEY = 'abra-theme';

/** 페이지가 그려지기 전에 저장된 모드를 적용해서, 어두운 모드 사용자가 밝은 화면이 번쩍이는 것을 막는다 */
export const themeInitScript =
  "(function(){try{var m=localStorage.getItem('" + THEME_STORAGE_KEY + "');" +
  "if(m==='light'||m==='dark')document.documentElement.setAttribute('data-theme',m);}catch(e){}})();";

/**
 * 웹 문서에 넣을 CSS.
 * - 기본: 기기 설정(밝게/어둡게)을 따른다.
 * - 마이 화면의 버튼으로 직접 고르면 <html data-theme="light|dark">가 붙어서 기기 설정보다 우선한다.
 */
export const themeCss = (() => {
  const toVars = (palette: Record<ColorKey, string>) =>
    (Object.keys(palette) as ColorKey[]).map((key) => `--c-${key}:${palette[key]};`).join('');
  const dark = toVars(darkPalette);
  return (
    `:root{color-scheme:light;${toVars(lightPalette)}}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;${dark}}}` +
    `:root[data-theme="dark"]{color-scheme:dark;${dark}}` +
    `html,body{background:var(--c-background);}`
  );
})();

export const Fonts = Platform.select({
  default: { body: 'System' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
  pill: 999,
} as const;

// 카드 그림자: 은은하게 떠 있는 느낌
export const Shadow = {
  card: '0 1px 2px rgba(23,20,31,0.04), 0 6px 20px rgba(23,20,31,0.05)',
  cardHover: '0 2px 4px rgba(23,20,31,0.06), 0 10px 28px rgba(23,20,31,0.09)',
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
