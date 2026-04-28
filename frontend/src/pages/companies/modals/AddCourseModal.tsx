import { X } from "lucide-react";
import type { CourseGroup } from "../modals/CourseManagerModal";

interface AddCourseModalProps {
  onClose: () => void;
  isClosing: boolean;
  addCourseGroupName: string;
  onAddCourseGroupNameChange: (name: string) => void;
  addCourseGroup: CourseGroup | null;
  addCourseSelection: Set<string>;
  onToggleAddCourseSelectionItem: (name: string, checked: boolean) => void;
  onSave: () => void;
  courseGroups: CourseGroup[];
}

export function AddCourseModal({
  onClose,
  isClosing,
  addCourseGroupName,
  onAddCourseGroupNameChange,
  addCourseGroup,
  addCourseSelection,
  onToggleAddCourseSelectionItem,
  onSave,
  courseGroups,
}: AddCourseModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[202] animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[203] flex flex-col transform transition-transform duration-300 ease-out ${
          isClosing ? "translate-x-full" : "translate-x-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="과정 추가"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="text-xl font-bold text-slate-900">과정 추가</h3>
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              과정 구분
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
              value={addCourseGroupName}
              onChange={(event) => {
                onAddCourseGroupNameChange(event.target.value);
              }}
            >
              {courseGroups.map((group) => (
                <option key={group.id} value={group.name}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">세부 과정 선택</p>
            <div className="grid gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
              {addCourseGroup?.details.map((detail) => (
                <label key={detail.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 cursor-pointer transition-all duration-200">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all duration-200"
                    checked={addCourseSelection.has(detail.name)}
                    onChange={(event) =>
                      onToggleAddCourseSelectionItem(
                        detail.name,
                        event.target.checked,
                      )
                    }
                  />
                  <span className="text-sm font-medium text-slate-700">{detail.name}</span>
                </label>
              ))}
              {(!addCourseGroup?.details || addCourseGroup.details.length === 0) && (
                <p className="text-center py-8 text-slate-400 text-sm">등록된 세부 과정이 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all duration-200"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:shadow-none"
            disabled={addCourseSelection.size === 0}
            onClick={onSave}
          >
            저장
          </button>
        </div>
      </div>
    </>
  );
}
