import { X, Plus, ChevronRight, ChevronDown, Trash2, Check } from "lucide-react";

export type AudienceOption =
  | "재직자 (고용보험 가입)"
  | "재직자 (고용보험 미가입)"
  | "기업 대표"
  | "임원"
  | "미래인재";

export interface CourseDetail {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  totalHours: number;
  targetOutcome: number;
}

export interface CourseGroup {
  id: string;
  name: string;
  audiences: AudienceOption[];
  details: CourseDetail[];
}

export interface CourseGroupForm {
  name: string;
  audiences: AudienceOption[];
  details: CourseDetail[];
}

export interface CourseDetailDraft {
  name: string;
  startDate: string;
  endDate: string;
  durationDays: string;
  totalHours: string;
  targetOutcome: string;
}

interface CourseManagerModalProps {
  onClose: () => void;
  courseGroups: CourseGroup[];
  managerSelectedGroupId: string | null;
  managerExpandedGroups: Set<string>;
  managerGroupForm: CourseGroupForm;
  managerDetailForm: CourseDetailDraft | null;
  managerEditingDetailId: string | null;
  managerError: string;
  managerMessage: string;
  audienceOptions: AudienceOption[];
  addingNewDetailId: string;
  isManagerGroupModified: boolean;
  onSelectGroup: (id: string) => void;
  onStartCreateGroup: () => void;
  onToggleGroup: (id: string, e: React.MouseEvent) => void;
  onDeleteGroupClick: (id: string) => void;
  onGroupNameChange: (name: string) => void;
  onToggleAudience: (target: AudienceOption) => void;
  onStartAddDetail: () => void;
  onStartEditDetail: (groupId: string, detailId: string) => void;
  onRemoveDetail: (groupId: string, detailId: string) => void;
  onDetailFormChange: (field: keyof CourseDetailDraft, value: string) => void;
  onApplyDetailDraft: () => void;
  onCancelDetailEdit: () => void;
  onSaveGroup: () => void;
  calculateDurationDays: (start: string, end: string) => number | null;
  toDotDate: (val: string | undefined) => string;
}

export function CourseManagerModal({
  onClose,
  courseGroups,
  managerSelectedGroupId,
  managerExpandedGroups,
  managerGroupForm,
  managerDetailForm,
  managerEditingDetailId,
  managerError,
  managerMessage,
  audienceOptions,
  addingNewDetailId,
  isManagerGroupModified,
  onSelectGroup,
  onStartCreateGroup,
  onToggleGroup,
  onDeleteGroupClick,
  onGroupNameChange,
  onToggleAudience,
  onStartAddDetail,
  onStartEditDetail,
  onRemoveDetail,
  onDetailFormChange,
  onApplyDetailDraft,
  onCancelDetailEdit,
  onSaveGroup,
  calculateDurationDays,
  toDotDate,
}: CourseManagerModalProps) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="과정 관리"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[32px] shadow-2xl flex flex-col w-full max-w-[1100px] max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="text-xl font-bold text-slate-900">과정 관리</h3>
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <aside className="w-[320px] border-r border-slate-100 bg-slate-50/50 flex flex-col">
            <div className="p-6 space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">과정 구분</p>
              <button
                type="button"
                className="w-full py-3 px-4 bg-white border border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                onClick={onStartCreateGroup}
              >
                <Plus className="w-4 h-4" />
                <span>새 과정 구분 추가</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
              {courseGroups.map((group) => {
                const isSelected = group.id === managerSelectedGroupId;
                const isExpanded = managerExpandedGroups.has(group.id);

                return (
                  <div key={group.id} className="space-y-1">
                    <button
                      type="button"
                      className={`w-full flex items-center gap-2 p-3 rounded-xl transition-all duration-200 ${
                        isSelected 
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                          : "text-slate-600 hover:bg-white hover:shadow-sm"
                      }`}
                      onClick={() => onSelectGroup(group.id)}
                    >
                      <div 
                        className={`p-1 rounded-md transition-colors ${isSelected ? "text-emerald-100 hover:bg-emerald-500" : "text-slate-400 hover:bg-slate-100"}`}
                        onClick={(e) => onToggleGroup(group.id, e)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                      <span className="flex-1 text-left font-bold truncate">{group.name}</span>
                    </button>
                    {isExpanded && (
                      <ul className="ml-9 space-y-1 pr-2">
                        {group.details.map((detail) => (
                          <li
                            key={detail.id}
                            className="text-sm py-2 px-3 text-slate-500 bg-white/50 rounded-lg border border-transparent hover:border-emerald-100 hover:text-emerald-600 transition-all truncate"
                          >
                            {detail.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h4 className="text-lg font-bold text-slate-900 truncate mr-4">
                {managerGroupForm.name || "새 과정 구분"}
              </h4>
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:hover:bg-transparent"
                disabled={!managerSelectedGroupId}
                onClick={() =>
                  managerSelectedGroupId &&
                  onDeleteGroupClick(managerSelectedGroupId)
                }
                aria-label="과정 구분 삭제"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {(managerError || managerMessage) && (
                <div className={`p-4 rounded-2xl border ${
                  managerError ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                } text-sm font-semibold`}>
                  {managerError || managerMessage}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    과정 구분 이름
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                    value={managerGroupForm.name}
                    onChange={(event) =>
                      onGroupNameChange(event.target.value)
                    }
                    placeholder="예: 훈련비과정"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">대상</p>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {audienceOptions.map((option) => (
                      <label key={option} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 cursor-pointer transition-all duration-200">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all duration-200"
                          checked={managerGroupForm.audiences.includes(
                            option,
                          )}
                          onChange={() => onToggleAudience(option)}
                        />
                        <span className="text-sm font-medium text-slate-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">세부 과정</p>
                  <div className="border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">과정명</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">진행일</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">시간</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">목표</th>
                          <th className="px-6 py-4 w-20" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {managerGroupForm.details.map((detail) => {
                          const isRowEditing =
                            managerEditingDetailId === detail.id &&
                            managerDetailForm;

                          if (isRowEditing) {
                            const autoDays = calculateDurationDays(
                              managerDetailForm.startDate,
                              managerDetailForm.endDate,
                            );
                            return (
                              <tr key={detail.id} className="bg-emerald-50/30">
                                <td className="px-4 py-3">
                                  <input
                                    className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                                    value={managerDetailForm.name}
                                    onChange={(event) =>
                                      onDetailFormChange("name", event.target.value)
                                    }
                                    placeholder="과정명"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="date"
                                        className="px-2 py-1.5 rounded-lg border border-emerald-200 text-xs focus:outline-none"
                                        value={managerDetailForm.startDate}
                                        onChange={(event) =>
                                          onDetailFormChange("startDate", event.target.value)
                                        }
                                      />
                                      <span className="text-slate-400">~</span>
                                      <input
                                        type="date"
                                        className="px-2 py-1.5 rounded-lg border border-emerald-200 text-xs focus:outline-none"
                                        value={managerDetailForm.endDate}
                                        onChange={(event) =>
                                          onDetailFormChange("endDate", event.target.value)
                                        }
                                      />
                                    </div>
                                    {autoDays && (
                                      <span className="text-[10px] font-bold text-emerald-600 ml-1">({autoDays}일)</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    className="w-20 mx-auto px-3 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-center"
                                    min={1}
                                    value={managerDetailForm.totalHours}
                                    onChange={(event) =>
                                      onDetailFormChange("totalHours", event.target.value)
                                    }
                                    placeholder="시간"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    className="w-20 mx-auto px-3 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-center"
                                    min={1}
                                    value={managerDetailForm.targetOutcome}
                                    onChange={(event) =>
                                      onDetailFormChange("targetOutcome", event.target.value)
                                    }
                                    placeholder="목표"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1 justify-center">
                                    <button
                                      type="button"
                                      className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                      onClick={onApplyDetailDraft}
                                      aria-label="확인"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                                      onClick={onCancelDetailEdit}
                                      aria-label="취소"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr
                              key={detail.id}
                              className="group hover:bg-slate-50/50 cursor-pointer transition-colors"
                              onClick={() =>
                                onStartEditDetail(
                                  managerSelectedGroupId ?? "",
                                  detail.id,
                                )
                              }
                            >
                              <td className="px-6 py-4 text-sm font-bold text-slate-900">{detail.name}</td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-900">{toDotDate(detail.startDate)}</span>
                                  <span className="text-slate-300">~</span>
                                  <span className="font-medium text-slate-900">{toDotDate(detail.endDate)}</span>
                                  {detail.durationDays > 0 && (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md uppercase tracking-wider">
                                      {detail.durationDays}일
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 font-medium text-center">{detail.totalHours}시간</td>
                              <td className="px-6 py-4 text-sm text-slate-600 font-medium text-center">{detail.targetOutcome}명</td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  type="button"
                                  className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onRemoveDetail(
                                      managerSelectedGroupId ?? "",
                                      detail.id,
                                    );
                                  }}
                                  aria-label={`${detail.name} 삭제`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {managerEditingDetailId === addingNewDetailId &&
                          managerDetailForm && (
                            <tr className="bg-emerald-50/30">
                              <td className="px-4 py-3">
                                <input
                                  className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                                  value={managerDetailForm.name}
                                  onChange={(event) =>
                                    onDetailFormChange("name", event.target.value)
                                  }
                                  placeholder="과정명"
                                  autoFocus
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="date"
                                      className="px-2 py-1.5 rounded-lg border border-emerald-200 text-xs focus:outline-none"
                                      value={managerDetailForm.startDate}
                                      onChange={(event) =>
                                        onDetailFormChange("startDate", event.target.value)
                                      }
                                    />
                                    <span className="text-slate-400">~</span>
                                    <input
                                      type="date"
                                      className="px-2 py-1.5 rounded-lg border border-emerald-200 text-xs focus:outline-none"
                                      value={managerDetailForm.endDate}
                                      onChange={(event) =>
                                        onDetailFormChange("endDate", event.target.value)
                                      }
                                    />
                                  </div>
                                  {(() => {
                                    const d = calculateDurationDays(
                                      managerDetailForm.startDate,
                                      managerDetailForm.endDate,
                                    );
                                    return d ? (
                                      <span className="text-[10px] font-bold text-emerald-600 ml-1">({d}일)</span>
                                    ) : null;
                                  })()}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  className="w-20 mx-auto px-3 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-center"
                                  min={1}
                                  value={managerDetailForm.totalHours}
                                  onChange={(event) =>
                                    onDetailFormChange("totalHours", event.target.value)
                                  }
                                  placeholder="시간"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  className="w-20 mx-auto px-3 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-center"
                                  min={1}
                                  value={managerDetailForm.targetOutcome}
                                  onChange={(event) =>
                                    onDetailFormChange("targetOutcome", event.target.value)
                                  }
                                  placeholder="목표"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 justify-center">
                                  <button
                                    type="button"
                                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                    onClick={onApplyDetailDraft}
                                    aria-label="확인"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                                    onClick={onCancelDetailEdit}
                                    aria-label="취소"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}

                        {!managerEditingDetailId && (
                          <tr
                            className="group hover:bg-emerald-50/50 cursor-pointer transition-colors"
                            onClick={onStartAddDetail}
                          >
                            <td colSpan={5} className="px-6 py-6 text-center">
                              <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">
                                <Plus className="w-4 h-4" />
                                <span>세부 과정 추가</span>
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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
                disabled={!isManagerGroupModified}
                onClick={onSaveGroup}
              >
                저장
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
