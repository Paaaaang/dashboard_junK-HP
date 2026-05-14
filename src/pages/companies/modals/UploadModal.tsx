import { useRef } from "react";
import { X, FileSpreadsheet, Check, RotateCcw, ChevronRight } from "lucide-react";
import type { CompanyRecord } from "@/types/models";

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
      className="fixed inset-0 bg-brand-dark/40 flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="엑셀 업로드"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface rounded-[32px] shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-primary">엑셀 파일 업로드</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-subtle rounded-full">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    uploadStep === step
                      ? "bg-brand-primary w-6"
                      : uploadStep > step
                      ? "bg-brand-primary/30"
                      : "bg-tertiary/30"
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-secondary ml-1">Step {uploadStep}/3</span>
            </div>
          </div>
          <button
            type="button"
            className="p-2 text-tertiary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all duration-200"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {uploadStep === 1 && (
            <div className="space-y-6">
              <div
                className={`group border-2 border-dashed rounded-[24px] p-12 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200 ${
                  uploadFile 
                    ? "border-brand-primary bg-brand-primary/10" 
                    : "border-border hover:border-brand-primary hover:bg-brand-primary/10"
                }`}
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") fileInputRef.current?.click();
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDropzoneDrop}
              >
                <div className={`p-5 rounded-2xl transition-all duration-200 ${
                  uploadFile ? "bg-brand-primary/10 text-brand-primary" : "bg-surface-subtle text-tertiary group-hover:bg-brand-primary/10 group-hover:text-brand-primary"
                }`}>
                  <FileSpreadsheet className="w-10 h-10" strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">
                    {uploadFile ? uploadFile.name : "클릭하거나 파일을 드래그하세요"}
                  </p>
                  <p className="text-sm text-secondary">.xlsx, .xls 파일 지원</p>
                </div>
                {uploadFile && (
                  <span className="px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-full shadow-lg shadow-brand-primary/20">
                    파일 선택됨
                  </span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={onFileChange}
              />

              {uploadError && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error">
                  <span className="text-sm font-semibold">{uploadError}</span>
                </div>
              )}

              <div className="p-6 bg-surface-subtle rounded-2xl border border-border">
                <p className="text-sm font-bold text-primary mb-2">업로드 안내</p>
                <p className="text-sm text-secondary leading-relaxed">
                  파일을 업로드한 후 다음 단계에서 컬럼을 매핑합니다. 시스템 필드에 맞는 데이터를 확인해 주세요.
                </p>
              </div>
            </div>
          )}

          {uploadStep === 2 && rawRows.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-lg font-bold text-primary">컬럼 매핑 확인</h4>
                  <p className="text-sm text-secondary">각 컬럼을 시스템 필드에 연결하세요.</p>
                </div>
                <div className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-bold rounded-full border border-brand-primary/20">
                  {Object.keys(rawRows[0]).length}개 컬럼 발견
                </div>
              </div>

              <div className="border border-border rounded-[24px] overflow-hidden bg-surface-subtle/30">
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {Object.keys(rawRows[0]).map((colName) => (
                    <div key={colName} className="flex gap-6 items-center p-6 border-b border-border last:border-0 bg-surface hover:bg-surface-subtle/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-primary truncate">{colName}</p>
                        <p className="text-xs text-secondary truncate mt-1">
                          미리보기: <span className="text-primary font-medium">{String(rawRows[0][colName] ?? "")}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <ChevronRight className="w-4 h-4 text-tertiary" strokeWidth={2.5} />
                        <select
                          className="w-48 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
                          value={columnMapping[colName] ?? "__skip__"}
                          onChange={(e) => onMappingChange(colName, e.target.value)}
                        >
                          {systemFields.map((f) => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {uploadError && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-sm font-semibold">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {uploadStep === 3 && uploadPreview && (
            <div className="space-y-6">
              <div className="p-6 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                    <Check className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-brand-primary font-bold">인식 완료</p>
                    <p className="text-brand-primary text-sm">{uploadPreview.length}개 기업이 인식되었습니다.</p>
                  </div>
                </div>
                <p className="text-xs text-brand-primary font-bold uppercase tracking-wider">최종 확인 후 삽입하세요</p>
              </div>

              <div className="border border-border rounded-[24px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-subtle border-b border-border">
                        <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase tracking-wider">기업명</th>
                        <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase tracking-wider">사업자번호</th>
                        <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase tracking-wider">소재지</th>
                        <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase tracking-wider">대표명</th>
                        <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase tracking-wider">담당자</th>
                        <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase tracking-wider">연락처</th>
                        <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase tracking-wider">이메일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-subtle">
                      {uploadPreview.map((company) => (
                        <tr key={company.id} className="hover:bg-surface-subtle/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-primary">{company.companyName}</td>
                          <td className="px-6 py-4 text-sm text-secondary">{company.businessRegNo}</td>
                          <td className="px-6 py-4 text-sm text-secondary">{company.location}</td>
                          <td className="px-6 py-4 text-sm text-secondary">{company.representative}</td>
                          <td className="px-6 py-4 text-sm text-secondary">{company.manager}</td>
                          <td className="px-6 py-4 text-sm text-secondary">{company.phone}</td>
                          <td className="px-6 py-4 text-sm text-secondary">{company.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-border flex justify-end gap-3 bg-surface-subtle/50">
          <button
            type="button"
            className="px-6 py-3 bg-surface border border-border text-secondary hover:bg-surface-subtle rounded-xl font-bold transition-all duration-200 flex items-center gap-2"
            onClick={uploadStep === 1 ? onClose : onReset}
          >
            {uploadStep === 1 ? "취소" : (
              <>
                <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
                다시 시작
              </>
            )}
          </button>
          
          {uploadStep === 1 && (
            <button
              type="button"
              className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:shadow-none"
              disabled={!uploadFile}
              onClick={onNextStep}
            >
              다음 단계로
            </button>
          )}

          {uploadStep === 2 && (
            <button
              type="button"
              className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-brand-primary/20"
              onClick={onNextStep}
            >
              다음: 미리보기
            </button>
          )}

          {uploadStep === 3 && (
            <button
              type="button"
              className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:shadow-none"
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
