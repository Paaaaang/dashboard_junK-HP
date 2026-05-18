import { useRef } from "react";
import { X, FileSpreadsheet, Check, RotateCcw, ChevronRight, Info, AlertCircle, ChevronLeft } from "lucide-react";
import type { ParticipantRecord } from "@/types/models";

interface UploadModalProps {
  onClose: () => void;
  uploadFile?: File | null;
  uploadStep: number;
  rawRows: Record<string, any>[];
  columnMapping: Record<string, string>;
  onMappingChange: (col: string, field: string) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  systemFields: Array<{ key: string; label: string; required?: boolean }>;
  uploadPreview: ParticipantRecord[] | null;
  uploadError: string | null;
  isParsing?: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDropzoneDrop: (e: React.DragEvent<HTMLDivElement>) => void;
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
  onPrevStep,
  systemFields,
  uploadPreview,
  uploadError,
  isParsing,
  onFileChange,
  onDropzoneDrop,
  onConfirm,
  onReset,
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation: Check if all required fields are mapped
  const requiredFields = systemFields.filter(f => f.required).map(f => f.key);
  const mappedFields = Object.values(columnMapping);
  const isMappingValid = requiredFields.every(field => mappedFields.includes(field));

  return (
    <div
      className="fixed inset-0 bg-brand-dark/40 flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="참여자 대량 등록"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface rounded-2xl shadow-xl flex flex-col w-full max-w-4xl h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-primary tracking-tight">참여자 데이터 일괄 등록</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-subtle rounded-full border border-border/40">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    uploadStep === step
                      ? "bg-cta w-6"
                      : uploadStep > step
                      ? "bg-cta/30"
                      : "bg-tertiary/20"
                  }`}
                />
              ))}
              <span className="text-[10px] font-black text-secondary ml-1 uppercase tracking-widest opacity-60">{uploadStep}단계 / 전체 3단계</span>
            </div>
          </div>
          <button
            type="button"
            className="p-2 text-tertiary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all duration-200 cursor-pointer"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {uploadStep === 1 && (
            <div className="p-8 space-y-6 flex-1 flex flex-col justify-center">
              {isParsing ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-12 h-12 border-4 border-surface-subtle border-t-cta rounded-full animate-spin" />
                  <p className="text-sm font-bold text-secondary animate-pulse">데이터를 분석하고 있습니다...</p>
                </div>
              ) : (
                <>
                  <div
                    className={`group border-2 border-dashed rounded-xl p-16 flex flex-col items-center gap-6 cursor-pointer transition-all duration-200 ${
                      uploadFile 
                        ? "border-cta bg-cta/5" 
                        : "border-border hover:border-cta hover:bg-cta/5"
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
                    <div className={`p-6 rounded-2xl transition-all duration-200 ${
                      uploadFile ? "bg-cta/10 text-cta" : "bg-surface-subtle text-tertiary group-hover:bg-cta/10 group-hover:text-cta"
                    }`}>
                      <FileSpreadsheet className="w-12 h-12" strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-primary tracking-tight">
                        {uploadFile ? uploadFile.name : "엑셀 파일을 드래그하거나 클릭하여 선택하세요"}
                      </p>
                      <p className="text-sm text-tertiary mt-2 font-medium">.xlsx, .xls 파일 지원 (최대 10MB)</p>
                    </div>
                    {uploadFile && (
                      <div className="px-4 py-1.5 bg-cta text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-cta/20 animate-in zoom-in-95 duration-300">
                        파일 업로드 준비 완료
                      </div>
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
                    <div className="p-4 bg-error/5 border border-error/20 rounded-xl flex items-center gap-3 text-error animate-in shake duration-300">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-bold">{uploadError}</span>
                    </div>
                  )}

                  <div className="p-6 bg-surface-subtle rounded-xl border border-border/40">
                    <p className="text-xs font-black text-secondary mb-3 flex items-center gap-2 uppercase tracking-widest opacity-70">
                      <Info className="w-3.5 h-3.5 text-cta" />
                      업로드 안내 가이드
                    </p>
                    <ul className="text-sm text-secondary space-y-2 leading-relaxed list-disc list-inside font-medium opacity-90">
                      <li>첫 번째 행은 데이터 항목 명칭(헤더)으로 자동 인식됩니다.</li>
                      <li>참여자 대량 등록을 위해 정해진 양식을 권장합니다.</li>
                      <li>다음 단계에서 엑셀의 열과 참여자 항목을 연결합니다.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {uploadStep === 2 && rawRows.length > 0 && (
            <div className="p-8 space-y-6 flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-end px-2">
                <div>
                  <h4 className="text-lg font-bold text-primary tracking-tight font-heading">컬럼 매핑 설정</h4>
                  <p className="text-sm text-tertiary mt-1 font-medium">엑셀의 각 항목을 참여자 데이터 필드와 연결해 주세요.</p>
                </div>
                <div className="px-3 py-1 bg-surface-subtle text-tertiary text-[10px] font-black rounded-md border border-border/60 uppercase tracking-widest">
                  총 {Object.keys(rawRows[0]).length}개의 컬럼이 발견되었습니다
                </div>
              </div>

              <div className="flex-1 min-h-0 border border-border rounded-xl overflow-hidden bg-surface shadow-sm">
                <div className="h-full overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-[1fr_1fr] gap-px bg-border/40 sticky top-0 z-20">
                    <div className="bg-surface-subtle px-8 py-3 text-[10px] font-black text-tertiary uppercase tracking-widest">엑셀 항목 (원본 데이터)</div>
                    <div className="bg-surface-subtle px-8 py-3 text-[10px] font-black text-tertiary uppercase tracking-widest">참여자 필드 (저장 대상)</div>
                  </div>
                  <div className="divide-y divide-border/40">
                    {Object.keys(rawRows[0]).map((col) => {
                      const currentMapping = columnMapping[col] ?? "__skip__";
                      
                      return (
                        <div key={col} className="grid grid-cols-[1fr_1fr] group hover:bg-surface-subtle/20 transition-colors">
                          {/* Excel Column Area */}
                          <div className="p-6 px-8 flex items-center gap-4 bg-surface-subtle/10 border-r border-border/40">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-primary truncate">{col}</p>
                              <p className="text-[11px] text-tertiary truncate mt-1.5 flex items-center gap-1.5 font-medium">
                                <span className="text-[9px] font-black text-tertiary/40 uppercase tracking-tighter">예시값:</span>
                                {String(rawRows[0][col] || "") || "(비어 있음)"}
                              </p>
                            </div>
                          </div>

                          {/* System Field Area */}
                          <div className="p-6 px-8 flex items-center justify-between gap-6">
                            <div className="flex-1 relative">
                              <select
                                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border bg-surface text-sm font-bold text-secondary focus:outline-none focus:ring-2 focus:ring-cta/10 focus:border-cta transition-all duration-200 appearance-none cursor-pointer group-hover:border-border-strong"
                                value={currentMapping}
                                onChange={(e) => onMappingChange(col, e.target.value)}
                              >
                                {systemFields.map((f) => (
                                  <option key={f.key} value={f.key}>
                                    {f.label}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="w-3.5 h-3.5 text-tertiary rotate-90" strokeWidth={3} />
                              </div>
                            </div>
                            
                            {/* Mandatory Marker - Moved outside dropdown */}
                            <div className="w-12 flex justify-center">
                              {systemFields.find(f => f.key === currentMapping)?.required ? (
                                <div className="px-2 py-0.5 bg-error/10 text-error text-[9px] font-black rounded border border-error/20 uppercase tracking-tighter animate-in fade-in duration-300">
                                  필수
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {!isMappingValid && (
                <div className="p-4 bg-error/5 border border-error/10 rounded-xl flex items-center gap-3 text-error/80 animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    필수 항목({systemFields.filter(f => f.required).map(f => f.label).join(", ")})이 아직 매핑되지 않았습니다.
                  </span>
                </div>
              )}
            </div>
          )}

          {uploadStep === 3 && uploadPreview && (
            <div className="p-8 space-y-6 flex-1 flex flex-col min-h-0">
              <div className="p-6 bg-surface-subtle border border-border rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cta/10 text-cta rounded-xl border border-cta/20">
                    <Check className="w-6 h-6" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-bold text-primary text-lg tracking-tight font-heading">데이터 준비 완료</p>
                    <p className="text-sm text-secondary font-medium">총 {uploadPreview.length}명의 참여자 데이터를 성공적으로 로드했습니다. 아래 내용을 최종 확인해 주세요.</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 border border-border rounded-xl overflow-hidden shadow-sm bg-surface">
                <div className="h-full overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-surface-subtle border-b border-border shadow-sm">
                        <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest bg-surface-subtle">이름</th>
                        <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest bg-surface-subtle">소속 기업</th>
                        <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest bg-surface-subtle">직위</th>
                        <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest bg-surface-subtle">연락처</th>
                        <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest bg-surface-subtle">이메일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {uploadPreview.map((p, i) => (
                        <tr key={i} className="hover:bg-surface-subtle/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-primary">{p.name}</td>
                          <td className="px-6 py-4 text-sm text-secondary font-medium">{p.companyName}</td>
                          <td className="px-6 py-4 text-sm text-secondary">{p.position || "-"}</td>
                          <td className="px-6 py-4 text-sm text-secondary font-mono tabular-nums">{p.phone || "-"}</td>
                          <td className="px-6 py-4 text-sm text-secondary font-medium">{p.email || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-border flex justify-between items-center bg-surface-subtle/50">
          <div className="flex gap-3">
            <button
              type="button"
              className="px-5 py-2.5 text-tertiary hover:text-error hover:bg-error/5 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer rounded-lg uppercase tracking-widest"
              onClick={onReset}
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
              전체 초기화
            </button>
          </div>
          
          <div className="flex gap-3">
            {uploadStep > 1 && (
              <button
                type="button"
                className="px-6 py-2.5 text-secondary hover:text-primary hover:bg-surface-active font-bold text-sm transition-all flex items-center gap-2 cursor-pointer rounded-xl border border-border/60 bg-surface shadow-sm"
                onClick={onPrevStep}
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                이전 단계로
              </button>
            )}

            {uploadStep === 1 && (
              <button
                type="button"
                className="btn-primary px-10 py-3 text-white rounded-xl font-black text-sm transition-all duration-300 shadow-lg shadow-cta/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none hover:scale-[1.02] active:scale-[0.98]"
                disabled={!uploadFile || isParsing}
                onClick={onNextStep}
              >
                다음 단계로
                <ChevronRight className="w-4 h-4 ml-2" strokeWidth={3} />
              </button>
            )}

            {uploadStep === 2 && (
              <button
                type="button"
                className="btn-primary px-10 py-3 text-white rounded-xl font-black text-sm transition-all duration-300 shadow-lg shadow-cta/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none hover:scale-[1.02] active:scale-[0.98]"
                disabled={!isMappingValid}
                onClick={onNextStep}
              >
                데이터 미리보기 확인
                <ChevronRight className="w-4 h-4 ml-2" strokeWidth={3} />
              </button>
            )}

            {uploadStep === 3 && (
              <button
                type="button"
                className="btn-primary px-12 py-3 text-white rounded-xl font-black text-sm transition-all duration-300 shadow-lg shadow-cta/30 hover:scale-[1.02] active:scale-[0.98]"
                disabled={!uploadPreview || uploadPreview.length === 0}
                onClick={onConfirm}
              >
                총 {uploadPreview?.length || 0}명 등록 완료
                <Check className="w-4 h-4 ml-2" strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
