# 한글 폰트 자산

수료증 PDF에 임베딩되는 한글 폰트입니다. **두 파일을 직접 다운로드해서 이 폴더에 넣어주세요.**

## 필요한 파일

| 파일명 | 다운로드 위치 |
|---|---|
| `NotoSansKR-Regular.otf` | https://fonts.google.com/noto/specimen/Noto+Sans+KR (Download family) |
| `NotoSansKR-Bold.otf` | 동일 패키지에 포함 |

다운로드 후 압축을 풀고 `NotoSansKR-Regular.otf`, `NotoSansKR-Bold.otf` 두 파일만 이 폴더(`public/fonts/`)에 복사합니다.

> 폰트 파일은 .gitignore 처리되어 있어 커밋되지 않습니다. 새 환경에서는 이 절차를 다시 수행하세요.

## 다른 폰트로 교체하고 싶다면

`src/lib/certificate/generator.ts` 의 `DEFAULT_FONTS` 상수를 수정하거나, 템플릿 관리 UI에서 별도 폰트를 업로드해 `font_path` 컬럼에 지정할 수 있습니다.
