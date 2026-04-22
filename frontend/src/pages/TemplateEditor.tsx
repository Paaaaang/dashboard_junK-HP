import { useEffect, useState } from "react";
import { initialTemplates, templateVariables } from "../constants";
import { PageHeader } from "../components/PageHeader";
import { applyTemplateVariables } from "../utils/templateVariables";
import type { EmailTemplate, InsuranceTarget } from "../types/models";

export function TemplateEditorPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [activeTemplateId, setActiveTemplateId] = useState(
    initialTemplates[0].id,
  );
  const [draftTemplate, setDraftTemplate] = useState<EmailTemplate>(
    initialTemplates[0],
  );
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const selected = templates.find(
      (template) => template.id === activeTemplateId,
    );
    if (selected) {
      setDraftTemplate({ ...selected });
      setSavedMessage("");
    }
  }, [activeTemplateId, templates]);

  function saveTemplate() {
    setTemplates((current) =>
      current.map((template) =>
        template.id === draftTemplate.id ? { ...draftTemplate } : template,
      ),
    );
    setSavedMessage("템플릿이 저장되었습니다.");
  }

  function insertVariable(variable: string) {
    setDraftTemplate((current) => ({
      ...current,
      body: `${current.body}\n${variable}`.trim(),
    }));
  }

  const previewBody = applyTemplateVariables(draftTemplate.body, {
    companyName: "한빛테크",
    courseName: "스마트팩토리 실무 과정",
    deadline: "2026-05-02",
    contactPhone: "062-710-2896",
    managerName: "박소영",
  });

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

          <div className="template-editor-area">
            <div className="form-grid single-column">
              <label className="field">
                템플릿 이름
                <input
                  value={draftTemplate.name}
                  onChange={(event) =>
                    setDraftTemplate((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                대상자 구분
                <select
                  className="select-field"
                  value={draftTemplate.audience}
                  onChange={(event) =>
                    setDraftTemplate((current) => ({
                      ...current,
                      audience: event.target.value as InsuranceTarget,
                    }))
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
                    setDraftTemplate((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
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
                    setDraftTemplate((current) => ({
                      ...current,
                      body: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="template-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveTemplate}
              >
                저장
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
        </div>
      </section>
    </>
  );
}
