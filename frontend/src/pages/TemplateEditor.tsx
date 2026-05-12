import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { 
  Mail, Paperclip, Send, X, AlertCircle, Clock, Plus as PlusIcon, 
  Settings, Save, HelpCircle, RotateCcw, RotateCw, 
  Bold, Italic, Underline, Palette,
  Strikethrough, Link, Highlighter, Type, Baseline, ExternalLink
} from "lucide-react";
import { templateVariableMetadata } from "../constants";
import { PageHeader } from "../components";
import { applyTemplateVariables } from "../utils/templateVariables";
import { useTemplateStore } from "../stores/useTemplateStore";
import { useToastStore } from "../stores/useToastStore";
import { AttachmentUploader } from "../components/email/AttachmentUploader";
import type { EmailTemplate, InsuranceTarget, AttachmentMeta } from "../types/models";
import { toDotDate } from "./companies/utils/companyUtils";

export function TemplateEditorPage() {
  const { 
    templates, 
    logs,
    isLoading, 
    error,
    fetchTemplates, 
    upsertTemplate, 
    testEmail,
    fetchLogs,
    clearError,
    uploadAttachment,
    deleteAttachment
  } = useTemplateStore();
  const { addToast } = useToastStore();
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [draftTemplate, setDraftTemplate] = useState<EmailTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailAddr, setTestEmailAddr] = useState("");
  const [isTestSending, setIsTestSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "logs">("editor");

  // --- Logs Filter State ---
  const [logFilterStatus, setLogFilterStatus] = useState<string>("ALL");
  const [logFilterPeriod, setLogFilterPeriod] = useState<string>("ALL");

  // --- History & Editor State ---
  const [history, setHistory] = useState<EmailTemplate[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInternalUpdate = useRef(false);
  const historyTimeout = useRef<any>(null);

  /**
   * Textarea character coordinate calculation helper (Mirror Div technique)
   */
  const getCaretCoordinates = useCallback((element: HTMLTextAreaElement, position: number) => {
    const div = document.createElement('div');
    const style = window.getComputedStyle(element);
    
    const properties = [
      'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily',
      'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing',
      'tabSize', 'MozTabSize'
    ];

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordBreak = 'break-word';

    properties.forEach(prop => {
      (div.style as any)[prop] = (style as any)[prop];
    });

    div.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position, position + 1) || '.';
    div.appendChild(span);

    document.body.appendChild(div);
    const { offsetLeft: spanLeft, offsetTop: spanTop } = span;
    document.body.removeChild(div);

    const rect = element.getBoundingClientRect();

    return {
      top: rect.top + spanTop - element.scrollTop,
      left: rect.left + spanLeft - element.scrollLeft
    };
  }, []);

  // --- Floating Toolbar State ---
  const [selectionToolbar, setSelectionToolbar] = useState<{ x: number, y: number, show: boolean }>({ x: 0, y: 0, show: false });
  const [activeMenu, setActiveMenu] = useState<"color" | "font" | "size" | null>(null);

  const colors = [
    { name: "기본색", hex: "inherit", bg: "bg-[#0f172a]" },
    { name: "회색", hex: "#64748b", bg: "bg-[#64748b]" },
    { name: "갈색", hex: "#78350f", bg: "bg-[#78350f]" },
    { name: "주황색", hex: "#f97316", bg: "bg-[#f97316]" },
    { name: "노란색", hex: "#eab308", bg: "bg-[#eab308]" },
    { name: "초록색", hex: "#10b981", bg: "bg-[#10b981]" },
    { name: "파란색", hex: "#3b82f6", bg: "bg-[#3b82f6]" },
    { name: "보라색", hex: "#a855f7", bg: "bg-[#a855f7]" },
    { name: "분홍색", hex: "#ec4899", bg: "bg-[#ec4899]" },
    { name: "빨간색", hex: "#ef4444", bg: "bg-[#ef4444]" },
  ];

  const fonts = [
    { name: "고딕 (Sans)", value: "Pretendard, sans-serif" },
    { name: "명조 (Serif)", value: "Nanum Myeongjo, serif" },
    { name: "코딩 (Mono)", value: "Fira Code, monospace" },
  ];

  const fontSizes = [
    { label: "12px", value: "12px" },
    { label: "14px", value: "14px" },
    { label: "16px", value: "16px" },
    { label: "18px", value: "18px" },
    { label: "20px", value: "20px" },
    { label: "24px", value: "24px" },
  ];

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    const params: any = {};
    if (logFilterStatus !== "ALL") params.status = logFilterStatus;
    if (logFilterPeriod !== "ALL") params.period = logFilterPeriod;
    fetchLogs(params);
  }, [fetchLogs, logFilterStatus, logFilterPeriod]);

  useEffect(() => {
    if (templates.length > 0 && !activeTemplateId) {
      setActiveTemplateId(templates[0].id);
    }
  }, [templates, activeTemplateId]);

  // Load selected template into draft and initialize history
  useEffect(() => {
    const selected = templates.find(
      (template) => template.id === activeTemplateId,
    );
    if (selected && !isInternalUpdate.current) {
      const initial = { ...selected, attachments: selected.attachments || [] };
      setDraftTemplate(initial);
      setHistory([initial]);
      setHistoryIndex(0);
    }
    isInternalUpdate.current = false;
  }, [activeTemplateId, templates]);

  useEffect(() => {
    if (error) {
      addToast(`에러: ${error}`, "error");
      clearError();
    }
  }, [error, addToast, clearError]);

  // History Helpers
  const pushHistory = useCallback((newTemplate: EmailTemplate) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      if (newHistory.length >= 50) newHistory.shift();
      return [...newHistory, JSON.parse(JSON.stringify(newTemplate))];
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isInternalUpdate.current = true;
      const prev = history[historyIndex - 1];
      setDraftTemplate(prev);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isInternalUpdate.current = true;
      const next = history[historyIndex + 1];
      setDraftTemplate(next);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // --- Handlers ---
  const handleBodyChange = useCallback((value: string) => {
    if (!draftTemplate) return;
    const updated = { ...draftTemplate, body: value };
    setDraftTemplate(updated);

    if (historyTimeout.current) clearTimeout(historyTimeout.current);
    historyTimeout.current = setTimeout(() => {
      pushHistory(updated);
    }, 500);
  }, [draftTemplate, pushHistory]);

  const applyFormat = useCallback((tag: string, attr?: string, attrValue?: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !draftTemplate) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = draftTemplate.body;
    const selected = text.substring(start, end);
    
    if (start === end && tag !== 'link') return;

    let newText = "";
    let addedLen = 0;

    const tagOpenStr = attr ? `<${tag} ${attr}="${attrValue}">` : `<${tag}>`;
    const tagCloseStr = `</${tag}>`;

    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    if (tag === 'link') {
      const url = window.prompt("링크 URL을 입력하세요:", "https://");
      if (!url) return;
      const cleanSelected = selected.replace(/<a[^>]*>/g, '').replace(/<\/a>/g, '');
      const snippet = `<a href="${url}">${cleanSelected}</a>`;
      newText = beforeText + snippet + afterText;
      addedLen = snippet.length - selected.length;
    } else {
      // Toggle logic
      const beforeEndsWithTag = beforeText.endsWith(tagOpenStr);
      const afterStartsWithTag = afterText.startsWith(tagCloseStr);
      const selectedStartsWithTag = selected.startsWith(tagOpenStr);
      const selectedEndsWithTag = selected.endsWith(tagCloseStr);

      if (beforeEndsWithTag && afterStartsWithTag) {
        newText = beforeText.substring(0, beforeText.length - tagOpenStr.length) + selected + afterText.substring(tagCloseStr.length);
        addedLen = -tagOpenStr.length;
      } else if (selectedStartsWithTag && selectedEndsWithTag) {
        const innerText = selected.substring(tagOpenStr.length, selected.length - tagCloseStr.length);
        newText = beforeText + innerText + afterText;
        addedLen = -tagOpenStr.length;
      } else {
        const cleanSelected = selected.replace(new RegExp(`<${tag}[^>]*>`, 'g'), '').replace(new RegExp(`</${tag}>`, 'g'), '');
        const snippet = tagOpenStr + cleanSelected + tagCloseStr;
        newText = beforeText + snippet + afterText;
        addedLen = tagOpenStr.length;
      }
    }

    handleBodyChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + addedLen, end + addedLen);
    }, 10);

    setActiveMenu(null);
  }, [draftTemplate, handleBodyChange]);

  const applyColor = useCallback((hex: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !draftTemplate) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = draftTemplate.body;
    const selected = text.substring(start, end);
    
    if (start === end) return;

    const tagOpenStr = `<color hex="${hex}">`;
    const tagCloseStr = `</color>`;
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    let newText = "";
    let addedLen = 0;

    const colorTagMatch = beforeText.match(/<color hex="[^"]+">$/);
    const selectedColorMatch = selected.match(/^<color hex="[^"]+">/);

    if (colorTagMatch && afterText.startsWith(tagCloseStr)) {
      if (colorTagMatch[0] === tagOpenStr) {
        newText = beforeText.substring(0, beforeText.length - tagOpenStr.length) + selected + afterText.substring(tagCloseStr.length);
        addedLen = -tagOpenStr.length;
      } else {
        newText = beforeText.substring(0, beforeText.length - colorTagMatch[0].length) + tagOpenStr + selected + afterText;
        addedLen = tagOpenStr.length - colorTagMatch[0].length;
      }
    } else if (selectedColorMatch && selected.endsWith(tagCloseStr)) {
      if (selectedColorMatch[0] === tagOpenStr) {
        const innerText = selected.substring(selectedColorMatch[0].length, selected.length - tagCloseStr.length);
        newText = beforeText + innerText + afterText;
        addedLen = -tagOpenStr.length;
      } else {
        const innerText = selected.substring(selectedColorMatch[0].length, selected.length - tagCloseStr.length);
        newText = beforeText + tagOpenStr + innerText + tagCloseStr + afterText;
        addedLen = tagOpenStr.length - selectedColorMatch[0].length;
      }
    } else {
      const cleanSelected = selected.replace(/<color hex="[^"]+">/g, '').replace(/<\/color>/g, '');
      const snippet = tagOpenStr + cleanSelected + tagCloseStr;
      newText = beforeText + snippet + afterText;
      addedLen = tagOpenStr.length;
    }

    handleBodyChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + addedLen, end + addedLen);
    }, 10);

    setActiveMenu(null);
  }, [draftTemplate, handleBodyChange]);

  // --- Selection Tracking ---
  const handleSelection = useCallback((e: any) => {
    if (e.target && e.target.closest('.floating-toolbar')) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    setTimeout(() => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const direction = textarea.selectionDirection;

      if (start !== end) {
        // 드래그 시작 지점(Anchor)의 텍스트 좌표 계산
        // selectionDirection: "forward" (앞에서 뒤로), "backward" (뒤에서 앞으로)
        const startPointIndex = direction === 'backward' ? end : start;
        const coords = getCaretCoordinates(textarea, startPointIndex);

        setSelectionToolbar({
          x: Math.min(window.innerWidth - 300, Math.max(20, coords.left - 80)),
          y: Math.max(20, coords.top - 55),
          show: true
        });
      } else {
        setSelectionToolbar({ x: 0, y: 0, show: false });
        setActiveMenu(null);
      }
    }, 10);
  }, [getCaretCoordinates]);

  async function saveTemplate() {
    if (!draftTemplate) return;
    setIsSaving(true);
    try {
      await upsertTemplate(draftTemplate);
      addToast("템플릿이 저장되었습니다.", "success");
    } catch (err: any) {} finally {
      setIsSaving(false);
    }
  }

  async function handleTestSend() {
    if (!draftTemplate || !testEmailAddr) return;
    setIsTestSending(true);
    const mockDataForSend = {
      name: "박소영",
      companyName: "한빛테크",
      courseName: "지원비과정",
      subCourseName: "의료기기 사용적합성 엔지니어링파일 작성 실무",
      courseDate: "4/30",
      deadline: "2026.04.28",
      contactPhone: "062-710-2896",
      managerName: "김관리",
    };
    try {
      await testEmail(
        testEmailAddr,
        applyTemplateVariables(draftTemplate.subject, mockDataForSend),
        applyTemplateVariables(draftTemplate.body, mockDataForSend),
        draftTemplate.attachments
      );
      addToast("테스트 메일이 발송되었습니다.", "success");
      setShowTestModal(false);
      fetchLogs();
    } catch (err: any) {} finally {
      setIsTestSending(false);
    }
  }

  async function handleUpload(file: File) {
    if (!draftTemplate || draftTemplate.id.startsWith('tpl-')) {
      addToast("먼저 템플릿을 저장한 후 파일을 업로드할 수 있습니다.", "error");
      return;
    }
    try {
      await uploadAttachment(draftTemplate.id, file);
      addToast("파일이 업로드되었습니다.", "success");
    } catch (err: any) {}
  }

  async function handleDeleteAttachment(attachmentId: string) {
    if (!draftTemplate) return;
    try {
      await deleteAttachment(draftTemplate.id, attachmentId);
      addToast("파일이 삭제되었습니다.", "success");
    } catch (err: any) {}
  }

  function insertVariable(variableKey: string) {
    if (!draftTemplate) return;
    const textarea = textareaRef.current;
    const variable = `{{${variableKey}}}`;
    let newBody = "";
    let cursorPosition = 0;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = draftTemplate.body;
      newBody = text.substring(0, start) + variable + text.substring(end);
      cursorPosition = start + variable.length;
    } else {
      newBody = `${draftTemplate.body}\n${variable}`.trim();
    }

    const updated = { ...draftTemplate, body: newBody };
    setDraftTemplate(updated);
    pushHistory(updated);

    if (textarea) {
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    }
    setSelectionToolbar(prev => ({ ...prev, show: false }));
    setActiveMenu(null);
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type !== 'textarea') return;
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            saveTemplate();
            break;
          case 'b':
            e.preventDefault();
            applyFormat('b');
            break;
          case 'i':
            e.preventDefault();
            applyFormat('i');
            break;
          case 'u':
            e.preventDefault();
            applyFormat('u');
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveTemplate, applyFormat]);

  const mockData = useMemo(() => ({
    name: "박소영",
    companyName: "한빛테크",
    courseName: "지원비과정",
    subCourseName: "의료기기 사용적합성 엔지니어링파일 작성 실무",
    courseDate: "4/30",
    deadline: "2026.04.28",
    contactPhone: "062-710-2896",
    managerName: "김관리",
  }), []);

  const previewSubject = useMemo(() => 
    draftTemplate ? applyTemplateVariables(draftTemplate.subject, mockData) : "", 
  [draftTemplate, mockData]);

  const unresolvedVars = useMemo(() => {
    if (!draftTemplate) return [];
    const textToCheck = draftTemplate.subject + " " + draftTemplate.body;
    const parts = textToCheck.split(/({{\s*[a-zA-Z0-9_]+\s*}})/g);
    const vars = new Set<string>();
    parts.forEach(part => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const varName = part.slice(2, -2).trim();
        if (!Object.keys(mockData).includes(varName)) {
          vars.add(varName);
        }
      }
    });
    return Array.from(vars);
  }, [draftTemplate, mockData]);

  const renderBodyWithHighlights = (text: string) => {
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // Support multiline with [\s\S]
    html = html
      .replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/g, '<b style="font-weight: 800">$1</b>')
      .replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/g, "<i>$1</i>")
      .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, "<u>$1</u>")
      .replace(/&lt;s&gt;([\s\S]*?)&lt;\/s&gt;/g, "<s>$1</s>")
      .replace(/&lt;mark&gt;([\s\S]*?)&lt;\/mark&gt;/g, '<mark style="background-color: #fef08a; padding: 0 2px; border-radius: 4px;">$1</mark>')
      .replace(/&lt;li&gt;([\s\S]*?)&lt;\/li&gt;/g, '<div style="display: flex; gap: 8px; margin: 4px 0;"><span style="color: #10b981">•</span><span>$1</span></div>')
      .replace(/&lt;a href=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/a&gt;/g, '<a href="$1" target="_blank" style="color: #3b82f6; text-decoration: underline;">$2</a>')
      .replace(/&lt;color hex=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/color&gt;/g, '<span style="color: $1">$2</span>')
      .replace(/&lt;font face=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/font&gt;/g, '<span style="font-family: $1">$2</span>')
      .replace(/&lt;size value=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/size&gt;/g, '<span style="font-size: $1">$2</span>');

    const parts = html.split(/({{\s*[a-zA-Z0-9_]+\s*}})/g);
    return parts.map((part) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const varName = part.slice(2, -2).trim();
        const mockValue = (mockData as any)[varName];
        const isResolved = mockValue !== undefined;
        return `<span class="px-1 rounded ${isResolved ? 'bg-brand-primary/10 text-brand-primary font-black' : 'bg-error/20 text-error font-black shadow-[0_0_0_1px_rgba(255,0,0,0.3)]'}">${isResolved ? mockValue : part}</span>`;
      }
      return part;
    }).join("");
  };

  if (isLoading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  function createNewTemplate() {
    const newId = `tpl-${Date.now()}`;
    const newTemplate: EmailTemplate = {
      id: newId,
      name: "새 템플릿",
      audience: "ALL",
      subject: "새 메일 제목",
      body: "본문 내용을 입력하세요.",
      attachments: []
    };
    setActiveTemplateId(newId);
    setDraftTemplate(newTemplate);
    setHistory([newTemplate]);
    setHistoryIndex(0);
  }

  return (
    <>
      <PageHeader 
        title="이메일 시스템 관리" 
        actions={
          <div className="flex bg-surface-subtle p-1 rounded-xl border border-border/50">
            <button onClick={() => setActiveTab("editor")} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "editor" ? "bg-surface shadow-sm text-brand-primary" : "text-tertiary hover:text-secondary"}`}>템플릿 편집</button>
            <button onClick={() => setActiveTab("logs")} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "logs" ? "bg-surface shadow-sm text-brand-primary" : "text-tertiary hover:text-secondary"}`}>발송 이력</button>
          </div>
        }
      />

      {activeTab === "editor" ? (
        <section aria-label="이메일 템플릿 편집 화면">
          <div className="template-layout">
            <aside className="template-list" aria-label="템플릿 목록">
              <div className="px-1 py-3 mb-4 flex items-center justify-between border-b border-border/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary"><Mail size={16} strokeWidth={2.5} /></div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-primary uppercase tracking-wider">Templates</span>
                    <span className="text-xs font-bold text-tertiary">총 {templates.length}개의 서식</span>
                  </div>
                </div>
                <button onClick={createNewTemplate} className="w-8 h-8 flex items-center justify-center bg-brand-primary text-white hover:bg-brand-primary-hover rounded-xl transition-all shadow-md shadow-brand-primary/20 active:scale-95"><PlusIcon size={16} strokeWidth={3} /></button>
              </div>
              <div className="template-list-items space-y-2.5 custom-scrollbar">
                {templates.map((template) => (
                  <button key={template.id} type="button" className={template.id === activeTemplateId ? "template-item template-item-active" : "template-item"} onClick={() => setActiveTemplateId(template.id)}>
                    <div className="flex justify-between items-start w-full">
                      <p className="template-item-title truncate flex-1 pr-2">{template.name}</p>
                      <span className={`shrink-0 text-xs font-black px-1.5 py-0.5 rounded-md ${template.audience === "INSURED" ? "bg-brand-primary/10 text-brand-primary" : template.audience === "UNINSURED" ? "bg-warning/10 text-warning" : "bg-surface-subtle text-tertiary"}`}>{template.audience === "INSURED" ? "가입" : template.audience === "UNINSURED" ? "미가입" : "전체"}</span>
                    </div>
                    <p className="text-[11px] text-tertiary font-medium line-clamp-1 opacity-70 mb-1">{template.subject || "제목 없음"}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">{template.attachments && template.attachments.length > 0 && <div className="flex items-center gap-1 bg-surface-subtle px-1.5 py-0.5 rounded-md border border-border/50"><Paperclip size={10} className="text-tertiary" /><span className="text-xs text-tertiary font-bold">{template.attachments.length}</span></div>}</div>
                      <span className="text-xs font-black text-disabled uppercase tracking-wider italic">Saved</span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            {draftTemplate ? (
              <div className="template-editor-area">
                <div className="overflow-hidden bg-surface">
                  <div className="px-6 py-2.5 bg-surface-subtle/50 border-b border-border flex items-center gap-4">
                    <div className="flex items-center gap-2.5 flex-1 max-w-md">
                      <div className="w-7 h-7 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary shrink-0"><Settings size={14} /></div>
                      <input className="flex-1 bg-transparent border-none text-[13px] font-black text-primary focus:ring-0 p-0 placeholder:text-disabled" placeholder="템플릿 명칭" value={draftTemplate.name} onChange={(e) => setDraftTemplate(cur => cur ? ({ ...cur, name: e.target.value }) : null)} />
                    </div>
                    <div className="h-4 w-px bg-border/60" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-tertiary uppercase tracking-wider">대상</span>
                      <select className="bg-white/50 border border-border rounded-lg px-2.5 py-1 text-[11px] font-bold text-secondary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all cursor-pointer appearance-none pr-7 relative" value={draftTemplate.audience} onChange={(e) => setDraftTemplate(cur => cur ? ({ ...cur, audience: e.target.value as InsuranceTarget }) : null)}>
                        <option value="ALL">전체</option>
                        <option value="INSURED">가입자</option>
                        <option value="UNINSURED">미가입자</option>
                      </select>
                    </div>
                    <button type="button" className="ml-auto px-4 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-black text-[11px] shadow-md shadow-brand-primary/10 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2" onClick={saveTemplate} disabled={isSaving}>{isSaving ? <Clock size={12} className="animate-spin" /> : <Save size={12} />}변경사항 저장</button>
                  </div>
                  <div className="px-6 py-5 bg-white space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-primary/5 rounded-2xl flex items-center justify-center text-brand-primary/30 shrink-0"><Mail size={18} /></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2"><span className="text-[11px] font-bold text-disabled uppercase tracking-widest">Subject</span><div className="flex-1 h-px bg-border/20" /></div>
                        <input className="w-full bg-transparent border-none text-lg font-black text-primary focus:ring-0 p-0 placeholder:text-disabled tracking-tight" placeholder="메일 제목 입력" value={draftTemplate.subject} onChange={(e) => setDraftTemplate(cur => cur ? ({ ...cur, subject: e.target.value }) : null)} />
                      </div>
                    </div>
                    <div className="pl-14"><AttachmentUploader attachments={draftTemplate.attachments || []} onUpload={handleUpload} onDelete={handleDeleteAttachment} isLoading={isLoading} /></div>
                  </div>
                </div>

                <div className="editor-main-grid">
                  <div className="editor-section">
                    <div className="editor-section-header">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-brand-primary/10 rounded-lg text-brand-primary"><PlusIcon size={14} strokeWidth={3} /></div>
                        <span className="text-xs font-black text-primary uppercase tracking-wider">본문 편집</span>
                        <div className="flex items-center gap-1 ml-4">
                          <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-surface-subtle rounded-lg text-tertiary disabled:opacity-30 transition-all"><RotateCcw size={14} /></button>
                          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-surface-subtle rounded-lg text-tertiary disabled:opacity-30 transition-all"><RotateCw size={14} /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 group relative z-50"><HelpCircle size={14} className="text-tertiary cursor-help" /><div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-brand-dark text-white text-[11px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl">텍스트를 드래그하여 서식을 지정하거나, 상단 버튼으로 변수를 삽입하세요.</div></div>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 mb-5 bg-surface-subtle/50 rounded-2xl border border-border/50 relative z-30">
                      <div className="flex items-center gap-2 mr-2 pr-3 border-r border-border/50"><span className="text-xs font-black text-tertiary uppercase tracking-widest">Variables</span></div>
                      {templateVariableMetadata.map((v) => (
                        <button key={v.key} type="button" onMouseDown={(e) => e.preventDefault()} className="group relative px-3 py-1.5 bg-white border border-border hover:border-brand-primary hover:text-brand-primary text-[11px] font-black rounded-xl transition-all shadow-sm active:scale-95" onClick={() => insertVariable(v.key)}>{v.label}<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[180px] p-2 bg-brand-dark text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl">{v.description}<div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-brand-dark" /></div></button>
                      ))}
                    </div>
                    <div className="flex-1 relative flex flex-col min-h-0">
                      <textarea ref={textareaRef} className="flex-1 w-full p-0 bg-transparent border-none text-[13px] font-medium leading-relaxed focus:ring-0 outline-none transition-all resize-none custom-scrollbar" placeholder="이메일 본문 내용을 입력하세요..." value={draftTemplate.body} onChange={(e) => handleBodyChange(e.target.value)} onMouseUp={handleSelection} onKeyUp={handleSelection} />
                      {selectionToolbar.show && (
                        <div className="fixed z-[200] animate-in fade-in zoom-in-95 duration-200 floating-toolbar" style={{ left: selectionToolbar.x, top: selectionToolbar.y }}>
                          <div className="bg-[#0f172a] rounded-[14px] px-1 py-1 shadow-2xl flex items-center gap-0.5 border border-white/20">
                            <div className="flex items-center gap-0.5">
                              <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('b')} className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-all"><Bold size={14} /></button>
                              <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('i')} className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-all"><Italic size={14} /></button>
                              <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('u')} className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-all"><Underline size={14} /></button>
                              <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('s')} className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-all"><Strikethrough size={14} /></button>
                            </div>
                            <div className="w-px h-3.5 bg-white/10 mx-0.5" />
                            <div className="flex items-center gap-0.5">
                              <div className="relative">
                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => setActiveMenu(activeMenu === 'font' ? null : 'font')} className={`p-1.5 rounded-lg transition-all ${activeMenu === 'font' ? 'bg-brand-primary text-white' : 'hover:bg-white/10 text-white/70'}`}><Type size={14} /></button>
                                {activeMenu === 'font' && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-[#0f172a] border border-white/20 rounded-xl py-1.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                                    {fonts.map(f => <button key={f.value} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('font', 'face', f.value)} className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-all">{f.name}</button>)}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-[#0f172a]" />
                                  </div>
                                )}
                              </div>
                              <div className="relative">
                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => setActiveMenu(activeMenu === 'size' ? null : 'size')} className={`p-1.5 rounded-lg transition-all ${activeMenu === 'size' ? 'bg-brand-primary text-white' : 'hover:bg-white/10 text-white/70'}`}><Baseline size={14} /></button>
                                {activeMenu === 'size' && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-20 bg-[#0f172a] border border-white/20 rounded-xl py-1.5 shadow-2xl grid grid-cols-2 gap-0.5 px-1.5 animate-in fade-in slide-in-from-bottom-2">
                                    {fontSizes.map(s => <button key={s.value} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('size', 'value', s.value)} className="text-center py-1.5 text-xs font-black text-white/80 hover:text-white hover:bg-white/10 transition-all rounded-md">{s.label}</button>)}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-[#0f172a]" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="w-px h-3.5 bg-white/10 mx-0.5" />
                            <div className="flex items-center gap-0.5">
                              <div className="relative">
                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => setActiveMenu(activeMenu === 'color' ? null : 'color')} className={`p-1.5 rounded-lg transition-all ${activeMenu === 'color' ? 'bg-brand-primary text-white' : 'hover:bg-white/10 text-white/70'}`}><Palette size={14} /></button>
                                {activeMenu === 'color' && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0f172a] border border-white/20 rounded-xl p-2 shadow-2xl animate-in fade-in zoom-in-95 w-40">
                                    <div className="grid grid-cols-5 gap-1.5">
                                      {colors.map(c => <button key={c.hex} onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor(c.hex)} className={`w-5 h-5 rounded-full border border-white/20 transition-all hover:scale-110 active:scale-90 ${c.bg}`} title={c.name} />)}
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-[#0f172a]" />
                                  </div>
                                )}
                              </div>
                              <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('mark')} className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-all"><Highlighter size={14} /></button>
                              <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('link')} className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-all"><Link size={14} /></button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="vertical-divider" />
                  <div className="editor-section bg-surface-subtle/20">
                    <div className="editor-section-header">
                      <div className="flex items-center gap-2.5"><div className="p-1.5 bg-success/10 rounded-lg text-success"><HelpCircle size={14} strokeWidth={3} /></div><h3 className="text-xs font-black text-brand-primary uppercase tracking-widest">미리보기 (Preview)</h3></div>
                      <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span><span className="text-[11px] font-bold text-success">실시간 렌더링</span></div>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-3xl border border-border/50 shadow-xl overflow-hidden mb-5">
                      <div className="px-8 py-6 border-b border-border/30 space-y-2">
                        <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-disabled uppercase tracking-widest italic">To: {mockData.name} ({mockData.companyName})</span><span className="text-[11px] font-bold text-tertiary">{toDotDate(new Date().toISOString())}</span></div>
                        <p className="text-sm font-black text-primary leading-tight">제목: {previewSubject || "제목을 입력하세요"}</p>
                      </div>
                      <div className="px-8 py-6 text-[13px] text-secondary font-medium whitespace-pre-wrap leading-relaxed font-sans flex-1 overflow-auto custom-scrollbar">
                        {unresolvedVars.length > 0 && (
                          <div className="mb-4 flex items-center gap-2 p-3.5 bg-error/10 text-error rounded-2xl border border-error/20 animate-in slide-in-from-top-2">
                            <AlertCircle size={18} className="shrink-0" />
                            <span className="text-xs font-bold leading-tight">해결되지 않은 변수 {unresolvedVars.length}개 발견</span>
                          </div>
                        )}
                        <div dangerouslySetInnerHTML={{ __html: renderBodyWithHighlights(draftTemplate.body) }} />
                      </div>
                      {(draftTemplate.attachments?.length || 0) > 0 && (
                        <div className="px-8 py-5 border-t border-border/30 bg-surface-subtle/30">
                          <p className="text-[11px] font-black text-tertiary uppercase tracking-widest mb-3">첨부파일 ({draftTemplate.attachments?.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {draftTemplate.attachments?.map((att: AttachmentMeta) => (
                              <div key={att.id} className="flex items-center gap-2 px-2.5 py-1 bg-white rounded-lg border border-border/50 text-[10px] font-black text-secondary shadow-sm"><Paperclip size={12} className="text-tertiary" />{att.originalName}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button type="button" className="w-full h-14 bg-white border border-border hover:border-brand-primary hover:text-brand-primary text-secondary rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm" onClick={() => setShowTestModal(true)}><Send size={18} /> 테스트 메일 발송</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="template-editor-area flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-brand-primary/5 rounded-[28px] flex items-center justify-center mb-6 border border-brand-primary/10 shadow-inner"><Mail size={40} className="text-brand-primary/40" /></div>
                <h3 className="text-lg font-black text-primary mb-2 uppercase tracking-tight">템플릿을 선택해 주세요</h3>
                <p className="text-sm font-bold text-tertiary max-w-[280px] leading-relaxed">왼쪽 목록에서 편집할 템플릿을 선택하거나, <br /><span className="text-brand-primary">+ 버튼</span>을 눌러 새 템플릿을 만드세요.</p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section aria-label="메일 발송 이력" className="space-y-5">
          {/* Refined Filter Bar */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-tertiary uppercase tracking-tight">Status</span>
                  <select 
                    className="bg-transparent text-xs font-bold text-primary focus:outline-none cursor-pointer border-b border-transparent hover:border-brand-primary/30 transition-all pb-0.5"
                    value={logFilterStatus}
                    onChange={(e) => setLogFilterStatus(e.target.value)}
                  >
                    <option value="ALL">모든 상태</option>
                    <option value="sent">발송 성공</option>
                    <option value="failed">발송 실패</option>
                  </select>
                </div>

                <div className="w-px h-3 bg-border/60" />

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-tertiary uppercase tracking-tight">Period</span>
                  <select 
                    className="bg-transparent text-xs font-bold text-primary focus:outline-none cursor-pointer border-b border-transparent hover:border-brand-primary/30 transition-all pb-0.5"
                    value={logFilterPeriod}
                    onChange={(e) => setLogFilterPeriod(e.target.value)}
                  >
                    <option value="ALL">전체 기간</option>
                    <option value="DAY">최근 24시간</option>
                    <option value="WEEK">최근 1주일</option>
                    <option value="MONTH">최근 1개월</option>
                    <option value="YEAR">최근 1년</option>
                  </select>
                </div>
              </div>

              <div className="h-4 w-px bg-border/40" />
              
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-disabled uppercase">Results:</span>
                <span className="text-xs font-black text-brand-primary">{logs.length}</span>
              </div>
            </div>

            <a 
              href="https://mail.naver.com/v2/folders/1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border hover:border-brand-primary hover:text-brand-primary rounded-xl transition-all shadow-sm group"
            >
              <span className="text-[10.5px] font-black uppercase tracking-tight">Naver Mail</span>

              <div className="w-1.5 h-1.5 rounded-full bg-[#03C75A] group-hover:animate-pulse" />
              <ExternalLink size={12} className="text-tertiary group-hover:text-brand-primary" />
            </a>


          </div>

          <div className="bg-surface border border-border/40 rounded-[28px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-tertiary uppercase tracking-widest bg-surface-subtle/30 border-b border-border/40">발송 일시</th>
                    <th className="px-6 py-4 text-xs font-black text-tertiary uppercase tracking-widest bg-surface-subtle/30 border-b border-border/40">템플릿</th>
                    <th className="px-6 py-4 text-xs font-black text-tertiary uppercase tracking-widest bg-surface-subtle/30 border-b border-border/40">수신 이메일</th>
                    <th className="px-6 py-4 text-xs font-black text-tertiary uppercase tracking-widest bg-surface-subtle/30 border-b border-border/40">상태</th>
                    <th className="px-6 py-4 text-xs font-black text-tertiary uppercase tracking-widest bg-surface-subtle/30 border-b border-border/40">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {logs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-24 text-center text-sm text-disabled font-bold italic">필터 조건에 맞는 발송 이력이 없습니다.</td></tr>
                  ) : logs.map(log => (
                    <tr key={log.id} className="hover:bg-brand-primary/[0.02] transition-colors group">
                      <td className="px-6 py-4"><div className="flex items-center gap-2 text-xs font-bold text-secondary tracking-tighter"><Clock size={12} className="text-disabled/60" />{log.sentAt ? `${toDotDate(log.sentAt)} ${new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : toDotDate(log.createdAt)}</div></td>
                      <td className="px-6 py-4 text-[11px] font-black text-primary uppercase tracking-tight">{log.templateName || "직접 발송"}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-primary uppercase tracking-tight">{log.recipientName || "테스트"}</span>
                          <span className="text-[10px] font-mono font-bold text-secondary/70 tracking-tighter">{log.recipientEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${log.status === "sent" ? "bg-success" : log.status === "failed" ? "bg-error" : "bg-warning"}`} />
                          <span className={`text-xs font-black tracking-tight ${log.status === "sent" ? "text-success" : log.status === "failed" ? "text-error" : "text-warning"}`}>
                            {log.status === "sent" ? "발송 완료" : log.status === "failed" ? "발송 실패" : "전송 중"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.errorMessage ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-error max-w-[180px]">
                            <AlertCircle size={12} className="shrink-0 opacity-70" />
                            <span className="truncate opacity-90">{log.errorMessage}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-tertiary/60 tracking-tight">{log.status === "sent" ? "성공적으로 전달됨" : "-"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {showTestModal && (
        <div className="fixed inset-0 bg-brand-dark/40 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-[32px] p-8 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Send size={20} className="text-brand-primary" /> 테스트 메일 발송</h3>
              <button onClick={() => setShowTestModal(false)} className="p-2 hover:bg-surface-subtle rounded-full transition-all"><X size={20} /></button>
            </div>
            <div className="space-y-4 mb-8">
              <label className="field">테스트 수신 이메일<input type="email" placeholder="example@naver.com" className="w-full px-4 py-3 bg-surface-subtle border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" value={testEmailAddr} onChange={(e) => setTestEmailAddr(e.target.value)} /></label>
              <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10"><p className="text-[11px] text-secondary leading-relaxed">작성 중인 템플릿의 <span className="text-brand-primary font-bold">내용과 제목</span>이 그대로 전송됩니다. 변수 영역은 샘플 데이터로 치환됩니다.</p></div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 py-3 text-sm font-bold text-secondary bg-surface-subtle hover:bg-surface-active rounded-xl transition-all" onClick={() => setShowTestModal(false)}>취소</button>
              <button className="flex-1 py-3 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl shadow-lg shadow-brand-primary/20 transition-all disabled:opacity-50" onClick={handleTestSend} disabled={isTestSending || !testEmailAddr}>{isTestSending ? "발송 중..." : "발송 시작"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
