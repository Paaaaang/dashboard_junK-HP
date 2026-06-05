# 구글 폼 & Supabase 연동 설정 가이드

본 문서는 구글 폼으로 신청받은 수강 신청 정보를 Supabase의 임시 대기 테이블(`applications`)로 자동 연동하기 위해 구글 스프레드시트에 Webhook을 설정하는 가이드입니다.

---

## 1. 연동 파이프라인 개요
```
[구글 폼 신청서 제출]
       │
       ▼
[구글 스프레드시트 적재] ──(Apps Script 트리거)──> [Supabase Edge Function] ──> [Staging DB (applications)]
```

---

## 2. Supabase Edge Function 정보
* **Webhook URL:** `https://gdncugbliewmynmacejg.supabase.co/functions/v1/google-form-webhook`
* **HTTP Method:** `POST`
* **Header:** `Content-Type: application/json`

---

## 3. 구글 스프레드시트 Apps Script 설정 단계

### 1단계: Apps Script 에디터 열기
1. 구글 폼과 연결된 **구글 스프레드시트**를 엽니다.
2. 상단 메뉴에서 **[확장 프로그램] > [Apps Script]**를 클릭합니다.

### 2단계: 코드 작성
1. 기존 코드를 모두 지우고, 아래의 **Apps Script 코드**를 복사하여 붙여넣습니다.
2. **주의:** 본 설문지의 1행 헤더 문구(`1. 기업명을 입력해주십시오.` 등)에 정확하게 맞추어 매핑을 완료한 코드입니다.
3. **[안내]** 본 코드를 통해 수집된 신청서는 특정 교육 과정이 미지정된 채로 대기 목록에 등록됩니다. 관리자가 대시보드의 **신청 대기 관리** 화면에서 상세 보기를 열고 수강 과정 및 기수(회차)를 지정한 뒤 승인 처리하면 자동으로 매칭 및 등록이 완료됩니다.

```javascript
/**
 * 구글 폼 제출 시 자동으로 실행되어 Supabase Edge Function으로 데이터를 전송하는 웹훅 함수
 */
function onSubmit(e) {
  var namedValues = e.namedValues;
  
  var payload = {
    // 1행 질문 제목에 정확하게 매핑된 데이터들입니다.
    companyName: namedValues["1. 기업명을 입력해주십시오."] ? namedValues["1. 기업명을 입력해주십시오."][0].trim() : "",
    name: namedValues["2. 성명을 입력해주십시오."] ? namedValues["2. 성명을 입력해주십시오."][0].trim() : "",
    phone: namedValues["3. 연락처를 입력해주십시오."] ? namedValues["3. 연락처를 입력해주십시오."][0].trim() : "",
    email: namedValues["4. 이메일 주소를 입력해주세요."] ? namedValues["4. 이메일 주소를 입력해주세요."][0].trim() : "",
    
    // 고용보험 가입여부는 '가입', '미가입', '미확인' 중 하나여야 합니다. (아래 parseInsurance 함수가 자동 정제)
    employmentInsurance: parseInsurance(namedValues["5. 고용보험 가입여부를 체크해주세요."] ? namedValues["5. 고용보험 가입여부를 체크해주세요."][0] : ""),
    
    // 추가 설문 항목 (B~I열 매핑)
    mainProduct: namedValues["6. 기업 주력 품목을 선택해주세요."] ? namedValues["6. 기업 주력 품목을 선택해주세요."][0].trim() : "",
    workExperience: namedValues["7. 업무 경력을 선택해주세요."] ? namedValues["7. 업무 경력을 선택해주세요."][0].trim() : "",
    documentSkill: namedValues["8. 의료기기 품질관리 문서 작성 역량을 선택해주세요."] ? namedValues["8. 의료기기 품질관리 문서 작성 역량을 선택해주세요."][0].trim() : ""
  };

  // 필수값 검증
  if (!payload.name || !payload.companyName) {
    Logger.log("필수 입력 정보 누락으로 전송을 중단합니다: " + JSON.stringify(payload));
    return;
  }

  var url = "https://gdncugbliewmynmacejg.supabase.co/functions/v1/google-form-webhook";
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    Logger.log("Response Code: " + responseCode);
    Logger.log("Response Body: " + responseBody);
  } catch (err) {
    Logger.log("Error sending webhook: " + err.toString());
  }
}

/**
 * 고용보험 가입여부 데이터 정제 함수
 * Supabase DB CHECK 제약조건 ('가입', '미가입', '미확인')에 부합하도록 맞춤 변환
 */
function parseInsurance(val) {
  if (!val) return "미확인";
  var cleanVal = val.toString().trim();
  if (cleanVal.indexOf("가입") !== -1 && cleanVal.indexOf("미가입") === -1) {
    return "가입";
  } else if (cleanVal.indexOf("미가입") !== -1 || cleanVal.indexOf("아니오") !== -1 || cleanVal.indexOf("N") !== -1) {
    return "미가입";
  }
  return "미확인";
}
```

3. 상단의 **[저장] (디스크 아이콘)** 버튼을 클릭하여 저장합니다.

### 3단계: 양식 제출 트리거 등록 (중요)
1. Apps Script 화면 좌측 메뉴에서 **시계 아이콘 (트리거)**을 클릭합니다.
2. 우측 하단의 **[+ 트리거 추가]** 버튼을 클릭합니다.
3. 아래 설정값을 선택합니다:
   * **실행할 함수 선택:** `onSubmit`
   * **실행할 배포 선택:** `Head`
   * **이벤트 소스 선택:** `스프레드시트에서`
   * **이벤트 유형 선택:** `양식 제출 시`
   * **오류 알림 설정:** `매일(또는 즉시 알림)`
4. **[저장]**을 누르고 구글 계정 권한 승인을 완료합니다.
