// WCAG 2.x 색 대비 계산. 글자색과 바탕색의 밝기 차이가 충분한지 숫자로 확인할 때 쓴다.
// 기준: 일반 글자 4.5 이상(AA), 큰 글자·아이콘 3 이상.

/** '#rrggbb' → 상대 휘도(0~1) */
export function relativeLuminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** 두 색의 대비(1~21). 클수록 또렷하다 */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
