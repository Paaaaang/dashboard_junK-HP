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
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="과정 관리"
    >
      <div className="modal-panel course-manager-panel">
        <div className="modal-header">
          <h3>과정 관리</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="icon-sm" />
          </button>
        </div>

        <div className="modal-content course-manager-layout">
          <aside className="course-tree-panel">
            <div className="course-tree-head">
              <p className="course-tree-title">과정 구분</p>
              <button
                type="button"
                className="btn btn-ghost course-tree-add"
                onClick={onStartCreateGroup}
              >
                <Plus className="icon-sm" />
                <span>새 과정 구분 추가</span>
              </button>
            </div>

            <div className="course-tree-list">
              {courseGroups.map((group) => {
                const isSelected = group.id === managerSelectedGroupId;
                const isExpanded = managerExpandedGroups.has(group.id);

                return (
                  <div
                    key={group.id}
                    className={`course-tree-group${isSelected ? " active" : ""}`}
                  >
                    <button
                      type="button"
                      className="course-tree-group-select"
                      onClick={() => onSelectGroup(group.id)}
                    >
                      <div className="course-tree-group-select-left">
                        <span
                          className="course-tree-group-toggle"
                          onClick={(e) => onToggleGroup(group.id, e)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="icon-sm" />
                          ) : (
                            <ChevronRight className="icon-sm" />
                          )}
                        </span>
                        <span>{group.name}</span>
                      </div>
                    </button>
                    {isExpanded && (
                      <ul className="course-tree-detail-list">
                        {group.details.map((detail) => (
                          <li
                            key={detail.id}
                            className="course-tree-detail-item"
                          >
                            <span className="course-tree-detail-name">
                              {detail.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="course-editor-panel">
            <div className="course-editor-header">
              <h4 className="course-editor-title">
                {managerGroupForm.name || "새 과정 구분"}
              </h4>
              <button
                type="button"
                className="course-delete-btn"
                disabled={!managerSelectedGroupId}
                onClick={() =>
                  managerSelectedGroupId &&
                  onDeleteGroupClick(managerSelectedGroupId)
                }
                aria-label="과정 구분 삭제"
              >
                <Trash2 className="icon-sm" />
              </button>
            </div>

            <div className="course-editor-body">
              {managerError && (
                <p className="form-error-message">{managerError}</p>
              )}
              {managerMessage && (
                <p className="form-success-message">{managerMessage}</p>
              )}

              <label className="field">
                과정 구분 이름
                <input
                  value={managerGroupForm.name}
                  onChange={(event) =>
                    onGroupNameChange(event.target.value)
                  }
                  placeholder="예: 훈련비과정"
                />
              </label>

              <hr className="course-editor-divider" />

              <div>
                <p
                  className="course-section-label"
                  style={{ marginBottom: 8 }}
                >
                  대상
                </p>
                <div className="course-target-grid">
                  {audienceOptions.map((option) => (
                    <label key={option} className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={managerGroupForm.audiences.includes(
                          option,
                        )}
                        onChange={() => onToggleAudience(option)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <hr className="course-editor-divider" />

              <div>
                <p
                  className="course-section-label"
                  style={{ marginBottom: 8 }}
                >
                  세부 과정
                </p>
                <table className="course-detail-table">
                  <colgroup>
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "38%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "8%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>과정명</th>
                      <th>진행일</th>
                      <th>시간</th>
                      <th>목표</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
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
                          <tr
                            key={detail.id}
                            className="course-detail-edit-row"
                          >
                            <td>
                              <input
                                value={managerDetailForm.name}
                                onChange={(event) =>
                                  onDetailFormChange("name", event.target.value)
                                }
                                placeholder="과정명"
                              />
                            </td>
                            <td>
                              <div className="date-range-cell">
                                <input
                                  type="date"
                                  value={managerDetailForm.startDate}
                                  onChange={(event) =>
                                    onDetailFormChange("startDate", event.target.value)
                                  }
                                />
                                <span>~</span>
                                <input
                                  type="date"
                                  value={managerDetailForm.endDate}
                                  onChange={(event) =>
                                    onDetailFormChange("endDate", event.target.value)
                                  }
                                />
                              </div>
                              {autoDays && (
                                <div className="days-badge-line">
                                  ({autoDays}일)
                                </div>
                              )}
                            </td>
                            <td>
                              <input
                                type="number"
                                min={1}
                                value={managerDetailForm.totalHours}
                                onChange={(event) =>
                                  onDetailFormChange("totalHours", event.target.value)
                                }
                                placeholder="시간"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min={1}
                                value={managerDetailForm.targetOutcome}
                                onChange={(event) =>
                                  onDetailFormChange("targetOutcome", event.target.value)
                                }
                                placeholder="목표"
                              />
                            </td>
                            <td>
                              <div className="course-table-edit-actions">
                                <button
                                  type="button"
                                  className="section-icon-btn save"
                                  onClick={onApplyDetailDraft}
                                  aria-label="확인"
                                >
                                  <Check className="icon-sm" />
                                </button>
                                <button
                                  type="button"
                                  className="section-icon-btn cancel"
                                  onClick={onCancelDetailEdit}
                                  aria-label="취소"
                                >
                                  <X className="icon-sm" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={detail.id}
                          className="course-detail-view-row"
                          onClick={() =>
                            onStartEditDetail(
                              managerSelectedGroupId ?? "",
                              detail.id,
                            )
                          }
                        >
                          <td>{detail.name}</td>
                          <td>
                            {toDotDate(detail.startDate)} ~{" "}
                            {toDotDate(detail.endDate)}
                            {detail.durationDays > 0 && (
                              <span className="days-badge">
                                {" "}
                                ({detail.durationDays}일)
                              </span>
                            )}
                          </td>
                          <td>{detail.totalHours}시간</td>
                          <td>{detail.targetOutcome}명</td>
                          <td className="detail-delete-col">
                            <button
                              type="button"
                              className="detail-delete-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                onRemoveDetail(
                                  managerSelectedGroupId ?? "",
                                  detail.id,
                                );
                              }}
                              aria-label={`${detail.name} 삭제`}
                            >
                              <Trash2 className="icon-sm" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {managerEditingDetailId === addingNewDetailId &&
                      managerDetailForm && (
                        <tr className="course-detail-edit-row">
                          <td>
                            <input
                              value={managerDetailForm.name}
                              onChange={(event) =>
                                onDetailFormChange("name", event.target.value)
                              }
                              placeholder="과정명"
                              autoFocus
                            />
                          </td>
                          <td>
                            <div className="date-range-cell">
                              <input
                                type="date"
                                value={managerDetailForm.startDate}
                                onChange={(event) =>
                                  onDetailFormChange("startDate", event.target.value)
                                }
                              />
                              <span>~</span>
                              <input
                                type="date"
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
                                <div className="days-badge-line">
                                  ({d}일)
                                </div>
                              ) : null;
                            })()}
                          </td>
                          <td>
                            <input
                              type="number"
                              min={1}
                              value={managerDetailForm.totalHours}
                              onChange={(event) =>
                                onDetailFormChange("totalHours", event.target.value)
                              }
                              placeholder="시간"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={1}
                              value={managerDetailForm.targetOutcome}
                              onChange={(event) =>
                                onDetailFormChange("targetOutcome", event.target.value)
                              }
                              placeholder="목표"
                            />
                          </td>
                          <td>
                            <div className="course-table-edit-actions">
                              <button
                                type="button"
                                className="section-icon-btn save"
                                onClick={onApplyDetailDraft}
                                aria-label="확인"
                              >
                                <Check className="icon-sm" />
                              </button>
                              <button
                                type="button"
                                className="section-icon-btn cancel"
                                onClick={onCancelDetailEdit}
                                aria-label="취소"
                              >
                                <X className="icon-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                    {!managerEditingDetailId && (
                      <tr
                        className="course-detail-add-row"
                        onClick={onStartAddDetail}
                      >
                        <td colSpan={5}>
                          <span className="course-detail-add-hint">
                            <Plus className="icon-sm" />
                            <span>세부 과정 추가</span>
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="course-editor-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary"
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
