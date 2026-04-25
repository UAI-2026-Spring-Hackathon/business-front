# Backend Deployment & API Guide

이 문서는 Upstage AI Hackathon - Business Track 백엔드 서버의 배포, 설정 및 API 사용법을 설명합니다.

---

## 1. 환경 설정 (Environment Setup)

백엔드 실행을 위해 다음 두 가지 파일이 `backend/` 폴더 내에 필요합니다.

### A. `.env` 파일
서버 구동에 필요한 환경 변수를 설정합니다.
```env
GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### B. `serviceAccountKey.json`
Firebase Firestore 접근을 위한 인증 키입니다. Firebase 콘솔에서 다운로드하여 이름을 변경 후 배치하세요.

---

## 2. 사전 설정 파라미터 (Pre-setup Parameters)

행사 시작 전, Firestore에 다음 데이터가 준비되어 있어야 합니다. `init_mock_data.py`를 참고하여 설정할 수 있습니다.

### A. 팀 정보 (Teams)
- **필드**: `id`, `name`, `society` (KU/YU), `pitch`, `total_invested_coins` (0), `weighted_valuation` (0)
- **예시**:
  - `team_01`: Project Antonio (KU)
  - `team_02`: Nexus Dynamics (YU)

### B. 사용자/참가자 정보 (Users)
로그인을 위해 각 참가자에게 **PIN 번호**를 사전에 발급해야 합니다.
- **필드**: `id`, `name`, `pin` (6자리 문자열), `society` (KU/YU), `team_id` (본인 팀 ID), `balance` (초기 지급 코인 수)
- **PIN 발급 가이드**:
  - 겹치지 않는 6자리 영문/숫자 조합 권장 (예: `ABC123`, `XYZ789`)
  - **주의**: 본인 팀(`team_id`)에는 투자가 불가능하도록 로직이 구현되어 있습니다.

### C. 심사위원 정보 (Judges)
- **필드**: `id`, `name`
- **예시**: `judge_01`, `judge_02` ...

---

## 3. API 엔드포인트 요약

| 분류 | 메서드 | 엔드포인트 | 설명 |
| :--- | :--- | :--- | :--- |
| **공통** | `GET` | `/health` | 서버 상태 확인 |
| **투자** | `POST` | `/invest/login` | PIN 번호 로그인 |
| | `POST` | `/invest` | 팀 투자 (타 학회 투자 시 1.2배 가중치) |
| **심사** | `POST` | `/judge/score` | 심사 점수 제출 (AI Moat, BM, 완성도) |
| | `GET` | `/judge/scores/{team_id}` | 팀별 심사 결과 조회 |
| **정산** | `POST` | `/settlement/run` | 최종 밸류에이션 및 래플 계산 실행 |
| | `GET` | `/settlement/raffle/csv` | 래플 당첨용 티켓 CSV 다운로드 |
| **관리** | `POST` | `/admin/reset` | 전체 데이터 초기화 (주의) |
| | `POST` | `/admin/toggle-investment` | 투자 가능 상태 변경 |

---

## 4. 실행 방법 (Docker)

서버에서 다음 명령어를 실행하여 배포합니다.

```bash
# 이미지 빌드 및 백그라운드 실행
docker compose up -d --build

# 로그 확인
docker compose logs -f
```
