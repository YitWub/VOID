/* plan.js — 입력 조건에서 "무엇을, 언제까지" 를 계산하는 순수 로직.
   DOM 을 만지지 않는다. 그래서 test.mjs 가 브라우저 없이 그대로 돌린다.
   화면 그리기는 app.js, 문구와 법령은 content.js. */

/* 표시할 단계를 고르고 기한 묶음으로 묶는다.
   정렬 기준은 화재일로부터 센 날짜. 날짜로 셀 수 없는 묶음은 맨 뒤로 보낸다. */
function buildPhases(steps, ctx) {
  const groups = new Map();                       // phase key → {key, day, label, items}
  for (const step of steps) {
    if (step.when && !step.when(ctx)) continue;
    const def = PHASES[step.phase];
    if (!def) { console.warn('알 수 없는 phase:', step.phase, step.id); continue; }
    const day = typeof def.day === 'function' ? def.day(ctx) : Number(step.phase);
    if (!groups.has(step.phase)) groups.set(step.phase, { key: step.phase, day, label: def.label, items: [] });
    groups.get(step.phase).items.push({
      id:    step.id,
      title: resolve(step.title, ctx),
      body:  resolve(step.body,  ctx),
      where: resolve(step.where, ctx),
      due:   resolve(step.due,   ctx),
      tag:   resolve(step.tag,   ctx),
      law:   resolve(step.law,   ctx),
      kind:  step.kind,
    });
  }
  return [...groups.values()].sort((a, b) => {
    if (a.day === null) return 1;
    if (b.day === null) return -1;
    return a.day - b.day;
  });
}

const planFor = (d) => {
  const ctx = context(d);
  return { ctx, phases: buildPhases(d.role === 'worker' ? WORKER_STEPS : OWNER_STEPS, ctx) };
};
const countSteps = (phases) => phases.reduce((n, p) => n + p.items.length, 0);

if (typeof module !== 'undefined') module.exports = { buildPhases, planFor, countSteps };
