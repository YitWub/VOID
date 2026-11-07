/* build.mjs — src/ 를 제출용 단일 파일 HTML 로 합친다.
   실행:  node build.mjs
   산출:  index.html        아티팩트 제출용 (<html>/<head>/<body> 없음 — 퍼블리시할 때 감싸진다)
          index.local.html  로컬 확인용 (더블클릭으로 열림)
   src/ 를 고치고 반드시 이 스크립트를 돌릴 것. index.html 을 직접 고치면 다음 빌드에 덮어쓰인다. */
import { readFileSync, writeFileSync } from 'node:fs';

const read = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
const shell = read('src/index.html');
const css = read('src/styles.css');
/* 순서 고정: lib → content → app. app 이 앞의 둘에 의존한다. */
const js = ['src/lib.js', 'src/content.js', 'src/plan.js', 'src/app.js']
  .map((f) => `/* ===== ${f} ===== */\n` + read(f))
  .join('\n')
  /* 단일 파일에는 CommonJS export 가 필요 없다. 테스트(node)에서만 쓴다. */
  .replace(/^if \(typeof module !== 'undefined'\) module\.exports = \{[\s\S]*?\};$/gm, '');

const page = shell
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`)
  .replace(/<script src="(lib|content|plan|app)\.js"><\/script>\n?/g, '')
  .trimEnd() + `\n\n<script>\n${js}\n</script>\n`;

if (page.includes('src="styles.css"') || page.includes('.js"></script>')) {
  throw new Error('인라인되지 않은 참조가 남아 있습니다');
}

writeFileSync(new URL('index.html', import.meta.url), page);
writeFileSync(new URL('index.local.html', import.meta.url),
  '<!doctype html><html lang="ko"><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width,initial-scale=1">\n' + page + '</html>\n');

console.log(`빌드 완료  index.html ${page.length.toLocaleString()}자 / ${page.split('\n').length}줄`);
