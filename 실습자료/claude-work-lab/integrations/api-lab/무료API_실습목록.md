# 무료·무료 시작 API 실습 목록

공식 문서 확인: 2026-10-07. “키가 없다”와 “상업 사용까지 무제한 무료”는 다릅니다. 아래 URL은 응답 구조를 확인하는 출발점입니다. 실제 데이터 값·현재 제한·교육장 접속은 강의 전에 다시 확인합니다. 정기 실행은 응답을 저장해서 쓰고 실패 시 이전 결과를 보존합니다.

| API / 활용 | 키·계정 | 무료 범위 / 제한 | 시작 URL / 데이터 형태 | 공식 근거 |
| --- | --- | --- | --- | --- |
| Open-Meteo · 날씨/야외 행사 판단 | 무료 endpoint는 키 없음 | **비상업용** 무료. 약관은 일 10,000회 미만, 시간 5,000회, 분 600회. 출처 표시 CC BY 4.0. 교육 콘텐츠 예시는 있으나 기업 교육 자동 허용은 단정하지 않음. 상업 서비스는 유료 플랜 검토 | 아래 서울 URL. JSON 객체, current와 current_units | [날씨 문서](https://open-meteo.com/en/docs), [약관](https://open-meteo.com/en/terms), [요금](https://open-meteo.com/en/pricing) |
| Frankfurter v2 · 해외 지출/환율 | 키 없음 | API는 상업용도 무료라고 명시. 일·월 고정 quota 없음, 남용 방지 rate limit 있음. 원천 제공자 약관 적용. 실시간 거래 시세가 아닌 주로 일 단위 기준환율 | https://api.frankfurter.dev/v2/rate/usd/krw · 단일 환율 JSON. 금액×rate는 직접 계산 | [공식 v2 문서·FAQ](https://frankfurter.dev/) |
| JSONPlaceholder · 가상 할 일/사용자 | 키·가입 없음 | 누구나 무료인 테스트 데이터. POST/PUT은 실제 저장되지 않음. 개별 고정 호출 quota를 문서에서 확인하지 못했으며 무제한 가용성은 보장하지 않음 | https://jsonplaceholder.typicode.com/todos?userId=1 · JSON 배열, completed로 완료율 계산 | [공식 가이드·조건](https://jsonplaceholder.typicode.com/) |
| DummyJSON · 가상 상품/재고 | 공개 products는 키 없음. auth 경로는 토큰 필요 | 무료 가상 데이터 서비스. 실제 매출·고객자료가 아님. 이번에 읽은 문서에는 고정 quota 없음. 상업 서비스 백엔드로 쓰려면 별도 조건 확인 | https://dummyjson.com/products?limit=5&select=id,title,price,stock · products/total/skip/limit JSON 객체 | [공식 시작 문서](https://dummyjson.com/docs), [상품 문서](https://dummyjson.com/docs/products) |
| Open Library · 업무 도서 목록 | 조회 예시는 키 없음; 애플리케이션 등록 안내 있음 | 기본 초당 1회. 앱 이름/연락 이메일 User-Agent 식별 시 초당 3회. 교육·도서 탐색 중심, 대량 수집/고트래픽 상업 백엔드 용도 금지. 결과 캐시 권장 | https://openlibrary.org/search.json?q=project+management&limit=5&fields=key,title,author_name · docs JSON 배열. 책 제목·저자는 누락 가능 | [공식 이용 지침·속도 제한](https://openlibrary.org/developers/api), [검색 문서](https://openlibrary.org/dev/docs/api/search) |
| NASA APOD · 오늘의 콘텐츠 카드 | DEMO_KEY로 탐색. 정기 사용은 무료 개인 키 신청 | api.data.gov 기본 개인 키 시간 1,000회, API별 달라질 수 있음. DEMO_KEY는 IP당 시간30/일50. 교육장 동일 공인IP면 공유 한도에 주의. 이미지/영상 저작권과 재사용 조건은 항목별 확인 | https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY · JSON. media_type에 따라 영상일 수 있음 | [NASA 키 발급](https://api.nasa.gov/), [공식 APOD 저장소](https://github.com/nasa/apod-api), [정부 게이트웨이 제한](https://api.data.gov/docs/developer-manual/) |
| Nager.Date · 해외 지사 공휴일 **예비 후보** | 공식 공개 REST 예제는 키 없음. 오프라인 Docker/NuGet은 별도 라이선스 키 | 소스는 MIT, 공개 서비스 조건과 동일하지 않음. 최신 사이트 API/이용조건은 조사 환경 접근 실패로 무료·상업 범위/구체 quota 미확인. **강사 사전 확인 전 전원 호출 과제로 지정하지 않음** | https://nagerholidays.com/api/v3/publicholidays/2026/US · JSON 배열. 공식 저장소에서 도메인 변경 확인. v3 지원 종료 예정 2027-01-31, 수업 시 최신 버전 확인 | [공식 저장소: REST·라이선스·지원 일정](https://github.com/nager/Nager.Date), [최신 API 안내](https://nagerholidays.com/API) |

서울 날씨 URL:

```text
https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FSeoul&forecast_days=1
```

최초 과제는 날씨 합성 fixture로 시작하고 적용 조건이 맞을 때 실제 호출 1회로 확장합니다. 기업 교육에서 날씨 무료 API 조건을 판단하기 어렵다면 **JSONPlaceholder 할 일 완료율** 또는 **Frankfurter 환율**을 선택합니다. 망이 차단돼 있으면 DEMO 표시로 학습을 이어가며 API 연결 성공은 미완료로 남깁니다.

## 학습자가 고르는 방법

1. “내 업무에서 바깥 데이터 하나를 가져온다면?”을 한 문장으로 적습니다.
2. 위 목록에서 하나만 고릅니다. 키가 없는 조회 과제부터 시작합니다.
3. 응답 필드 3개 이내, 요청 1회, 파일 저장과 대시보드 한 장으로 범위를 줄입니다.
4. 숫자·빈값·실패·시각·단위를 직접 확인합니다. 화면이 예쁘다는 이유로 완료하지 않습니다.

복사 프롬프트:

```text
[선택한 API]로 [업무 목적] 도구를 만들어줘.
공식 문서 [URL]과 샘플 요청 [URL]만 참고해.
요청은 1회, 필드는 [3개 이내], Node의 fetch로 받고 JSON과 HTML을 저장해.
API 이용조건과 키 필요 여부를 먼저 짧게 확인해.
키가 필요하면 환경변수로 받고 화면·로그·Git에 남기지 마.
HTTP 실패/시간초과/누락필드면 중단하고 기존 결과를 보존해.
합성 데이터 모드는 명시적으로 선택하며 DEMO라고 표시해.
완료 후 실제 실행한 검사와 아직 못 한 검사를 분리해서 알려줘.
```

## API와 MCP·브라우저 구분

- API: 서비스에 URL/파라미터로 요청하면 JSON 같은 정해진 형식이 옵니다.
- MCP: Claude가 어떤 도구를 어떤 입력으로 사용할지 알려주는 연결 방식입니다. API를 MCP 도구로 감쌀 수도 있습니다. 외부 API 연결에 MCP가 필수인 것은 아닙니다.
- 이 실습: Node가 HTTP 요청을 보내고 결과를 HTML 안에 넣습니다. 브라우저는 완성 HTML을 열기만 합니다. 브라우저 직접 fetch의 CORS 허용 여부는 별도 조건이며 이 조사에서 서비스별 CORS 헤더를 확인하지 않았습니다.
- 반복 실행: 도구가 만들어진 뒤에는 Node만 실행합니다. 데이터 수집·계산마다 Claude/다른 AI API를 호출하지 않습니다.

## 검증 상태

공식 문서 열람과 응답 필드 계약 확인은 완료했습니다. 조사 도구로 서울 실제 API를 열었으나 접근 오류가 발생했습니다. 제공 완성본의 Node 실제 API 실행 성공 여부는 `_workspace/api-lab-verification.md`에 별도 기록합니다. 예시 JSON은 전부 **합성**이며 캡처된 실시간 응답이 아닙니다.
