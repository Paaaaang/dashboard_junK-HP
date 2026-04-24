import { X, Upload, PlusCircle, ChevronRight } from "lucide-react";

interface AddCompanyModalProps {
  onClose: () => void;
  onUploadClick: () => void;
  onCreateDrawerClick: () => void;
}

export function AddCompanyModal({
  onClose,
  onUploadClick,
  onCreateDrawerClick,
}: AddCompanyModalProps) {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="기업 추가 방식 선택"
    >
      <div className="modal-panel modal-panel-sm">
        <div className="modal-header">
          <h3>기업 추가</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="icon-sm" />
          </button>
        </div>
        <div className="modal-content choice-modal-body">
          <button
            type="button"
            className="choice-btn"
            onClick={onUploadClick}
          >
            <Upload className="choice-icon" />
            <span className="choice-label">업로드</span>
            <span className="choice-desc">엑셀 파일로 일괄 등록</span>
            <ChevronRight className="choice-arrow" />
          </button>
          <button
            type="button"
            className="choice-btn"
            onClick={onCreateDrawerClick}
          >
            <PlusCircle className="choice-icon" />
            <span className="choice-label">직접 입력</span>
            <span className="choice-desc">
              사이드 드로어에서 기업 정보를 입력
            </span>
            <ChevronRight className="choice-arrow" />
          </button>
        </div>
      </div>
    </div>
  );
}
