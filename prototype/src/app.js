/* app.js — 입력을 읽고, content.js 의 데이터를 화면에 그리고, 이벤트를 붙인다.
   ⚠️ 이 파일에 법령 문구나 조문 번호를 적지 말 것. 전부 content.js 로 간다. */

/* ── 입력 ─────────────────────────────────────────────────── */
const FIELDS = ['name', 'addr', 'date', 'ind', 'emp', 'hurt', 'ins', 'loss', 'memo'];
/* 라디오는 name 과 id 접두사가 같다는 규칙을 지킨다: name="biz" → id="biz-corp" */
const RADIOS = { role: 'role', biz: 'biz', tenure: 'ten' };

function readForm() {
  const d = {};
  FIELDS.forEach((f) => { d[f] = $('#' + f).value; });
  for (const name of Object.keys(RADIOS)) {
    d[name] = document.querySelector(`input[name=${name}]:checked`).value;
  }
  return d;
}
function restoreForm(saved) {
  if (!saved) return;
  FIELDS.forEach((f) => { if (saved[f] != null) $('#' + f).value = saved[f]; });
  for (const [name, prefix] of Object.entries(RADIOS)) {
    const el = saved[name] && $(`#${prefix}-${saved[name]}`);
    if (el) el.checked = true;
  }
}

let done = store.get(STORE_KEYS.done) || {};

/* ── 렌더 ─────────────────────────────────────────────────── */
const TAGS = { must: '<span class="tag t-must">필수</span>', warn: '<span class="tag t-warn">주의</span>' };

function stepHtml(it) {
  const badge = TAGS[it.tag] || '';
  return `<label class="step ${done[it.id] ? 'done' : ''}" for="c-${it.id}">`
    + `<input type="checkbox" id="c-${it.id}" data-k="${it.id}" ${done[it.id] ? 'checked' : ''}>`
    + `<span><strong>${esc(it.title)}${badge}</strong><p>${esc(it.body)}</p>`
    + (it.where ? `<div class="where">발급·신청: ${esc(it.where)}</div>` : '')
    + (it.due   ? `<div class="where due-hard">기한: ${esc(it.due)}</div>` : '')
    + `</span></label>`;
}
function phaseHtml(ph, iso) {
  const head = ph.day === null ? '기한<br>별도' : 'D+' + ph.day;
  const when = ph.day === null ? '' : ' · ' + fmtFull(iso, ph.day);
  return `<div class="phase"><div class="dday">${head}<small>${esc(ph.label)}${when}</small></div>`
    + `<div class="steps">${ph.items.map(stepHtml).join('')}</div></div>`;
}

function renderSteps(d, phases) {
  $('#stepsRole').textContent  = d.role === 'owner' ? '사업주용' : '다친 근로자용';
  $('#stepsTitle').textContent = (d.name || '우리 사업장') + ' 처리 순서';
  $('#phases').innerHTML = phases.map((ph) => phaseHtml(ph, d.date)).join('');

  const boxes = $$('#phases input');
  const n = boxes.filter((x) => x.checked).length;
  $('#barFill').style.width = (boxes.length ? Math.round(n / boxes.length * 100) : 0) + '%';
  $('#pct').textContent = `${n} / ${boxes.length} 완료`;
}

function renderDocs(d, ctx) {
  $('#docRows').innerHTML = DOC_ROWS(ctx)
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  $('#draft').textContent = [
    '피해 경위서 (초안)', '',
    `1. 사업장: ${d.name} / ${d.addr}`,
    `2. 업종 및 규모: ${d.ind}, 상시 근로자 ${d.emp}명`,
    `3. 발생 일시: ${fmtDateTime(d.date)}`,
    `4. 경위: 위 일시에 사업장에서 화재가 발생하여 ${LOSS_TEXT[d.loss]}되었음.`,
    `5. 피해 내용: ${d.memo}`,
    `6. 인명 피해: ${ctx.hurt ? `부상자 ${d.hurt}명 (치료 중)` : '없음'}`,
    `7. 보험 가입: ${INS_TEXT[d.ins]}`,
    '8. 첨부: 화재증명원, 피해 사진, 피해 목록표', '',
    `작성일: ${today()}`,
    `작성자: ${d.name} 대표`,
  ].join('\n');
}

function renderCare() {
  $('#hosp').innerHTML = HOSPITALS.map(([name, addr, pill]) =>
    `<div class="item"><div><strong>${esc(name)}</strong><p>${esc(addr)}</p></div>`
    + `<span class="pill p-ok">${esc(pill)}</span></div>`).join('');
}

function renderSupport(d, ctx) {
  $('#supLead').textContent = `${d.name} · 근로자 ${d.emp}명 · 보험 ${INS_SHORT[d.ins]} 기준으로 걸렀어요.`;
  $('#sup').innerHTML = SUPPORT(ctx).map((s) =>
    `<div class="item"><div><strong>${esc(s.t)}</strong><p>${esc(s.p)}</p></div>`
    + `<span class="pill p-${s.pill}">${esc(s.label)}</span></div>`).join('');
}

function renderAdmin() {
  $('#adminRows').innerHTML = ADMIN_ROWS.map(([name, loc, date, stage, note]) =>
    `<tr><td>${esc(name)}</td><td>${esc(loc)}</td><td class="mono">${esc(date)}</td>`
    + `<td><div class="stage">${[1,2,3,4,5,6].map((i) => `<i class="${i <= stage ? 'on' : ''}"></i>`).join('')}</div></td>`
    + `<td>${esc(note)}</td></tr>`).join('');
}

function renderAll() {
  const d = readForm();
  const { ctx, phases } = planFor(d);
  /* 근로자 화면에서 의미 없는 입력(사업자 유형·건물)을 CSS 로 감추기 위한 표식 */
  document.documentElement.dataset.role = d.role;
  $('#caseLabel').textContent = `${d.name || ''} · ${fmtShort(d.date)} 화재`;
  renderSteps(d, phases);
  renderDocs(d, ctx);
  renderCare();
  renderSupport(d, ctx);
  renderAdmin();
}

/* ── 화면 전환 ─────────────────────────────────────────────── */
const VIEWS = ['start', 'steps', 'docs', 'care', 'support', 'admin'];
function show() {
  let v = location.hash.slice(1);
  if (!VIEWS.includes(v)) v = 'start';
  VIEWS.forEach((x) => { $('#v-' + x).hidden = x !== v; });
  $$('#nav a').forEach((a) =>
    a.getAttribute('href') === '#' + v ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  renderAll();
  scrollTo(0, 0);
}

function toast(m) {
  const t = $('#toast');
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.h);
  toast.h = setTimeout(() => { t.hidden = true; }, 1800);
}

/* ── 이벤트 ───────────────────────────────────────────────── */
function save() { store.set(STORE_KEYS.form, readForm()); }

$('#f').addEventListener('submit', (e) => { e.preventDefault(); save(); location.hash = 'steps'; });
$('#f').addEventListener('input',  save);
$('#f').addEventListener('change', () => { save(); renderAll(); });

$('#phases').addEventListener('change', (e) => {
  const k = e.target.dataset.k;
  if (!k) return;
  done[k] = e.target.checked;
  store.set(STORE_KEYS.done, done);
  renderAll();
});

$('#copy').addEventListener('click', () => {
  const text = $('#draft').textContent;
  navigator.clipboard.writeText(text).then(() => toast('복사했어요')).catch(() => {
    const r = document.createRange();
    r.selectNodeContents($('#draft'));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    toast('텍스트를 선택했어요. 복사해 주세요');
  });
});

/* 발표용. 발표 노트북이 다크여도 리허설과 같은 화면이 나오게 고정할 수 있다. */
const THEMES = ['light', 'dark', ''];
$('#theme').addEventListener('click', () => {
  const cur  = document.documentElement.dataset.theme || '';
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  if (next) document.documentElement.dataset.theme = next;
  else delete document.documentElement.dataset.theme;
  store.set(STORE_KEYS.theme, next);
  toast(next === 'light' ? '밝은 화면' : next === 'dark' ? '어두운 화면' : '기기 설정 따름');
});

/* 리허설 체크 상태가 본 발표에 남지 않게 한다. */
$('#reset').addEventListener('click', () => {
  store.del(STORE_KEYS.form);
  store.del(STORE_KEYS.done);
  done = {};
  location.hash = '';
  location.reload();
});

addEventListener('hashchange', show);

/* ── 시작 ─────────────────────────────────────────────────── */
restoreForm(store.get(STORE_KEYS.form));
const savedTheme = store.get(STORE_KEYS.theme);
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
show();
