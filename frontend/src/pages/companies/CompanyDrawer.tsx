import { X, PencilLine, Check, Plus, Trash2, Info, Mail, ChevronUp, ChevronDown } from "lucide-react";
import type { CompanyRecord, CompanyParticipation } from "../../types/models";
import type { CourseGroup } from "./modals/CourseManagerModal";

interface SubCourseParticipant {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  completedCourses: number;
  totalCourses: number;
  completed: boolean;
}

interface SubCourseWithParticipants {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  participants: SubCourseParticipant[];
}

export type CourseParticipantsMap = Record<
  string,
  Record<string, SubCourseWithParticipants>
>;

interface CompanyDrawerProps {
  draftCompany: CompanyRecord;
  drawerEditMode: boolean;
  drawerNotice: string;
  drawerNameEditing: boolean;
  drawerNameDraft: string;
  expandedDrawerGroups: Set<string>;
  expandedSubCourses: Set<string>;
  addParticipantSubCourseId: string | null;
  addParticipantDraft: string;
  isSaving: boolean;
  isClosing: boolean;
  courseGroups: CourseGroup[];
  onDrawerClose: () => void;
  onDrawerNameEditToggle: (editing: boolean) => void;
  onDrawerNameDraftChange: (name: string) => void;
  onUpdateDraftField: (field: keyof CompanyRecord, value: any) => void;
  onEnterEditMode: () => void;
  onCancelEdit: () => void;
  onSaveDraftCompany: () => void;
  onOpenAddCourseModal: () => void;
  onToggleDrawerGroup: (groupName: string) => void;
  onToggleSubCourse: (id: string) => void;
  onRemoveCourseProgram: (courseType: string, programName: string) => void;
  onAddParticipantClick: (subCourseId: string) => void;
  onAddParticipantDraftChange: (val: string) => void;
  onConfirmAddParticipant: (subCourseId: string, groupId: string) => void;
  onCancelAddParticipant: () => void;
  onRemoveParticipant: (groupId: string, subCourseId: string, ptId: string) => void;
  onShowParticipantPopover: (pt: SubCourseParticipant, e: React.MouseEvent) => void;
  onHideParticipantPopover: () => void;
  onOpenEmailModal: (ids: string[]) => void;
  getSubCourseByName: (companyId: string, groupId: string, name: string) => SubCourseWithParticipants | undefined;
  toDotDate: (val: string | undefined) => string;
  getToday: () => string;
  formatBusinessRegNo: (val: string) => string;
}

export function CompanyDrawer({
  draftCompany,
  drawerEditMode,
  drawerNotice,
  drawerNameEditing,
  drawerNameDraft,
  expandedDrawerGroups,
  expandedSubCourses,
  addParticipantSubCourseId,
  addParticipantDraft,
  isSaving,
  isClosing,
  courseGroups,
  onDrawerClose,
  onDrawerNameEditToggle,
  onDrawerNameDraftChange,
  onUpdateDraftField,
  onEnterEditMode,
  onCancelEdit,
  onSaveDraftCompany,
  onOpenAddCourseModal,
  onToggleDrawerGroup,
  onToggleSubCourse,
  onRemoveCourseProgram,
  onAddParticipantClick,
  onAddParticipantDraftChange,
  onConfirmAddParticipant,
  onCancelAddParticipant,
  onRemoveParticipant,
  onShowParticipantPopover,
  onHideParticipantPopover,
  onOpenEmailModal,
  getSubCourseByName,
  toDotDate,
  getToday,
  formatBusinessRegNo,
}: CompanyDrawerProps) {
  return (
    <>
      <div
        className="drawer-overlay"
        onClick={() => {
          if (!drawerEditMode) onDrawerClose();
        }}
      />
      <div
        className={`drawer-panel${isClosing ? " closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="기업 상세 정보"
      >
        <div className="drawer-header">
          <div className="drawer-title-stack">
            {drawerNameEditing ? (
              <input
                className="drawer-name-input"
                value={drawerNameDraft}
                onChange={(event) => onDrawerNameDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onUpdateDraftField("companyName", drawerNameDraft);
                    onDrawerNameEditToggle(false);
                  } else if (event.key === "Escape") {
                    onDrawerNameEditToggle(false);
                  }
                }}
                onBlur={() => {
                  onUpdateDraftField("companyName", drawerNameDraft);
                  onDrawerNameEditToggle(false);
                }}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="drawer-name-btn"
                onClick={() => {
                  onDrawerNameDraftChange(draftCompany.companyName);
                  onDrawerNameEditToggle(true);
                }}
                aria-label="기업명 편집"
              >
                <h3>{draftCompany.companyName || "신규 기업"}</h3>
                <PencilLine className="drawer-name-edit-icon" />
              </button>
            )}
            <p>기업 상세 정보</p>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={onDrawerClose}
            aria-label="닫기"
          >
            <X className="icon-sm" />
          </button>
        </div>

        <div className="drawer-content">
          {drawerNotice && <p className="drawer-notice">{drawerNotice}</p>}

          <section className="drawer-section">
            <div className="drawer-section-header">
              <h4>기본 정보</h4>
              {drawerEditMode && (
                <div className="section-edit-actions">
                  <button
                    type="button"
                    className="section-icon-btn save"
                    onClick={() => onUpdateDraftField("companyName", draftCompany.companyName)} // Just to trigger some refresh or use another flag
                    aria-label="편집 완료"
                  >
                    <Check className="icon-sm" />
                  </button>
                  <button
                    type="button"
                    className="section-icon-btn cancel"
                    onClick={onCancelEdit}
                    aria-label="편집 취소"
                  >
                    <X className="icon-sm" />
                  </button>
                </div>
              )}
            </div>

            <div
              className={`drawer-info-grid ${drawerEditMode ? "edit-mode" : ""}`}
              onDoubleClick={() => !drawerEditMode && onEnterEditMode()}
            >
              <div className="drawer-info-item drawer-info-full">
                <span>기업명</span>
                {drawerEditMode ? (
                  <input
                    className="inline-edit-input"
                    value={draftCompany.companyName}
                    onChange={(event) =>
                      onUpdateDraftField("companyName", event.target.value)
                    }
                    placeholder="기업명"
                  />
                ) : (
                  <strong>{draftCompany.companyName || "-"}</strong>
                )}
              </div>
              <div className="drawer-info-item">
                <span>사업자번호</span>
                {drawerEditMode ? (
                  <input
                    className="inline-edit-input"
                    value={draftCompany.businessRegNo}
                    onChange={(event) =>
                      onUpdateDraftField(
                        "businessRegNo",
                        formatBusinessRegNo(event.target.value),
                      )
                    }
                    placeholder="사업자번호"
                  />
                ) : (
                  <strong>{draftCompany.businessRegNo || "-"}</strong>
                )}
              </div>
              <div className="drawer-info-item">
                <span>대표명</span>
                {drawerEditMode ? (
                  <input
                    className="inline-edit-input"
                    value={draftCompany.representative}
                    onChange={(event) =>
                      onUpdateDraftField("representative", event.target.value)
                    }
                    placeholder="대표명"
                  />
                ) : (
                  <strong>{draftCompany.representative || "-"}</strong>
                )}
              </div>
              <div className="drawer-info-item drawer-info-full">
                <span>소재지</span>
                {drawerEditMode ? (
                  <input
                    className="inline-edit-input"
                    value={draftCompany.location}
                    onChange={(event) =>
                      onUpdateDraftField("location", event.target.value)
                    }
                    placeholder="소재지"
                  />
                ) : (
                  <strong>{draftCompany.location || "-"}</strong>
                )}
              </div>
              <div className="drawer-info-item">
                <span>담당자</span>
                {drawerEditMode ? (
                  <input
                    className="inline-edit-input"
                    value={draftCompany.manager}
                    onChange={(event) =>
                      onUpdateDraftField("manager", event.target.value)
                    }
                    placeholder="담당자"
                  />
                ) : (
                  <strong>{draftCompany.manager || "-"}</strong>
                )}
              </div>
              <div className="drawer-info-item">
                <span>연락처</span>
                {drawerEditMode ? (
                  <input
                    className="inline-edit-input"
                    value={draftCompany.phone}
                    onChange={(event) =>
                      onUpdateDraftField("phone", event.target.value)
                    }
                    placeholder="연락처"
                  />
                ) : (
                  <strong>{draftCompany.phone || "-"}</strong>
                )}
              </div>
              <div className="drawer-info-item drawer-info-full">
                <span>이메일</span>
                {drawerEditMode ? (
                  <input
                    className="inline-edit-input"
                    type="email"
                    value={draftCompany.email}
                    onChange={(event) =>
                      onUpdateDraftField("email", event.target.value)
                    }
                    placeholder="이메일"
                  />
                ) : (
                  <strong>{draftCompany.email || "-"}</strong>
                )}
              </div>
              <div className="drawer-info-item">
                <span>협약서 여부</span>
                {drawerEditMode ? (
                  <label className="inline-checkbox-label">
                    <input
                      type="checkbox"
                      checked={draftCompany.mouSigned}
                      onChange={(event) => {
                        onUpdateDraftField("mouSigned", event.target.checked);
                        if (!event.target.checked) {
                          onUpdateDraftField("mouSignedDate", "");
                        } else if (!draftCompany.mouSignedDate) {
                          onUpdateDraftField("mouSignedDate", getToday());
                        }
                      }}
                    />
                    체결
                  </label>
                ) : (
                  <strong>
                    {draftCompany.mouSigned ? "체결" : "미체결"}
                  </strong>
                )}
              </div>
              {draftCompany.mouSigned && (
                <div className="drawer-info-item">
                  <span>체결일</span>
                  {drawerEditMode ? (
                    <input
                      className="inline-edit-input"
                      type="date"
                      value={draftCompany.mouSignedDate ?? ""}
                      onChange={(event) =>
                        onUpdateDraftField(
                          "mouSignedDate",
                          event.target.value,
                        )
                      }
                    />
                  ) : (
                    <strong>{toDotDate(draftCompany.mouSignedDate)}</strong>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="drawer-section">
            <div className="drawer-section-header">
              <h4>교육 과정 현황</h4>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onOpenAddCourseModal}
              >
                <Plus className="icon-sm" />
                <span>과정 추가</span>
              </button>
            </div>

            <div className="drawer-course-groups">
              {courseGroups.map((group) => {
                const participation = draftCompany.participations.find(
                  (item: CompanyParticipation) => item.courseType === group.name,
                ) ?? {
                  courseType: group.name,
                  enabled: false,
                  programNames: [],
                  status: "미참여" as const,
                };

                const count = participation.programNames.length;
                const expanded = expandedDrawerGroups.has(group.name);

                const groupEmoji =
                  group.name === "훈련비과정"
                    ? "🟢"
                    : group.name === "지원비과정"
                      ? "🔵"
                      : "🟡";

                const headerLabel =
                  count > 0
                    ? `${groupEmoji} ${group.name} (${count}개 참여)`
                    : `${groupEmoji} ${group.name} (미참여)`;

                return (
                  <div key={group.id} className="drawer-course-group">
                    <button
                      type="button"
                      className="drawer-course-group-header"
                      onClick={() => onToggleDrawerGroup(group.name)}
                    >
                      <span>{headerLabel}</span>
                      {expanded ? (
                        <ChevronUp className="icon-sm" />
                      ) : (
                        <ChevronDown className="icon-sm" />
                      )}
                    </button>

                    {expanded && (
                      <div className="drawer-course-group-body">
                        {count === 0 && (
                          <p className="drawer-course-empty">
                            참여 중인 세부 과정이 없습니다.
                          </p>
                        )}

                        {participation.programNames.map((programName: string) => {
                          const detail = group.details.find(
                            (item) => item.name === programName,
                          );
                          const subCourse = getSubCourseByName(
                            draftCompany.id,
                            group.id,
                            programName,
                          );
                          const subCourseId = subCourse?.id ?? `sc-${group.id}-${programName}`;
                          const subExpanded = expandedSubCourses.has(subCourseId);
                          const participantCount = subCourse?.participants.length ?? 0;

                          const startDate = subCourse?.startDate ?? detail?.startDate;
                          const endDate = subCourse?.endDate ?? detail?.endDate;
                          const totalHours = subCourse?.totalHours ?? detail?.totalHours ?? 0;

                          return (
                            <div key={`${group.id}-${programName}`}>
                              <button
                                type="button"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "8px 10px",
                                  borderRadius: 8,
                                  cursor: "pointer",
                                  background: subExpanded ? "#f0fdf4" : "transparent",
                                  transition: "background 0.15s ease-out",
                                  width: "100%",
                                  border: "none",
                                  textAlign: "left"
                                }}
                                onClick={() => onToggleSubCourse(subCourseId)}
                                aria-expanded={subExpanded}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                                  <span style={{ color: "var(--color-text-tertiary)", fontSize: 12, flexShrink: 0 }}>
                                    {subExpanded ? "▾" : "▸"}
                                  </span>
                                  <span style={{ fontWeight: 500, fontSize: 13, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {programName}
                                  </span>
                                  <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", whiteSpace: "nowrap", flexShrink: 0 }}>
                                    {startDate && endDate
                                      ? ` ${toDotDate(startDate)}~${toDotDate(endDate)} · ${totalHours}h · 참여 ${participantCount}명`
                                      : ` · 참여 ${participantCount}명`}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="course-remove-icon-btn"
                                  style={{ flexShrink: 0 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveCourseProgram(group.name, programName);
                                  }}
                                  aria-label={`${programName} 제거`}
                                >
                                  <Trash2 className="icon-sm" />
                                </button>
                              </button>

                              {subExpanded && (
                                <div style={{ padding: "4px 0 8px 24px" }}>
                                  {(subCourse?.participants ?? []).length === 0 && (
                                    <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: "4px 0" }}>
                                      참여자가 없습니다.
                                    </p>
                                  )}
                                  {(subCourse?.participants ?? []).map((participant) => (
                                    <div
                                      key={participant.id}
                                      className="participant-row"
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "5px 8px",
                                        borderRadius: 6,
                                        transition: "background 0.12s ease-out",
                                      }}
                                      onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                                        const delBtn = e.currentTarget.querySelector<HTMLButtonElement>(".participant-del-btn");
                                        if (delBtn) delBtn.style.opacity = "1";
                                      }}
                                      onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = "transparent";
                                        const delBtn = e.currentTarget.querySelector<HTMLButtonElement>(".participant-del-btn");
                                        if (delBtn) delBtn.style.opacity = "0";
                                      }}
                                    >
                                      <span style={{ fontSize: 13, color: "var(--color-text-primary)", fontWeight: 500 }}>
                                        {participant.name}
                                      </span>
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          width: 16,
                                          height: 16,
                                          borderRadius: "50%",
                                          border: "1px solid var(--color-border-strong)",
                                          color: "var(--color-text-tertiary)",
                                          cursor: "pointer",
                                          flexShrink: 0,
                                          fontSize: 10,
                                        }}
                                        onMouseEnter={(e) => onShowParticipantPopover(participant, e)}
                                        onMouseLeave={onHideParticipantPopover}
                                      >
                                        <Info style={{ width: 10, height: 10 }} />
                                      </span>
                                      <span
                                        style={{
                                          fontSize: 11,
                                          padding: "1px 6px",
                                          borderRadius: "999px",
                                          background: participant.completed ? "#dcfce7" : "#f1f5f9",
                                          color: participant.completed ? "#166534" : "var(--color-text-tertiary)",
                                          fontWeight: 500,
                                          flexShrink: 0,
                                        }}
                                      >
                                        {participant.completed ? "수료" : "미수료"}
                                      </span>
                                      <button
                                        type="button"
                                        className="participant-del-btn"
                                        style={{
                                          marginLeft: "auto",
                                          border: 0,
                                          background: "transparent",
                                          color: "var(--color-error)",
                                          cursor: "pointer",
                                          opacity: 0,
                                          transition: "opacity 0.12s ease-out",
                                          display: "flex",
                                          alignItems: "center",
                                          padding: "2px 4px",
                                          borderRadius: 4,
                                          fontSize: 11,
                                        }}
                                        onClick={() =>
                                          onRemoveParticipant(
                                            group.id,
                                            subCourseId,
                                            participant.id,
                                          )
                                        }
                                        aria-label={`${participant.name} 삭제`}
                                      >
                                        <Trash2 style={{ width: 12, height: 12 }} />
                                      </button>
                                    </div>
                                  ))}

                                  {addParticipantSubCourseId === subCourseId ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px" }}>
                                      <input
                                        autoFocus
                                        style={{
                                          flex: 1,
                                          border: "1px solid var(--color-border-strong)",
                                          borderRadius: 6,
                                          padding: "4px 8px",
                                          fontSize: 13,
                                          outline: "none",
                                        }}
                                        value={addParticipantDraft}
                                        onChange={(e) => onAddParticipantDraftChange(e.target.value)}
                                        placeholder="이름 입력"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            onConfirmAddParticipant(subCourseId, group.id);
                                          } else if (e.key === "Escape") {
                                            onCancelAddParticipant();
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        className="section-icon-btn save"
                                        onClick={() => onConfirmAddParticipant(subCourseId, group.id)}
                                      >
                                        <Check className="icon-sm" />
                                      </button>
                                      <button
                                        type="button"
                                        className="section-icon-btn cancel"
                                        onClick={onCancelAddParticipant}
                                      >
                                        <X className="icon-sm" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        background: "transparent",
                                        border: "none",
                                        color: "var(--color-primary)",
                                        fontSize: 12,
                                        cursor: "pointer",
                                        padding: "4px 8px",
                                        borderRadius: 6,
                                        marginTop: 2,
                                      }}
                                      onClick={() => onAddParticipantClick(subCourseId)}
                                    >
                                      <Plus style={{ width: 12, height: 12 }} />
                                      참여자 추가
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="drawer-footer">
          {drawerEditMode ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancelEdit}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSaveDraftCompany}
                disabled={isSaving}
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onOpenEmailModal([draftCompany.id])}
              >
                <Mail className="icon-sm" />
                <span>이메일 발송</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onDrawerClose}
              >
                닫기
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
