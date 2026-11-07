/* test.mjs — 브라우저 없이 도는 회귀 테스트.
   실행:  node test.mjs
   content.js / plan.js 만 불러오므로 DOM 이 필요 없다.
   문구나 법령을 고친 뒤 반드시 돌릴 것. */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);

/* 브라우저에서는 전역으로 묶이므로 테스트에서도 같은 방식으로 올린다 */
const lib = require('./src/lib.js');
Object.assign(globalThis, lib);
const content = require('./src/content.js');
Object.assign(globalThis, content);
const { planFor, countSteps } = require('./src/plan.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; }
  else { fail++; console.log(`  ✗ ${name}${extra ? '  → ' + extra : ''}`); }
};
const base = { name:'사동정밀', addr:'사동', date:'2026-11-05T21:05', ind:'금속·기계 가공',
               emp:'12', hurt:'1', ins:'y', loss:'m', memo:'메모', role:'owner', biz:'corp', tenure:'rent' };
const make = (o) => ({ ...base, ...o });
const flat = (d) => planFor(d).phases.flatMap((p) => p.items);
const byId = (d, id) => flat(d).find((i) => i.id === id);

console.log('── 1. 분기 전수 (사업주 24조합) ──');
const counts = [];
for (const hurt of ['0','1']) for (const ins of ['y','n','u'])
for (const biz of ['corp','indiv']) for (const tenure of ['own','rent']) {
  const n = countSteps(planFor(make({ hurt, ins, biz, tenure })).phases);
  counts.push(n);
}
const min = Math.min(...counts), max = Math.max(...counts);
ok('사업주 단계 수는 12~18', min === 12 && max === 18, `실측 ${min}~${max}`);
ok('근로자 단계 수는 7', countSteps(planFor(make({ role:'worker' })).phases) === 7);

console.log('── 2. 세액공제 기한 (개인 1개월 / 법인 3개월) ──');
for (const [biz, day, iso] of [['corp', 90, '2027. 2. 3'], ['indiv', 30, '2026. 12. 5']]) {
  const ph = planFor(make({ biz })).phases.find((p) => p.key === 'tax');
  ok(`${biz} 세액공제 D+${day}`, ph && ph.day === day, ph && 'D+' + ph.day);
  ok(`${biz} 마감일 ${iso}`, ph && fmtFull(base.date, ph.day) === iso, ph && fmtFull(base.date, ph.day));
}
ok('세액공제에 필수 배지가 붙지 않는다 (법정 의무 아님)', byId(make({}), 'o15').tag == null);
ok('세액공제는 권리·신청으로 분류', content.OWNER_STEPS.find((s) => s.id === 'o15').kind === 'right');

console.log('── 3. 화재증명원 (정부24 = 개인 AND 자가) ──');
for (const [biz, tenure, online] of [['corp','own',false],['indiv','own',true],['corp','rent',false],['indiv','rent',false]]) {
  const w = byId(make({ biz, tenure }), 'o6').where;
  ok(`${biz}·${tenure} → ${online ? '정부24 가능' : '방문'}`, w.includes('정부24') === online, w);
}

console.log('── 4. 임차 분기 ──');
ok('임차면 임대인 배상 항목 출현', !!byId(make({ tenure:'rent' }), 'o16'));
ok('자가면 미출현', !byId(make({ tenure:'own' }), 'o16'));
ok('판례 사건번호 유지', byId(make({ tenure:'rent' }), 'o16').body.includes('2012다86895'));
ok('책임을 단정하지 않고 증명책임만 말한다', /증명/.test(byId(make({ tenure:'rent' }), 'o16').body));
ok('임차면 해체 신고 당사자가 건물주', byId(make({ tenure:'rent' }), 'o17').where.includes('건물주'));

console.log('── 5. 보험 3상태가 모두 다르다 ──');
const keys = (ins) => flat(make({ ins })).map((i) => i.id).join(',');
ok('가입 ≠ 미가입', keys('y') !== keys('n'));
ok('모름 ≠ 미가입', keys('u') !== keys('n'));
ok('모름이면 상법 657조 통지가 살아 있다', byId(make({ ins:'u' }), 'o4u').body.includes('제657조'));
ok('모름을 미가입으로 단정하지 않는다', !byId(make({ ins:'u' }), 'o12').body.includes('미가입.'));

console.log('── 6. 기한 표시 ──');
const nonePhase = planFor(make({})).phases.at(-1);
ok('국세 납부기한은 맨 뒤, 날짜 없음', nonePhase.key === 'none' && nonePhase.day === null);
ok('국세 납부기한 기준이 화재일이 아님을 명시', byId(make({}), 'o11').due.includes('납부기한 만료'));
ok('묶음이 날짜 오름차순', (() => {
  const ds = planFor(make({})).phases.map((p) => p.day).filter((d) => d !== null);
  return ds.every((v, i) => i === 0 || ds[i - 1] <= v);
})());

console.log('── 7. 법령 문구 ──');
ok('손해방지의무(상법 680조)가 보험 가입·모름일 때 뜬다',
   !!byId(make({ ins:'y' }), 'o2b') && !!byId(make({ ins:'u' }), 'o2b'));
ok('미가입이면 손해방지의무 미출현 (보험계약상 의무라서)', !byId(make({ ins:'n' }), 'o2b'));
ok('손해방지의무가 현장보존과 부딪힐 때 소방서 확인을 안내',
   byId(make({}), 'o2b').body.includes('소방서에 먼저 확인'));
ok('중대재해에 직업성 질병자 포함', byId(make({}), 'o5').body.includes('직업성 질병자'));
ok('전기점검은 의무가 아니라 권장', byId(make({}), 'o14').body.includes('법적 의무가 아니라 권장'));
ok('재해 정책자금에 "시 인정" 명시',
   content.SUPPORT(content.context(make({}))).some((s) => s.p.includes('사회재난으로 인정')));
ok('감식 전 철거만 위법으로 표기', byId(make({}), 'o2').body.includes('벌금')
   && byId(make({}), 'o2').body.includes('불리할 수 있어요'));

console.log('── 8. 데이터 정합성 ──');
const all = [...content.OWNER_STEPS, ...content.WORKER_STEPS];
ok('id 중복 없음', new Set(all.map((s) => s.id)).size === all.length);
ok('모든 단계에 kind 가 있다', all.every((s) => s.kind in content.KIND));
ok('모든 phase 가 정의돼 있다', all.every((s) => s.phase in content.PHASES));
ok('법정 의무·권리 단계에는 근거 조문이 있다',
   all.filter((s) => s.kind === 'duty' || s.kind === 'contract').every((s) => s.law));
ok('화면 배지는 must/warn 만 쓴다',
   all.every((s) => s.tag == null || typeof s.tag === 'function' || ['must','warn'].includes(s.tag)));

console.log('── 9. 빌드 산출물 ──');
const built = readFileSync(new URL('index.html', import.meta.url), 'utf8');
ok('빌드본에 외부 js 참조가 없다', !/<script src=/.test(built));
ok('빌드본에 외부 css 참조가 없다', !/href="styles\.css"/.test(built));
ok('빌드본에 폰트 CDN 링크는 남아 있다', built.includes('fonts.googleapis.com'));
ok('로컬본에 doctype 이 있다',
   readFileSync(new URL('index.local.html', import.meta.url), 'utf8').startsWith('<!doctype html>'));

console.log('── 10. 스타일 토큰 ──');
const css = readFileSync(new URL('src/styles.css', import.meta.url), 'utf8');
const darkBlocks = css.match(/:root(?::not\(\[data-theme="light"\]\)|\[data-theme="dark"\])\{[^}]*\}/g) || [];
ok('다크 블록이 둘이다 (기기 설정 · 수동 고정)', darkBlocks.length === 2, String(darkBlocks.length));
const originTokens = [...css.matchAll(/--d-([\w-]+)\s*:\s*#/g)].map((m) => m[1]);
ok('다크 색값은 --d-* 에만 적혀 있다', originTokens.length === 11, String(originTokens.length));
ok('두 다크 블록이 같은 토큰을 같은 방식으로 참조한다',
   darkBlocks.every((b) => originTokens.every((t) => b.includes(`var(--d-${t})`))));
ok('다크 블록에 하드코딩된 색이 없다', darkBlocks.every((b) => !/#[0-9a-f]{3,6}/i.test(b)));
ok('.phase 첫 컬럼은 104px (날짜 줄바꿈 방지)', /\.phase\{[^}]*grid-template-columns:104px/.test(css));
ok('owner-only 가 CSS 로 구현돼 있다 (죽은 클래스 아님)', /data-role="worker"\]\s*\.owner-only\{display:none\}/.test(css));
const markup = readFileSync(new URL('src/index.html', import.meta.url), 'utf8');
ok('마크업에 인라인 style 이 없다', !/ style="/.test(markup), (markup.match(/ style="[^"]*"/g) || []).join(' '));
ok('owner-only 가 마크업에서 쓰인다', markup.includes('class="full owner-only"'));
ok('라디오 id 는 name 접두사 규칙을 따른다',
   ['role-owner','role-worker','biz-corp','biz-indiv','ten-own','ten-rent'].every((i) => markup.includes(`id="${i}"`)));

console.log(`\n${fail === 0 ? '✅' : '❌'}  통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
