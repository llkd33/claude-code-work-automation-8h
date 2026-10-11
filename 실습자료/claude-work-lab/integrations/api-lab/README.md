# 외부 API 실습 · 내 도구에 바깥 데이터 붙이기

API는 다른 서비스에 “정해진 주문서”를 보내고 데이터를 받는 창구입니다. 날씨 앱에 “서울의 기온·습도·날씨 코드 주세요”라고 요청하고, JSON이라는 이름표 달린 데이터 묶음을 받습니다. MCP는 Claude가 도구를 부르는 연결 규칙이고, API는 서비스가 데이터를 주고받는 창구입니다. 이번에는 Claude가 API 호출 코드를 한 번 만들고, 다음 실행부터 Node가 처리합니다.

30분 흐름: 응답 보기 5분 → 코드 만들기 12분 → 직접 실행 8분 → 다른 API 1개 고르기 5분. 확장 API 구현은 선택 과제입니다.

## 1. 어느 방식으로 시작할까

- 기본 연습: `fixtures/weather-synthetic.json`의 합성 데이터. API 가입이나 호출 없이 생성·검사를 배웁니다.
- 실제 API: 강사가 Open-Meteo 이용조건 및 교육장 접속을 확인한 후 1회 실행합니다. 무료 endpoint는 비상업 용도입니다. 기업 교육·상업 대시보드 사용이 자동으로 허용된다고 해석하지 않습니다. 적용 조건이 불명확하면 합성 모드를 유지하거나 JSONPlaceholder 할 일 API를 선택합니다. [공식 이용조건](https://open-meteo.com/en/terms)

서울 URL: `https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FSeoul&forecast_days=1`

응답에서 `current.temperature_2m`, `current.relative_humidity_2m`, `current.weather_code`, `current.time`, `current_units`, `timezone`, `utc_offset_seconds`를 찾습니다. 지금 날씨 숫자는 고정 정답이 없습니다. 현재값은 기상 모델 기반입니다. [공식 날씨 문서](https://open-meteo.com/en/docs)

## 2. Claude Code에 붙여넣기

```text
업무에 붙일 서울 날씨 도구를 만들어줘. Node 22 이상, 추가 패키지 없이
integrations/api-lab/weather.cjs만 작성해. 결과는 output/weather/weather.json과
weather-dashboard.html. API URL은 아래를 사용해.
https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FSeoul&forecast_days=1
기온 °C, 습도 %, 날씨 WMO 코드, 데이터 기준시각 +09:00와 생성시각을 표시해.
--fixture 파일경로 옵션으로 합성 JSON을 명시적으로 읽을 수 있게 해.
fixture는 DEMO·synthetic·실제 날씨 아님을 화면과 JSON에 표시해.
API 실패 때 fixture로 자동 전환하지 마. 10초 타임아웃, HTTP 실패,
잘못된 JSON, 필드 누락, 예상과 다른 단위·시간대는 오류로 중단하고
기존 출력파일을 보존해. 0도·습도0·날씨코드0은 유효하게 처리해.
HTML 문자는 안전하게 이스케이프하고 데이터 출처 Open-Meteo/CC BY 4.0를 표시해.
API와 AI를 부르지 않는 fixture 검사부터 실행해. 수정 파일과 검사 결과만 짧게 알려줘.
```

## 3. 터미널에서 직접 실행

`claude-work-lab` 폴더에서 실행합니다. Claude Code가 생성한 코드의 경로를 확인합니다.

```sh
node integrations/api-lab/weather.cjs --fixture integrations/api-lab/fixtures/weather-synthetic.json
node integrations/api-lab/weather.cjs --fixture integrations/api-lab/fixtures/weather-zero-synthetic.json
node integrations/api-lab/weather.cjs --fixture integrations/api-lab/fixtures/weather-invalid-synthetic.json
```

첫 실행: DEMO, 12.5 °C, 40%, WMO 2, 기준 `2026-01-15T09:00+09:00`. 두 번째: 0 °C/0%/WMO 0도 정상입니다. 세 번째: 오류로 중단하고 두 번째의 정상 파일을 그대로 둡니다. 합성값은 실행 당일 날씨가 아닙니다. 결과 HTML을 브라우저로 열어 확인하세요.

이용조건 확인 후 실제 호출:

```sh
node integrations/api-lab/weather.cjs
```

통과 기준: API 응답 모드, 기온 숫자, 단위, 기준시각과 생성시각 구분, 출처가 보입니다. 접속 실패면 오류 메시지를 기록합니다. DEMO 성공과 API 성공은 따로 체크하세요. 반복 실행은 `node` 명령으로 합니다. 같은 도구를 실행하려고 매번 AI에게 코드를 다시 쓰게 할 필요가 없습니다.

## 4. 골라서 확장

날씨가 관심 없다면 다음 중 하나를 골라 “요청 → JSON 저장 → 작은 대시보드”로 바꿉니다. 새 API 응답에 맞게 필드 검사도 바꿉니다.

| 데이터 | 샘플 URL | 만드는 도구 |
| --- | --- | --- |
| 환율 | https://api.frankfurter.dev/v2/rate/usd/krw | 해외 지출 원화 환산기 |
| 공휴일 | https://nagerholidays.com/api/v3/publicholidays/2026/US | 해외 지사 공휴일표 · v3 변경 일정 확인 |
| 가상 할 일 | https://jsonplaceholder.typicode.com/todos?userId=1 | 할 일 완료율 대시보드 |
| 가상 상품 | https://dummyjson.com/products?limit=5&select=id,title,price,stock | 상품 재고 카드 |
| 도서 | https://openlibrary.org/search.json?q=project+management&limit=5&fields=key,title,author_name | 업무 도서 목록 |
| NASA | https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY | 오늘의 우주 콘텐츠 카드 · media_type 확인 |

키/무료조건/호출제한은 배포된 `무료API_실습목록.md`를 먼저 확인합니다. API마다 다릅니다. 브라우저에서 직접 API를 부르면 CORS 또는 키 노출 문제가 생길 수 있어 이 수업은 Node가 받아서 HTML에 넣는 방식입니다. HTML 자체는 API를 부르지 않습니다.
