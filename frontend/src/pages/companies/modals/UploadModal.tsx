import { useRef } from "react";
import { X, FileSpreadsheet } from "lucide-react";
import type { CompanyRecord } from "../../../types/models";

interface UploadModalProps {
  onClose: () => void;
  uploadFile: File | null;
  uploadStep: 1 | 2 | 3;
  rawRows: Record<string, unknown>[];
  columnMapping: Record<string, string>;
  onMappingChange: (colName: string, systemField: string) => void;
  onNextStep: () => void;
  systemFields: { key: string; label: string }[];
  uploadPreview: CompanyRecord[] | null;
  uploadError: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDropzoneDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onConfirm: () => void;
  onReset: () => void;
}

export function UploadModal({
  onClose,
  uploadFile,
  uploadStep,
  rawRows,
  columnMapping,
  onMappingChange,
  onNextStep,
  systemFields,
  uploadPreview,
  uploadError,
  onFileChange,
  onDropzoneDrop,
  onConfirm,
  onReset,
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="엑셀 업로드"
    >
      <div className="modal-panel">
        <div className="modal-header">
          <h3>엑셀 파일 업로드 (Step {uploadStep}/3)</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="icon-sm" />
          </button>
        </div>

        <div className="modal-content">
          {uploadStep === 1 && (
            <div className="upload-modal-body">
              <div
                className="upload-dropzone"
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") fileInputRef.current?.click();
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDropzoneDrop}
              >
                <FileSpreadsheet className="upload-icon" />
                <p className="upload-hint-main">
                  클릭하거나 파일을 드래그하세요
                </p>
                <p className="upload-hint-sub">.xlsx, .xls 파일 지원</p>
                {uploadFile && (
                  <p className="upload-filename">{uploadFile.name}</p>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={onFileChange}
              />

              {uploadError && <p className="upload-error">{uploadError}</p>}

              <div className="upload-guide">
                <p className="upload-guide-title">업로드 안내</p>
                <p className="upload-guide-text">
                  파일을 업로드한 후 다음 단계에서 컬럼을 매핑합니다.
                </p>
              </div>
            </div>
          )}

          {uploadStep === 2 && rawRows.length > 0 && (
            <div className="upload-modal-body">
              <h4>컬럼 매핑 확인</h4>
              <p className="upload-hint">각 컬럼을 시스템 필드에 연결하세요.</p>
              <div className="upload-preview-table" style={{ maxHeight: "300px", overflowY: "auto", marginTop: "12px", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "0 12px" }}>
                {Object.keys(rawRows[0]).map((colName) => (
                  <div key={colName} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{colName}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        미리보기: {String(rawRows[0][colName] ?? "")}
                      </p>
                    </div>
                    <select
                      className="select-field"
                      style={{ width: 160 }}
                      value={columnMapping[colName] ?? "__skip__"}
                      onChange={(e) => onMappingChange(colName, e.target.value)}
                    >
                      {systemFields.map((f) => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {uploadError && <p className="upload-error" style={{ marginTop: 12 }}>{uploadError}</p>}
            </div>
          )}

          {uploadStep === 3 && uploadPreview && (
            <div className="upload-modal-body">
              <p className="upload-preview-info">
                {uploadPreview.length}개 기업이 인식되었습니다. 최종 확인 후 삽입하세요.
              </p>
              <div className="table-wrap upload-preview-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>기업명</th>
                      <th>사업자번호</th>
                      <th>소재지</th>
                      <th>대표명</th>
                      <th>담당자</th>
                      <th>연락처</th>
                      <th>이메일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadPreview.map((company) => (
                      <tr key={company.id}>
                        <td>{company.companyName}</td>
                        <td>{company.businessRegNo}</td>
                        <td>{company.location}</td>
                        <td>{company.representative}</td>
                        <td>{company.manager}</td>
                        <td>{company.phone}</td>
                        <td>{company.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={uploadStep === 1 ? onClose : onReset}
          >
            {uploadStep === 1 ? "취소" : "다시 시작"}
          </button>
          
          {uploadStep === 2 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onNextStep}
            >
              다음: 미리보기
            </button>
          )}

          {uploadStep === 3 && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!uploadPreview || uploadPreview.length === 0}
              onClick={onConfirm}
            >
              삽입 완료
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
