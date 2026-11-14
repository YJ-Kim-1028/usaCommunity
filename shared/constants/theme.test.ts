import { contrastRatio } from '@/lib/contrast';

import { darkPalette, lightPalette, type ColorKey } from './theme';

// 글자색과 바탕색의 대비를 밝은 모드·어두운 모드 모두 검사한다.
// 기준: 일반 글자 4.5 이상(WCAG AA), 입력칸 안내 글자(placeholder)는 3 이상.
const AA = 4.5;
const PLACEHOLDER_MIN = 3;

const BANNERS: ColorKey[] = ['lavender', 'pink', 'sky', 'yellow', 'peach', 'periwinkle'];

const palettes = [
  ['밝은 모드', lightPalette as Record<ColorKey, string>],
  ['어두운 모드', darkPalette],
] as const;

describe.each(palettes)('%s 색 대비', (_name, p) => {
  const cases: [ColorKey, ColorKey, number][] = [
    ['text', 'background', AA],
    ['text', 'card', AA],
    ['bodyText', 'card', AA],
    ['textMuted', 'background', AA],
    ['textMuted', 'card', AA],
    ['textFaint', 'background', AA],
    ['textFaint', 'card', AA],
    ['placeholder', 'card', PLACEHOLDER_MIN],
    ['placeholder', 'background', PLACEHOLDER_MIN],
    ['accent', 'card', AA],
    ['accent', 'background', AA],
    ['accent', 'accentSurface', AA],
    ['text', 'accentSurface', AA],
    ['tagText', 'tag', AA],
    ['onInk', 'surfaceBorder', AA],
    ['danger', 'card', AA],
    ['danger', 'background', AA],
    ['text', 'hover', AA],
    ...BANNERS.flatMap((banner): [ColorKey, ColorKey, number][] => [
      ['text', banner, AA],
      ['textMuted', banner, AA],
    ]),
  ];

  it.each(cases)('%s 글자 / %s 바탕은 %d 이상', (fg, bg, min) => {
    expect(contrastRatio(p[fg], p[bg])).toBeGreaterThanOrEqual(min);
  });
});
