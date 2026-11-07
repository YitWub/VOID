# 다시가동 — 프론트엔드

공장 화재 이후 복구 업무·서류·업체 견적을 사건별로 관리하는 모바일 웹 데모입니다.
Figma Make 디자인 코드를 기준으로 한 React 앱이며, 데이터는 모두 가짜(데모) 데이터입니다.

## 실행

```bash
pnpm install
pnpm dev        # 개발 서버
pnpm build      # 타입 검사 + 빌드 (dist/)
pnpm preview    # 빌드 결과 미리보기
```

## 구성

- React 19 + TypeScript + Vite
- Tailwind CSS v4, Pretendard 폰트
- `src/App.tsx` — 화면 전체와 가짜 데이터
- `src/storage.ts` — 브라우저 저장 데이터 정리 (버전을 올리면 한 번 실행)

## 데이터 저장

백엔드 연결 전이라 사건·서류·완료 기록·새 사건 임시저장은 브라우저 `localStorage`에만 저장됩니다.
실제 기관이나 업체로 전송되는 정보는 없습니다.
