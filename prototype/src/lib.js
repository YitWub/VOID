/* lib.js — 화면·데이터와 무관한 유틸.
   여기에 도메인 지식(법령, 문구)을 넣지 말 것. */

const $  = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* localStorage 는 시크릿 창·사이트 데이터 차단에서 던지거나 비어 올 수 있다.
   읽기/쓰기 모두 실패해도 화면은 정상 동작해야 한다. */
const STORE_KEYS = { form: 'dg-form', done: 'dg-done', theme: 'dg-theme' };
const store = {
  get(k)   { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k,v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k)   { try { localStorage.removeItem(k); } catch (e) {} },
};

/* 날짜 ── 법정 기한은 전부 '화재 발생일 + N일'로 센다. */
const addDays = (iso, n) => {
  const x = new Date(iso);
  if (isNaN(x)) return null;
  x.setDate(x.getDate() + n);
  return x;
};
/* 짧은 형식. 헤더·대시보드처럼 연도가 필요 없는 자리에만 쓴다. */
const fmtShort = (iso, n = 0) => {
  const x = addDays(iso, n);
  return x ? `${x.getMonth() + 1}.${x.getDate()}` : '';
};
/* 긴 형식. 단계 마감일은 해를 넘기는 경우가 있어(법인 D+90 = 이듬해 2월)
   항상 연도를 찍는다. 한쪽만 연도가 붙으면 두 날짜를 비교할 때 형식이 어긋난다. */
const fmtFull = (iso, n = 0) => {
  const x = addDays(iso, n);
  return x ? `${x.getFullYear()}. ${x.getMonth() + 1}. ${x.getDate()}` : '';
};
const fmtDateTime = (iso) => {
  const x = new Date(iso);
  if (isNaN(x)) return '';
  const p = (v) => String(v).padStart(2, '0');
  return `${x.getFullYear()}년 ${x.getMonth() + 1}월 ${x.getDate()}일 ${p(x.getHours())}:${p(x.getMinutes())}`;
};
const today = () => {
  const t = new Date();
  return `${t.getFullYear()}년 ${t.getMonth() + 1}월 ${t.getDate()}일`;
};

/* innerHTML 에 들어가는 값은 전부 통과시킨다.
   지금은 사용자 입력이 innerHTML 로 가는 경로가 없지만,
   상호명을 카드에 넣는 순간 생기므로 미리 막아 둔다. */
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

/* 값이 문자열이면 그대로, 함수면 조건을 넣어 호출 */
const resolve = (v, ctx) => (typeof v === 'function' ? v(ctx) : v);

if (typeof module !== 'undefined') module.exports = { addDays, fmtShort, fmtFull, fmtDateTime, today, esc, resolve, STORE_KEYS };
