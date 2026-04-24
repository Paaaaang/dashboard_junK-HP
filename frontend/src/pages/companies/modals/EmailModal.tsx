import { X } from "lucide-react";
import type { EmailTemplate } from "../../../types/models";

interface EmailModalProps {
  onClose: () => void;
  emailRecipientIds: string[];
  selectedTemplateId: string;
  onTemplateChange: (id: string) => void;
  onSend: () => void;
  templates: EmailTemplate[];
}

export function EmailModal({
  onClose,
  emailRecipientIds,
  selectedTemplateId,
  onTemplateChange,
  onSend,
  templates,
}: EmailModalProps) {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="이메일 템플릿 선택"
    >
      <div className="modal-panel modal-panel-sm">
        <div className="modal-header">
          <h3>이메일 발송</h3>
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
          <p className="email-target-summary">
            {emailRecipientIds.length}개 기업 대상
          </p>
          <label className="field">
            템플릿 선택
            <select
              className="select-field"
              value={selectedTemplateId}
              onChange={(event) =>
                onTemplateChange(event.target.value)
              }
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="modal-footer">
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
            onClick={onSend}
          >
            발송
          </button>
        </div>
      </div>
    </div>
  );
}
