import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { themeCss, themeInitScript } from '@/constants/theme';

// 웹 문서의 바깥 틀(정적 렌더링 때 한 번 만들어진다).
// - 글꼴: Pretendard(SIL Open Font License, 상업적 사용 가능)를 jsDelivr CDN에서 불러온다.
// - 색: 밝은/어두운 모드 색 변수를 여기서 정의한다(theme.ts의 themeCss).
const FONT_STACK =
  `'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', ` +
  `'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif`;

// react-native-web의 글자 클래스(한 개짜리 선택자)보다 우선하도록 #root 아래 모든 요소에 글꼴을 준다.
const fontCss = `#root, #root * { font-family: ${FONT_STACK}; }`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>아브라카다브라</title>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: themeCss + fontCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
