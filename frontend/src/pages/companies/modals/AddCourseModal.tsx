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
        className="drawer-overlay"
        style={{ zIndex: 202 }}
        onClick={onClose}
      />
      <div
        className={`drawer-panel${isClosing ? " closing" : ""}`}
        style={{ zIndex: 203 }}
        role="dialog"
        aria-modal="true"
        aria-label="과정 추가"
      >
        <div className="drawer-header">
          <h3>과정 추가</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="icon-sm" />
          </button>
        </div>

        <div className="drawer-content">
          <label className="field">
            과정 구분
            <select
              className="select-field"
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
          </label>

          <div className="add-course-checklist">
            <p className="add-course-title">세부 과정 선택</p>
            {addCourseGroup?.details.map((detail) => (
              <label key={detail.id} className="checkbox-field">
                <input
                  type="checkbox"
                  checked={addCourseSelection.has(detail.name)}
                  onChange={(event) =>
                    onToggleAddCourseSelectionItem(
                      detail.name,
                      event.target.checked,
                    )
                  }
                />
                {detail.name}
              </label>
            ))}
          </div>
        </div>

        <div className="drawer-footer">
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
