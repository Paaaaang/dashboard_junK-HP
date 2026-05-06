import { useEffect, useState } from "react";
import { templateVariables } from "../constants";
import { PageHeader } from "../components";
import { applyTemplateVariables } from "../utils/templateVariables";
import { useTemplateStore } from "../stores/useTemplateStore";
import { useToastStore } from "../stores/useToastStore";
import type { EmailTemplate, InsuranceTarget } from "../types/models";

export function TemplateEditorPage() {
  const { templates, isLoading, error, fetchTemplates, upsertTemplate, clearError } = useTemplateStore();
  const { addToast } = useToastStore();
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [draftTemplate, setDraftTemplate] = useState<EmailTemplate | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (templates.length > 0 && !activeTemplateId) {
      setActiveTemplateId(templates[0].id);
    }
  }, [templates, activeTemplateId]);

  useEffect(() => {
    const selected = templates.find(
      (template) => template.id === activeTemplateId,
    );
    if (selected) {
      setDraftTemplate({ ...selected });
      setSavedMessage("");
    }
  }, [activeTemplateId, templates]);

  useEffect(() => {
    if (error) {
      addToast(`에러: ${error}`, "error");
      clearError();
    }
  }, [error, addToast, clearError]);

  async function saveTemplate() {
    if (!draftTemplate) return;
    setIsSaving(true);
    try {
      await upsertTemplate(draftTemplate);
      addToast("템플릿이 저장되었습니다.", "success");
    } catch (err: any) {
      // Error handled by useEffect above
    } finally {
      setIsSaving(false);
    }
  }

  function insertVariable(variable: string) {
    if (!draftTemplate) return;
    setDraftTemplate((current) => current ? ({
      ...current,
      body: `${current.body}\n${variable}`.trim(),
    }) : null);
  }

  const previewBody = draftTemplate ? applyTemplateVariables(draftTemplate.body, {
    companyName: "한빛테크",
    courseName: "스마트팩토리 실무 과정",
    deadline: "2026-05-02",
    contactPhone: "062-710-2896",
    managerName: "박소영",
  }) : "";

  if (isLoading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="이메일 템플릿 관리" />

      <section aria-label="이메일 템플릿 편집 화면">
        <div className="template-layout">
          <aside className="template-list" aria-label="템플릿 목록">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={
                  template.id === activeTemplateId
                    ? "template-item template-item-active"
                    : "template-item"
                }
                onClick={() => setActiveTemplateId(template.id)}
              >
                <p className="template-item-title">{template.name}</p>
                <p className="template-item-meta">
                  대상:{" "}
                  {template.audience === "INSURED"
                    ? "고용보험 가입자"
                    : template.audience === "UNINSURED"
                      ? "미가입자"
                      : "전체"}
                </p>
              </button>
            ))}
          </aside>

          {draftTemplate ? (
            <div className="template-editor-area">
              <div className="form-grid single-column">
                <label className="field">
                  템플릿 이름
                  <input
                    value={draftTemplate.name}
                    onChange={(event) =>
                      setDraftTemplate((current) => current ? ({
                        ...current,
                        name: event.target.value,
                      }) : null)
                    }
                  />
                </label>

                <label className="field">
                  대상자 구분
                  <select
                    className="select-field"
                    value={draftTemplate.audience}
                    onChange={(event) =>
                      setDraftTemplate((current) => current ? ({
                        ...current,
                        audience: event.target.value as InsuranceTarget,
                      }) : null)
                    }
                  >
                    <option value="ALL">전체</option>
                    <option value="INSURED">고용보험 가입자</option>
                    <option value="UNINSURED">고용보험 미가입자</option>
                  </select>
                </label>

                <label className="field">
                  메일 제목
                  <input
                    value={draftTemplate.subject}
                    onChange={(event) =>
                      setDraftTemplate((current) => current ? ({
                        ...current,
                        subject: event.target.value,
                      }) : null)
                    }
                  />
                </label>

                <label className="field">
                  템플릿 변수
                  <div className="chip-row">
                    {templateVariables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        className="chip-btn"
                        onClick={() => insertVariable(variable)}
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="field">
                  본문
                  <textarea
                    className="template-textarea"
                    value={draftTemplate.body}
                    onChange={(event) =>
                      setDraftTemplate((current) => current ? ({
                        ...current,
                        body: event.target.value,
                      }) : null)
                    }
                  />
                </label>
              </div>

              <div className="template-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveTemplate}
                  disabled={isSaving}
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
                {savedMessage ? (
                  <span className="saved-message">{savedMessage}</span>
                ) : null}
              </div>

              <div className="template-preview">
                <h3>미리보기</h3>
                <p className="preview-subject">
                  제목:{" "}
                  {applyTemplateVariables(draftTemplate.subject, {
                    companyName: "한빛테크",
                    courseName: "스마트팩토리 실무 과정",
                    deadline: "2026-05-02",
                    contactPhone: "062-710-2896",
                    managerName: "박소영",
                  })}
                </p>
                <pre className="preview-body">{previewBody}</pre>
              </div>
            </div>
          ) : (
            <div className="template-editor-area flex items-center justify-center text-tertiary">
              템플릿을 선택해 주세요.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
