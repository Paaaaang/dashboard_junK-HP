import { useRef } from "react";
import { X, FileSpreadsheet, Check, RotateCcw, ChevronRight } from "lucide-react";
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
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="엑셀 업로드"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[32px] shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-slate-900">엑셀 파일 업로드</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    uploadStep === step
                      ? "bg-emerald-500 w-6"
                      : uploadStep > step
                      ? "bg-emerald-200"
                      : "bg-slate-300"
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-slate-500 ml-1">Step {uploadStep}/3</span>
            </div>
          </div>
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {uploadStep === 1 && (
            <div className="space-y-6">
              <div
                className={`group border-2 border-dashed rounded-[24px] p-12 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200 ${
                  uploadFile 
                    ? "border-emerald-500 bg-emerald-50/30" 
                    : "border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30"
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
                  uploadFile ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                }`}>
                  <FileSpreadsheet className="w-10 h-10" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {uploadFile ? uploadFile.name : "클릭하거나 파일을 드래그하세요"}
                  </p>
                  <p className="text-sm text-slate-500">.xlsx, .xls 파일 지원</p>
                </div>
                {uploadFile && (
                  <span className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-600/20">
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
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                  <span className="text-sm font-semibold">{uploadError}</span>
                </div>
              )}

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm font-bold text-slate-900 mb-2">업로드 안내</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  파일을 업로드한 후 다음 단계에서 컬럼을 매핑합니다. 시스템 필드에 맞는 데이터를 확인해 주세요.
                </p>
              </div>
            </div>
          )}

          {uploadStep === 2 && rawRows.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">컬럼 매핑 확인</h4>
                  <p className="text-sm text-slate-500">각 컬럼을 시스템 필드에 연결하세요.</p>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                  {Object.keys(rawRows[0]).length}개 컬럼 발견
                </div>
              </div>

              <div className="border border-slate-100 rounded-[24px] overflow-hidden bg-slate-50/30">
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {Object.keys(rawRows[0]).map((colName) => (
                    <div key={colName} className="flex gap-6 items-center p-6 border-b border-slate-100 last:border-0 bg-white hover:bg-slate-50/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{colName}</p>
                        <p className="text-xs text-slate-500 truncate mt-1">
                          미리보기: <span className="text-slate-700 font-medium">{String(rawRows[0][colName] ?? "")}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <select
                          className="w-48 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
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
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {uploadStep === 3 && uploadPreview && (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-emerald-900 font-bold">인식 완료</p>
                    <p className="text-emerald-700 text-sm">{uploadPreview.length}개 기업이 인식되었습니다.</p>
                  </div>
                </div>
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">최종 확인 후 삽입하세요</p>
              </div>

              <div className="border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">기업명</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">사업자번호</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">소재지</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">대표명</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">담당자</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">연락처</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">이메일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {uploadPreview.map((company) => (
                        <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{company.companyName}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{company.businessRegNo}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{company.location}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{company.representative}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{company.manager}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{company.phone}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{company.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all duration-200 flex items-center gap-2"
            onClick={uploadStep === 1 ? onClose : onReset}
          >
            {uploadStep === 1 ? "취소" : (
              <>
                <RotateCcw className="w-4 h-4" />
                다시 시작
              </>
            )}
          </button>
          
          {uploadStep === 1 && (
            <button
              type="button"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:shadow-none"
              disabled={!uploadFile}
              onClick={onNextStep}
            >
              다음 단계로
            </button>
          )}

          {uploadStep === 2 && (
            <button
              type="button"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-emerald-600/20"
              onClick={onNextStep}
            >
              다음: 미리보기
            </button>
          )}

          {uploadStep === 3 && (
            <button
              type="button"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:shadow-none"
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
