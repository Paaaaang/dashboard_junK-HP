import { useRef } from "react";
import { X, FileSpreadsheet, Check, RotateCcw, ChevronRight, AlertCircle } from "lucide-react";
import type { ParticipantRecord } from "@/types/models";

interface UploadModalProps {
  onClose: () => void;
  uploadStep: number;
  rawRows: Record<string, any>[];
  columnMapping: Record<string, string>;
  onMappingChange: (col: string, field: string) => void;
  onNextStep: () => void;
  systemFields: Array<{ key: string; label: string }>;
  uploadPreview: ParticipantRecord[] | null;
  uploadError: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDropzoneDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onConfirm: () => void;
  onReset: () => void;
}

export function UploadModal({
  onClose,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-dark/40" onClick={onClose} />
      
      <div className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-surface-subtle/50">
          <div>
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <FileSpreadsheet className="text-brand-primary" strokeWidth={2.5} />
              참여자 대량 등록
            </h2>
            <p className="text-sm text-secondary mt-1">엑셀 파일을 업로드하여 여러 참여자를 한 번에 등록합니다.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-colors text-tertiary hover:text-secondary shadow-sm">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  uploadStep === s ? "bg-brand-primary text-white shadow-brand-primary/20 shadow-lg scale-110" : 
                  uploadStep > s ? "bg-brand-primary/10 text-brand-primary" : "bg-surface-subtle text-tertiary"
                }`}>
                  {uploadStep > s ? <Check size={20} strokeWidth={2.5} /> : s}
                </div>
                {s < 3 && <div className={`w-16 h-1 mx-2 rounded-full transition-colors duration-500 ${uploadStep > s ? "bg-brand-primary/20" : "bg-surface-subtle"}`} />}
              </div>
            ))}
          </div>

          {uploadStep === 1 && (
            <div 
              className="border-2 border-dashed border-border rounded-3xl p-16 flex flex-col items-center justify-center bg-surface-subtle/50 hover:bg-brand-primary/10 hover:border-brand-primary transition-all cursor-pointer group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropzoneDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-surface rounded-2xl shadow-soft flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileSpreadsheet size={40} className="text-brand-primary" strokeWidth={2.5} />
              </div>
              <p className="text-lg font-bold text-secondary">엑셀 파일을 드래그하거나 클릭하여 선택</p>
              <p className="text-tertiary mt-2 text-sm">xlsx, xls 파일 지원 (최대 10MB)</p>
              <input type="file" ref={fileInputRef} hidden accept=".xlsx, .xls" onChange={onFileChange} />
            </div>
          )}

          {uploadStep === 2 && (
            <div className="space-y-6">
              <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="text-brand-primary flex-shrink-0" size={20} strokeWidth={2.5} />
                <p className="text-sm text-brand-primary leading-relaxed">
                  엑셀의 각 열(Column)이 대시보드의 어떤 정보인지 연결해 주세요.<br/>
                  <span className="font-bold">* 표시된 항목(이름)은 필수입니다.</span>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(rawRows[0] || {}).map((col) => (
                  <div key={col} className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-brand-primary transition-colors flex flex-col gap-3">
                    <label className="text-xs font-bold text-tertiary uppercase tracking-wider">엑셀 열 이름</label>
                    <div className="font-bold text-secondary truncate">{col}</div>
                    <div className="h-px bg-surface-subtle my-1" />
                    <label className="text-xs font-bold text-tertiary uppercase tracking-wider">연결할 항목</label>
                    <select
                      className="w-full bg-surface-subtle border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                      value={columnMapping[col] || "__skip__"}
                      onChange={(e) => onMappingChange(col, e.target.value)}
                    >
                      {systemFields.map((f) => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary">미리보기 ({uploadPreview?.length || 0}명)</h3>
                <button onClick={onReset} className="text-sm text-tertiary hover:text-brand-primary flex items-center gap-1.5 font-medium transition-colors">
                  <RotateCcw size={14} strokeWidth={2.5} /> 다시 업로드
                </button>
              </div>

              <div className="border border-border rounded-2xl overflow-hidden bg-surface shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-subtle border-b border-border text-tertiary font-bold">
                      <th className="px-5 py-4 text-left">이름</th>
                      <th className="px-5 py-4 text-left">직위</th>
                      <th className="px-5 py-4 text-left">연락처</th>
                      <th className="px-5 py-4 text-left">이메일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-subtle">
                    {uploadPreview?.map((p, i) => (
                      <tr key={i} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="px-5 py-4 font-bold text-secondary">{p.name}</td>
                        <td className="px-5 py-4 text-tertiary">{p.position || "-"}</td>
                        <td className="px-5 py-4 text-tertiary font-mono text-xs">{p.phone || "-"}</td>
                        <td className="px-5 py-4 text-tertiary italic">{p.email || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="mt-6 bg-error/10 border border-error/20 text-error rounded-2xl p-4 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} strokeWidth={2.5} />
              <p className="font-medium">{uploadError}</p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-border flex items-center justify-end gap-3 bg-surface-subtle/50">
          <button onClick={onClose} className="px-6 py-2.5 text-secondary font-bold hover:bg-surface-subtle rounded-xl transition-all">
            취소
          </button>
          
          {uploadStep === 2 && (
            <button
              className="px-8 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-soft hover:bg-brand-primary-hover transition-all flex items-center gap-2"
              onClick={onNextStep}
            >
              다음 단계 <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          )}

          {uploadStep === 3 && (
            <button
              className="px-10 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-soft hover:bg-brand-primary-hover transition-all shadow-brand-primary/20 active:scale-95 active:shadow-none"
              disabled={!uploadPreview || uploadPreview.length === 0}
              onClick={onConfirm}
            >
              {uploadPreview?.length || 0}명 등록 완료
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
