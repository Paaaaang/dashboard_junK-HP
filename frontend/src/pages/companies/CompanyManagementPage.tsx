import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCompanyStore, useParticipantStore, useCourseStore } from "../../stores";
import { transformParticipantsToMap } from "../../utils/participantUtils";
import { Mail, Phone, Check, Download } from "lucide-react";
import {
  createEmptyCompany,
  cloneCompany,
  initialTemplates,
} from "../../constants";
import { PageHeader } from "../../components";
import type {
  CompanyRecord,
  CompanyParticipation,
  CourseType,
  ParticipantRecord,
  ParticipantEnrollment,
} from "../../types/models";

import { useCompanyFilters, TAB_ITEMS } from "./hooks/useCompanyFilters";
import { useCompanySort, SortKey } from "./hooks/useCompanySort";
import { CompanyTable } from "./CompanyTable";
import { CompanyDrawer } from "./CompanyDrawer";
import { AddCompanyModal } from "./modals/AddCompanyModal";
import { UploadModal } from "./modals/UploadModal";
import { EmailModal } from "./modals/EmailModal";
import { CourseGroup } from "./modals/CourseManagerModal";
import { AddCourseModal } from "./modals/AddCourseModal";

type ActiveModal =
  | "choice"
  | "upload"
  | "email"
  | "add-course"
  | null;

interface TooltipInfo {
  content: React.ReactNode;
  style: React.CSSProperties;
}

const TAB_GROUP_IDS = {
  TRAINING: "course-group-training",
  SUPPORT: "course-group-support",
  SEMINAR: "course-group-seminar",
} as const;

const SYSTEM_FIELDS = [
  { key: "companyName", label: "기업명 *" },
  { key: "businessRegNo", label: "사업자번호" },
  { key: "location", label: "소재지" },
  { key: "representative", label: "대표자명" },
  { key: "manager", label: "담당자" },
  { key: "phone", label: "연락처" },
  { key: "email", label: "이메일" },
  { key: "__skip__", label: "건너뛰기" },
];

function formatBusinessRegNo(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function normalizeCompanyParticipations(
  company: CompanyRecord,
  groups: CourseGroup[],
): CompanyRecord {
  const byType = new Map(
    company.participations.map((participation) => [
      participation.courseType,
      participation,
    ]),
  );
  const participations = groups.map((group) => {
    const existing = byType.get(group.name);
    if (existing) return { ...existing };
    return {
      courseType: group.name,
      enabled: false,
      programNames: [],
      status: "미참여" as const,
    };
  });

  return { ...company, participations };
}

function toDotDate(value: string | undefined): string {
  if (!value) return "-";
  return value.split("-").join(".");
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getParticipationCount(company: CompanyRecord): number {
  return company.participations.reduce((count, participation) => {
    if (!participation.enabled) return count;
    return count + participation.programNames.length;
  }, 0);
}

export function CompanyManagementPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { courseGroups } = useCourseStore();
  const { companies: rawCompanies, setCompanies: setGlobalCompanies, upsertCompany, isLoading } = useCompanyStore();

  const companies = useMemo(() => rawCompanies.map(c => normalizeCompanyParticipations(cloneCompany(c), courseGroups)), [rawCompanies, courseGroups]);

  const setCompanies = useCallback(
    (updater: (curr: CompanyRecord[]) => CompanyRecord[]) => {
      const currRaw = useCompanyStore.getState().companies;
      const currNorm = currRaw.map(c => normalizeCompanyParticipations(cloneCompany(c), courseGroups));
      const nextNorm = updater(currNorm);
      setGlobalCompanies(nextNorm);
    },
    [courseGroups, setGlobalCompanies]
  );

  const { activeTab, setActiveTab, searchRaw: searchText, setSearchRaw: setSearchText, searchDebounced, filterCompanies } = useCompanyFilters();
  const { sortState, toggleSort, sortCompanies } = useCompanySort();
  
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(
    new Set(),
  );
  const [tableNotice, setTableNotice] = useState("");

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [draftCompany, setDraftCompany] = useState<CompanyRecord | null>(null);
  const [drawerEditMode, setDrawerEditMode] = useState(false);
  const [expandedDrawerGroups, setExpandedDrawerGroups] = useState<Set<string>>(
    new Set(),
  );
  const [drawerNotice, setDrawerNotice] = useState("");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [uploadPreview, setUploadPreview] = useState<CompanyRecord[] | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null);

  const [emailRecipientIds, setEmailRecipientIds] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialTemplates[0]?.id ?? "",
  );

  const [editModeSnapshot, setEditModeSnapshot] =
    useState<CompanyRecord | null>(null);
  const [drawerNameEditing, setDrawerNameEditing] = useState(false);
  const [drawerNameDraft, setDrawerNameDraft] = useState("");
  const [cancelConfirmPending, setCancelConfirmPending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [addCourseGroupName, setAddCourseGroupName] = useState("");
  const [addCourseSelection, setAddCourseSelection] = useState<Set<string>>(
    new Set(),
  );

  const lastSelectedIdRef = useRef<string | null>(null);

  const { participants, upsertParticipant } = useParticipantStore();

  const companyParticipants = useMemo(() => {
    const groupNames: Record<string, string> = {};
    courseGroups.forEach((g) => {
      groupNames[g.id] = g.name;
    });
    return transformParticipantsToMap(participants, groupNames);
  }, [participants, courseGroups]);

  const [expandedSubCourses, setExpandedSubCourses] = useState<Set<string>>(
    new Set(),
  );

  const [addParticipantSubCourseId, setAddParticipantSubCourseId] = useState<
    string | null
  >(null);
  const [addParticipantDraft, setAddParticipantDraft] = useState("");

  const [participantPopover, setParticipantPopover] = useState<{
    participant: any;
    style: React.CSSProperties;
  } | null>(null);
  const popoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectAllRef = useRef<HTMLInputElement>(null);

  const tabTargetGroupName = useMemo(() => {
    if (activeTab === "ALL") return null;
    const groupId =
      activeTab === "TRAINING"
        ? TAB_GROUP_IDS.TRAINING
        : activeTab === "SUPPORT"
          ? TAB_GROUP_IDS.SUPPORT
          : TAB_GROUP_IDS.SEMINAR;
    const group = courseGroups.find((item) => item.id === groupId);
    return group?.name ?? null;
  }, [activeTab, courseGroups]);

  const filteredCompanies = useMemo(() => {
    const tabFiltered = filterCompanies(companies, tabTargetGroupName);
    return sortCompanies(tabFiltered, getParticipationCount);
  }, [companies, tabTargetGroupName, filterCompanies, sortCompanies]);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCompanies.slice(start, start + PAGE_SIZE);
  }, [filteredCompanies, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchDebounced, sortState, tabTargetGroupName]);

  const visibleCompanyIds = useMemo(
    () => filteredCompanies.map((company) => company.id),
    [filteredCompanies],
  );

  const selectedVisibleCount = useMemo(
    () =>
      visibleCompanyIds.filter((companyId) => selectedCompanyIds.has(companyId))
        .length,
    [selectedCompanyIds, visibleCompanyIds],
  );

  const allVisibleSelected =
    visibleCompanyIds.length > 0 &&
    selectedVisibleCount === visibleCompanyIds.length;
  const hasPartialSelection = selectedVisibleCount > 0 && !allVisibleSelected;

  const selectedCompanies = useMemo(
    () => companies.filter((company) => selectedCompanyIds.has(company.id)),
    [companies, selectedCompanyIds],
  );

  const addCourseGroup = useMemo(
    () =>
      courseGroups.find((group) => group.name === addCourseGroupName) ?? null,
    [addCourseGroupName, courseGroups],
  );

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = hasPartialSelection;
    }
  }, [hasPartialSelection]);

  useEffect(() => {
    setSelectedCompanyIds((previous) => {
      const validIds = new Set(companies.map((company) => company.id));
      const next = new Set<string>();
      previous.forEach((companyId) => {
        if (validIds.has(companyId)) {
          next.add(companyId);
        }
      });
      return next.size === previous.size ? previous : next;
    });
  }, [companies]);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId) return;
    const target = companies.find((c) => c.id === openId);
    if (target) {
      openEditDrawer(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && selectedCompanyIds.size > 0 && !draftCompany && !activeModal) {
        clearSelectedCompanies();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedCompanyIds, draftCompany, activeModal]);

  function updateDraftField(
    field: keyof CompanyRecord,
    value: any,
  ) {
    setDraftCompany((current) =>
      current ? { ...current, [field]: value } : current,
    );
  }

  function updateDraftParticipation(
    courseType: string,
    updater: (participation: CompanyParticipation) => CompanyParticipation,
  ) {
    setDraftCompany((current) => {
      if (!current) return current;

      let found = false;
      const nextParticipations = current.participations.map((participation) => {
        if (participation.courseType !== courseType) {
          return participation;
        }
        found = true;
        return updater(participation);
      });

      if (!found) {
        nextParticipations.push(
          updater({
            courseType,
            enabled: false,
            programNames: [],
            status: "미참여",
          }),
        );
      }

      return { ...current, participations: nextParticipations };
    });
  }

  function closeModal() {
    forceCloseModal();
  }

  function forceCloseModal() {
    setActiveModal(null);
    setUploadFile(null);
    setUploadStep(1);
    setRawRows([]);
    setColumnMapping({});
    setUploadPreview(null);
    setUploadError(null);
  }

  function handleDrawerClose() {
    setIsClosing(true);
    setTimeout(() => {
      closeDrawer();
      setIsClosing(false);
    }, 200);
  }

  function closeDrawer() {
    setDraftCompany(null);
    setDrawerEditMode(false);
    setDrawerNotice("");
    setActiveModal(null);
    setTooltipInfo(null);
    setEditModeSnapshot(null);
    setDrawerNameEditing(false);
    setCancelConfirmPending(false);
    setExpandedSubCourses(new Set());
    setAddParticipantSubCourseId(null);
    setAddParticipantDraft("");
    setParticipantPopover(null);
  }

  function enterEditMode() {
    setEditModeSnapshot(draftCompany ? cloneCompany(draftCompany) : null);
    setDrawerEditMode(true);
  }

  function handleCancelEdit() {
    const snapshotJson = editModeSnapshot
      ? JSON.stringify(editModeSnapshot)
      : null;
    const draftJson = draftCompany ? JSON.stringify(draftCompany) : null;
    if (snapshotJson && draftJson && snapshotJson !== draftJson) {
      setCancelConfirmPending(true);
    } else {
      if (editModeSnapshot) setDraftCompany(cloneCompany(editModeSnapshot));
      setDrawerEditMode(false);
      setEditModeSnapshot(null);
    }
  }

  function confirmCancelEdit() {
    if (editModeSnapshot) setDraftCompany(cloneCompany(editModeSnapshot));
    setCancelConfirmPending(false);
    setDrawerEditMode(false);
    setEditModeSnapshot(null);
  }

  function openChoiceModal() {
    setActiveModal("choice");
  }

  function openUploadModal() {
    setUploadFile(null);
    setUploadStep(1);
    setRawRows([]);
    setColumnMapping({});
    setUploadPreview(null);
    setUploadError(null);
    setActiveModal("upload");
  }

  function openCreateDrawer() {
    const created = normalizeCompanyParticipations(
      createEmptyCompany(),
      courseGroups,
    );
    created.createdAt = getToday();
    setDraftCompany(created);
    setDrawerEditMode(true);
    setExpandedDrawerGroups(new Set(courseGroups.map((group) => group.name)));
    setDrawerNotice("");
    setActiveModal(null);
  }

  function openEditDrawer(company: CompanyRecord) {
    const normalized = normalizeCompanyParticipations(
      cloneCompany(company),
      courseGroups,
    );
    const expanded = normalized.participations
      .filter(
        (participation) =>
          participation.enabled && participation.programNames.length > 0,
      )
      .map((participation) => participation.courseType);

    setDraftCompany(normalized);
    setDrawerEditMode(false);
    setExpandedDrawerGroups(new Set(expanded));
    setDrawerNotice("");
    setActiveModal(null);
  }

  async function saveDraftCompany() {
    if (!draftCompany) return;

    if (!draftCompany.companyName.trim()) {
      setDrawerNotice("기업명을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const normalized = normalizeCompanyParticipations(
        draftCompany,
        courseGroups,
      );
      await upsertCompany(normalized);
      setIsSaving(false);
      closeDrawer();
    } catch (err: any) {
      setDrawerNotice(`저장 실패: ${err.message}`);
      setIsSaving(false);
    }
  }

  function getSortIndicator(key: SortKey): string {
    if (sortState.key !== key || !sortState.direction) {
      return "↕";
    }
    return sortState.direction === "asc" ? "↑" : "↓";
  }

  function toggleCompanySelection(companyId: string, event?: React.MouseEvent | React.ChangeEvent) {
    if (
      event &&
      "nativeEvent" in event &&
      event.nativeEvent instanceof MouseEvent &&
      event.nativeEvent.shiftKey &&
      lastSelectedIdRef.current
    ) {
      const ids = filteredCompanies.map((company) => company.id);
      const lastIdx = ids.indexOf(lastSelectedIdRef.current);
      const currIdx = ids.indexOf(companyId);
      if (lastIdx !== -1 && currIdx !== -1) {
        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        const rangeIds = ids.slice(start, end + 1);
        setSelectedCompanyIds((prev) => {
          const next = new Set(prev);
          rangeIds.forEach((rid) => next.add(rid));
          return next;
        });
        return;
      }
    }
    
    setSelectedCompanyIds((previous) => {
      const next = new Set(previous);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      return next;
    });
    lastSelectedIdRef.current = companyId;
  }

  function toggleVisibleSelection(checked: boolean) {
    setSelectedCompanyIds((previous) => {
      const next = new Set(previous);
      visibleCompanyIds.forEach((companyId) => {
        if (checked) {
          next.add(companyId);
        } else {
          next.delete(companyId);
        }
      });
      return next;
    });
  }

  function clearSelectedCompanies() {
    setSelectedCompanyIds(new Set());
  }

  function openEmailModal(companyIds: string[]) {
    if (companyIds.length === 0) return;
    setEmailRecipientIds(companyIds);
    setSelectedTemplateId(initialTemplates[0]?.id ?? "");
    setActiveModal("email");
  }

  function sendEmailTemplate() {
    if (!selectedTemplateId || emailRecipientIds.length === 0) return;
    const template = initialTemplates.find(
      (item) => item.id === selectedTemplateId,
    );
    const message = `${emailRecipientIds.length}개 기업에 "${template?.name ?? "선택 템플릿"}" 발송을 준비했습니다.`;
    setTableNotice(message);

    if (draftCompany && emailRecipientIds.includes(draftCompany.id)) {
      setDrawerNotice(
        `"${template?.name ?? "선택 템플릿"}"으로 이메일 발송을 준비했습니다.`,
      );
    }

    setActiveModal(null);
  }

  async function exportSelectedCompanies() {
    if (selectedCompanies.length === 0) return;
    const XLSX = await import("xlsx");

    const rows = selectedCompanies.map((company) => ({
      기업명: company.companyName,
      사업자번호: company.businessRegNo,
      소재지: company.location,
      대표명: company.representative,
      담당자: company.manager,
      연락처: company.phone,
      이메일: company.email,
      협약서여부: company.mouSigned ? "체결" : "미체결",
      참여과정수: getParticipationCount(company),
      참여과정: company.participations
        .filter((participation) => participation.enabled)
        .map(
          (participation) =>
            `${participation.courseType}: ${participation.programNames.join(", ")}`,
        )
        .join(" | "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "기업관리");
    XLSX.writeFile(workbook, `companies_${Date.now()}.xlsx`);
  }

  function parseExcelFile(file: File) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          worksheet,
          { defval: "" },
        );

        if (rows.length === 0) {
          setUploadError("인식된 데이터가 없습니다.");
          return;
        }

        const headers = Object.keys(rows[0]);
        const initialMapping: Record<string, string> = {};
        headers.forEach((h) => {
          const header = h.trim();
          if (["기업명", "회사명"].includes(header)) initialMapping[h] = "companyName";
          else if (["사업자번호", "사업자등록번호"].includes(header)) initialMapping[h] = "businessRegNo";
          else if (["소재지", "주소"].includes(header)) initialMapping[h] = "location";
          else if (["대표명", "대표자"].includes(header)) initialMapping[h] = "representative";
          else if (["담당자"].includes(header)) initialMapping[h] = "manager";
          else if (["연락처", "전화"].includes(header)) initialMapping[h] = "phone";
          else if (["이메일"].includes(header)) initialMapping[h] = "email";
          else initialMapping[h] = "__skip__";
        });

        setRawRows(rows);
        setColumnMapping(initialMapping);
        setUploadStep(2);
      } catch {
        setUploadError(
          "파일 파싱에 실패했습니다. xlsx/xls 형식을 확인해 주세요.",
        );
      }
    };

    reader.readAsArrayBuffer(file);
  }

  function goNextToPreview() {
    const parsed = rawRows.map((row, index) => {
      const company = normalizeCompanyParticipations(
        createEmptyCompany(),
        courseGroups,
      );
      company.id = `upload-${Date.now()}-${index}`;

      Object.entries(columnMapping).forEach(([colName, systemField]) => {
        if (systemField === "__skip__") return;
        const value = String(row[colName] ?? "").trim();
        if (systemField === "businessRegNo") {
          company.businessRegNo = formatBusinessRegNo(value);
        } else if (systemField in company) {
          (company as any)[systemField] = value;
        }
      });

      return company;
    }).filter(company => company.companyName.trim().length > 0);

    if (parsed.length === 0) {
      setUploadError("매핑된 기업명이 없습니다. 컬럼 매핑을 확인해 주세요.");
      return;
    }

    setUploadPreview(parsed);
    setUploadStep(3);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadError(null);
    setUploadPreview(null);
    parseExcelFile(file);
  }

  function handleDropzoneDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadError(null);
    setUploadPreview(null);
    parseExcelFile(file);
  }

  function confirmUpload() {
    if (!uploadPreview || uploadPreview.length === 0) return;
    setCompanies((current) => [...uploadPreview, ...current]);
    closeModal();
  }

  function resetUpload() {
    setUploadFile(null);
    setUploadStep(1);
    setRawRows([]);
    setColumnMapping({});
    setUploadPreview(null);
    setUploadError(null);
  }

  function openAddCourseModal() {
    if (!draftCompany) return;
    const firstGroupName = courseGroups[0]?.name ?? "";
    setAddCourseGroupName(firstGroupName);
    setAddCourseSelection(new Set());
    setActiveModal("add-course");
  }

  function toggleAddCourseSelectionItem(detailName: string, checked: boolean) {
    setAddCourseSelection((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(detailName);
      } else {
        next.delete(detailName);
      }
      return next;
    });
  }

  function saveAddCourseModal() {
    if (!draftCompany || !addCourseGroup || addCourseSelection.size === 0)
      return;

    updateDraftParticipation(addCourseGroup.name, (participation) => {
      const nextProgramNames = Array.from(
        new Set([
          ...participation.programNames,
          ...Array.from(addCourseSelection),
        ]),
      );
      return {
        ...participation,
        enabled: true,
        programNames: nextProgramNames,
        status:
          participation.status === "미참여" ? "대기" : participation.status,
      };
    });

    setExpandedDrawerGroups((previous) => {
      const next = new Set(previous);
      next.add(addCourseGroup.name);
      return next;
    });

    setDrawerNotice(
      `${addCourseSelection.size}개 세부 과정을 참여 목록에 추가했습니다.`,
    );
    setActiveModal(null);
  }

  function removeCourseProgram(courseType: string, programName: string) {
    updateDraftParticipation(courseType, (participation) => {
      const nextProgramNames = participation.programNames.filter(
        (name) => name !== programName,
      );
      return {
        ...participation,
        programNames: nextProgramNames,
        enabled: nextProgramNames.length > 0 ? participation.enabled : false,
        status: nextProgramNames.length > 0 ? participation.status : "미참여",
      };
    });
  }

  function toggleDrawerGroup(groupName: string) {
    setExpandedDrawerGroups((previous) => {
      const next = new Set(previous);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  }

  function handleLocationEnter(
    event: React.MouseEvent<HTMLTableCellElement>,
    locationText: string,
  ) {
    const span =
      event.currentTarget.querySelector<HTMLSpanElement>(".location-text");
    if (!span || span.scrollWidth <= span.clientWidth) return;

    const rect = span.getBoundingClientRect();
    setTooltipInfo({
      content: locationText,
      style: {
        left: rect.left + rect.width / 2,
        top: rect.top,
        transform: "translateX(-50%) translateY(calc(-100% - 8px))",
      },
    });
  }

  function handleParticipationEnter(
    event: React.MouseEvent<HTMLTableCellElement>,
    participations: CompanyParticipation[],
  ) {
    if (participations.length === 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const content = (
      <div className="flex flex-col gap-1 min-w-[120px]">
        {participations.map((p) => (
          <div key={p.courseType} className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold">{p.courseType}</span>
            <span className="text-[10px] bg-slate-100 px-1.5 rounded">{p.programNames.length}개 과정</span>
          </div>
        ))}
      </div>
    );

    setTooltipInfo({
      content,
      style: {
        left: rect.left + rect.width / 2,
        top: rect.top,
        transform: "translateX(-50%) translateY(calc(-100% - 8px))",
      },
    });
  }

  function getSubCoursesForCompany(companyId: string, groupId: string) {
    return companyParticipants[companyId]?.[groupId] ?? {};
  }

  function getSubCourseByName(
    companyId: string,
    groupId: string,
    detailName: string,
  ) {
    const map = getSubCoursesForCompany(companyId, groupId);
    return Object.values(map).find((sc) => sc.name === detailName);
  }

  function toggleSubCourse(detailId: string) {
    setExpandedSubCourses((prev) => {
      const next = new Set(prev);
      if (next.has(detailId)) {
        next.delete(detailId);
      } else {
        next.add(detailId);
      }
      return next;
    });
  }

  function removeParticipantFromSubCourse(
    groupId: string,
    subCourseId: string,
    participantId: string,
  ) {
    const pt = participants.find((p) => p.id === participantId);
    if (!pt) return;

    const group = courseGroups.find((g) => g.id === groupId);
    if (!group) return;

    const nextEnrollments = pt.enrollments.filter(
      (e) => !(e.courseType === group.name && e.subCourseName === subCourseId),
    );

    upsertParticipant({ ...pt, enrollments: nextEnrollments });
  }

  function addParticipantToSubCourse(subCourseId: string, groupId: string) {
    if (!draftCompany || !addParticipantDraft.trim()) return;
    const companyId = draftCompany.id;
    const name = addParticipantDraft.trim();
    const group = courseGroups.find((g) => g.id === groupId);
    if (!group) return;

    const nextEnrollmentId = `enr-${Date.now()}`;
    const newEnrollment: ParticipantEnrollment = {
      id: nextEnrollmentId,
      courseType: group.name as CourseType,
      subCourseName: subCourseId,
      startDate: "",
      endDate: "",
      totalHours: 0,
      status: "미수료",
    };

    const existing = participants.find(
      (p) => p.name === name && p.companyId === companyId,
    );

    if (existing) {
      upsertParticipant({
        ...existing,
        enrollments: [...existing.enrollments, newEnrollment],
      });
    } else {
      const newP: ParticipantRecord = {
        id: `pt-${Date.now()}`,
        name,
        companyId,
        companyName: draftCompany.companyName,
        position: "",
        phone: "",
        email: "",
        employmentInsurance: "미확인",
        enrollments: [newEnrollment],
      };
      upsertParticipant(newP);
    }

    setAddParticipantSubCourseId(null);
    setAddParticipantDraft("");
  }

  function showParticipantPopover(
    participant: any,
    event: React.MouseEvent,
  ) {
    if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    popoverTimerRef.current = setTimeout(() => {
      const popoverWidth = 220;
      const margin = 8;
      const hasSpaceOnRight = rect.right + popoverWidth + margin < window.innerWidth;
      
      const left = hasSpaceOnRight 
        ? rect.right + margin 
        : rect.left - popoverWidth - margin;

      setParticipantPopover({
        participant,
        style: {
          left,
          top: rect.top,
        },
      });
    }, 300);
  }

  function hideParticipantPopover() {
    if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
    popoverTimerRef.current = setTimeout(() => {
      setParticipantPopover(null);
    }, 200);
  }

  return (
    <>
      <PageHeader
        title="기업 관리"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={openChoiceModal}
          >
            <span>기업 추가</span>
          </button>
        }
      />

      <CompanyTable
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabItems={TAB_ITEMS}
        searchText={searchText}
        onSearchChange={setSearchText}
        onOpenChoiceModal={openChoiceModal}
        paginatedCompanies={paginated}
        allVisibleSelected={allVisibleSelected}
        onToggleVisibleSelection={toggleVisibleSelection}
        selectedCompanyIds={selectedCompanyIds}
        onToggleCompanySelection={toggleCompanySelection}
        onOpenEditDrawer={openEditDrawer}
        draftCompanyId={draftCompany?.id}
        onToggleSort={toggleSort}
        getSortIndicator={getSortIndicator}
        onLocationEnter={handleLocationEnter}
        onParticipationEnter={handleParticipationEnter}
        onTooltipLeave={() => setTooltipInfo(null)}
        selectAllRef={selectAllRef}
      />

      {tableNotice && <p className="table-notice">{tableNotice}</p>}

      {selectedCompanyIds.size > 0 && (
        <div
          className="floating-action-bar"
          role="region"
          aria-label="선택된 기업 액션바"
        >
          <div className="floating-action-inner">
            <p className="floating-action-count">
              {selectedCompanyIds.size}개 기업 선택됨
            </p>
            <div className="floating-action-buttons">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openEmailModal(Array.from(selectedCompanyIds))}
              >
                <Mail className="icon-sm" />
                <span>이메일 발송</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={exportSelectedCompanies}
              >
                <Download className="icon-sm" />
                <span>내보내기</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={clearSelectedCompanies}
              >
                <span>선택 해제</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "choice" && (
        <AddCompanyModal
          onClose={closeModal}
          onUploadClick={openUploadModal}
          onCreateDrawerClick={openCreateDrawer}
        />
      )}

      {activeModal === "upload" && (
        <UploadModal
          onClose={closeModal}
          uploadFile={uploadFile}
          uploadStep={uploadStep}
          rawRows={rawRows}
          columnMapping={columnMapping}
          onMappingChange={(col, field) => setColumnMapping(prev => ({ ...prev, [col]: field }))}
          onNextStep={goNextToPreview}
          systemFields={SYSTEM_FIELDS}
          uploadPreview={uploadPreview}
          uploadError={uploadError}
          onFileChange={handleFileChange}
          onDropzoneDrop={handleDropzoneDrop}
          onConfirm={confirmUpload}
          onReset={resetUpload}
        />
      )}

      {activeModal === "email" && (
        <EmailModal
          onClose={closeModal}
          emailRecipientIds={emailRecipientIds}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={setSelectedTemplateId}
          onSend={sendEmailTemplate}
          templates={initialTemplates}
        />
      )}

      {activeModal === "add-course" && (
        <AddCourseModal
          onClose={closeModal}
          isClosing={isClosing}
          addCourseGroupName={addCourseGroupName}
          onAddCourseGroupNameChange={setAddCourseGroupName}
          addCourseGroup={addCourseGroup}
          addCourseSelection={addCourseSelection}
          onToggleAddCourseSelectionItem={toggleAddCourseSelectionItem}
          onSave={saveAddCourseModal}
          courseGroups={courseGroups}
        />
      )}

      {draftCompany && (
        <CompanyDrawer
          draftCompany={draftCompany}
          drawerEditMode={drawerEditMode}
          drawerNotice={drawerNotice}
          drawerNameEditing={drawerNameEditing}
          drawerNameDraft={drawerNameDraft}
          expandedDrawerGroups={expandedDrawerGroups}
          expandedSubCourses={expandedSubCourses}
          addParticipantSubCourseId={addParticipantSubCourseId}
          addParticipantDraft={addParticipantDraft}
          isSaving={isSaving}
          isClosing={isClosing}
          courseGroups={courseGroups}
          onDrawerClose={handleDrawerClose}
          onDrawerNameEditToggle={setDrawerNameEditing}
          onDrawerNameDraftChange={setDrawerNameDraft}
          onUpdateDraftField={updateDraftField}
          onEnterEditMode={enterEditMode}
          onCancelEdit={handleCancelEdit}
          onSaveDraftCompany={saveDraftCompany}
          onOpenAddCourseModal={openAddCourseModal}
          onToggleDrawerGroup={toggleDrawerGroup}
          onToggleSubCourse={toggleSubCourse}
          onRemoveCourseProgram={removeCourseProgram}
          onAddParticipantClick={setAddParticipantSubCourseId}
          onAddParticipantDraftChange={setAddParticipantDraft}
          onConfirmAddParticipant={addParticipantToSubCourse}
          onCancelAddParticipant={() => { setAddParticipantSubCourseId(null); setAddParticipantDraft(""); }}
          onRemoveParticipant={removeParticipantFromSubCourse}
          onShowParticipantPopover={showParticipantPopover}
          onHideParticipantPopover={hideParticipantPopover}
          onOpenEmailModal={openEmailModal}
          getSubCourseByName={getSubCourseByName}
          toDotDate={toDotDate}
          getToday={getToday}
          formatBusinessRegNo={formatBusinessRegNo}
        />
      )}

      {cancelConfirmPending && (
        <div className="modal-backdrop confirm-modal">
          <div className="modal-panel modal-panel-sm">
            <div className="modal-header">
              <h3>변경 사항 취소</h3>
              <button type="button" className="icon-btn" onClick={() => setCancelConfirmPending(false)}><Check className="icon-sm" /></button>
            </div>
            <div className="modal-content"><p>내용이 저장되지 않았습니다. 취소하시겠습니까?</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCancelConfirmPending(false)}>계속 편집</button>
              <button className="btn btn-primary" onClick={confirmCancelEdit}>취소</button>
            </div>
          </div>
        </div>
      )}

      {tooltipInfo && (
        <div className="fixed-tooltip" style={tooltipInfo.style}>
          {tooltipInfo.content}
        </div>
      )}

      {participantPopover && (
        <div
          style={{
            position: "fixed",
            ...participantPopover.style,
            background: "#ffffff",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: "14px 16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 600,
            minWidth: 220,
          }}
          onMouseEnter={() => { if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current); }}
          onMouseLeave={hideParticipantPopover}
        >
          <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700 }}>{participantPopover.participant.name}</p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--color-text-tertiary)" }}>
            {draftCompany?.companyName}
          </p>
          <hr style={{ margin: "0 0 10px", border: "none", borderTop: "1px solid var(--color-border)" }} />
          <button
            type="button"
            style={{ color: "var(--color-primary)", fontWeight: 600, cursor: "pointer", background: "none", border: "none" }}
            onClick={() => {
              setParticipantPopover(null);
              navigate(`/participants?open=${participantPopover.participant.id}`);
            }}
          >
            상세보기 →
          </button>
        </div>
      )}
    </>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
