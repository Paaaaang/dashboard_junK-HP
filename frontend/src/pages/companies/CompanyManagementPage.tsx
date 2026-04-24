import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCompanyStore } from "../../stores";
import { Mail, Phone } from "lucide-react";
import {
  createEmptyCompany,
  cloneCompany,
  initialTemplates,
  programCatalog as initialProgramCatalog,
} from "../../constants";
import { PageHeader } from "../../components/PageHeader";
import type {
  CompanyRecord,
  CompanyParticipation,
  CourseType,
} from "../../types/models";

import { useCompanyFilters, TAB_ITEMS } from "./hooks/useCompanyFilters";
import { useCompanySort, SortKey } from "./hooks/useCompanySort";
import { CompanyTable } from "./CompanyTable";
import { CompanyDrawer, CourseParticipantsMap } from "./CompanyDrawer";
import { AddCompanyModal } from "./modals/AddCompanyModal";
import { UploadModal } from "./modals/UploadModal";
import { EmailModal } from "./modals/EmailModal";
import { CourseManagerModal, CourseGroup, CourseGroupForm, CourseDetailDraft, CourseDetail, AudienceOption } from "./modals/CourseManagerModal";
import { AddCourseModal } from "./modals/AddCourseModal";

type ActiveModal =
  | "choice"
  | "upload"
  | "course-manager"
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

const AUDIENCE_OPTIONS: AudienceOption[] = [
  "재직자 (고용보험 가입)",
  "재직자 (고용보험 미가입)",
  "기업 대표",
  "임원",
  "미래인재",
];

const ADDING_NEW_DETAIL = "__new__";

let localSequence = 0;
function createLocalId(prefix: string): string {
  localSequence += 1;
  return `${prefix}-${Date.now()}-${localSequence}`;
}

function createDefaultDetail(name: string, index: number): CourseDetail {
  const month = String((index % 9) + 4).padStart(2, "0");
  return {
    id: createLocalId("detail"),
    name,
    startDate: `2026-${month}-01`,
    endDate: `2026-${month}-03`,
    durationDays: 3,
    totalHours: 12,
    targetOutcome: 20 + index * 2,
  };
}

function buildInitialCourseGroups(): CourseGroup[] {
  const entries = Object.entries(initialProgramCatalog) as Array<
    [CourseType, string[]]
  >;
  return entries.map(([name, programs]) => {
    const baseAudiences: Record<CourseType, AudienceOption[]> = {
      훈련비과정: ["재직자 (고용보험 가입)", "재직자 (고용보험 미가입)"],
      지원비과정: ["기업 대표", "임원"],
      "공유개방 세미나": ["미래인재", "재직자 (고용보험 가입)"],
    };

    const groupId =
      name === "훈련비과정"
        ? TAB_GROUP_IDS.TRAINING
        : name === "지원비과정"
          ? TAB_GROUP_IDS.SUPPORT
          : TAB_GROUP_IDS.SEMINAR;

    return {
      id: groupId,
      name,
      audiences: baseAudiences[name],
      details: programs.map((program, index) =>
        createDefaultDetail(program, index),
      ),
    };
  });
}

const INITIAL_COURSE_GROUPS = buildInitialCourseGroups();

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

const INITIAL_COMPANY_PARTICIPANTS: Record<string, CourseParticipantsMap> = {
  "company-1": {
    [TAB_GROUP_IDS.TRAINING]: {
      "smart-factory": {
        id: "smart-factory",
        name: "스마트팩토리 실무",
        startDate: "2026-03-15",
        endDate: "2026-03-17",
        totalHours: 24,
        participants: [
          {
            id: "pt-1",
            name: "박진우",
            email: "jinwoo@hanbit.co.kr",
            phone: "010-1111-2222",
            position: "대리",
            completedCourses: 2,
            totalCourses: 3,
            completed: true,
          },
          {
            id: "pt-2",
            name: "김민지",
            email: "minji@hanbit.co.kr",
            phone: "010-3333-4444",
            position: "사원",
            completedCourses: 0,
            totalCourses: 3,
            completed: false,
          },
          {
            id: "pt-3",
            name: "이태호",
            email: "taeho@hanbit.co.kr",
            phone: "010-5555-6666",
            position: "과장",
            completedCourses: 3,
            totalCourses: 3,
            completed: true,
          },
        ],
      },
    },
  },
  "company-2": {
    [TAB_GROUP_IDS.SUPPORT]: {
      "quality-mgmt": {
        id: "quality-mgmt",
        name: "품질관리 고도화",
        startDate: "2026-04-01",
        endDate: "2026-04-03",
        totalHours: 16,
        participants: [
          {
            id: "pt-4",
            name: "최수진",
            email: "sujin@mirae-precision.com",
            phone: "010-7777-8888",
            position: "팀장",
            completedCourses: 1,
            totalCourses: 1,
            completed: true,
          },
        ],
      },
    },
  },
};

function cloneGroupToForm(group: CourseGroup): CourseGroupForm {
  return {
    name: group.name,
    audiences: [...group.audiences],
    details: group.details.map((detail) => ({ ...detail })),
  };
}

function createEmptyGroupForm(): CourseGroupForm {
  return {
    name: "",
    audiences: [],
    details: [],
  };
}

function createEmptyDetailDraft(): CourseDetailDraft {
  return {
    name: "",
    startDate: "",
    endDate: "",
    durationDays: "",
    totalHours: "",
    targetOutcome: "",
  };
}

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

function calculateDurationDays(
  startDate: string,
  endDate: string,
): number | null {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const milliseconds = end.getTime() - start.getTime();
  if (Number.isNaN(milliseconds) || milliseconds < 0) return null;
  return Math.floor(milliseconds / (1000 * 60 * 60 * 24)) + 1;
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

  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>(
    INITIAL_COURSE_GROUPS,
  );
  
  const { companies: rawCompanies, setCompanies: setGlobalCompanies } = useCompanyStore();
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

  const [managerSelectedGroupId, setManagerSelectedGroupId] = useState<
    string | null
  >(INITIAL_COURSE_GROUPS[0]?.id ?? null);
  const [managerExpandedGroups, setManagerExpandedGroups] = useState<
    Set<string>
  >(new Set([INITIAL_COURSE_GROUPS[0]?.id ?? ""]));
  const [managerGroupForm, setManagerGroupForm] = useState<CourseGroupForm>(
    () =>
      INITIAL_COURSE_GROUPS[0]
        ? cloneGroupToForm(INITIAL_COURSE_GROUPS[0])
        : createEmptyGroupForm(),
  );
  const [managerDetailForm, setManagerDetailForm] =
    useState<CourseDetailDraft | null>(null);
  const [managerEditingDetailId, setManagerEditingDetailId] = useState<
    string | null
  >(null);
  const [managerError, setManagerError] = useState("");
  const [managerMessage, setManagerMessage] = useState("");
  const [pendingDeleteGroupId, setPendingDeleteGroupId] = useState<
    string | null
  >(null);
  const [managerCancelConfirmPending, setManagerCancelConfirmPending] =
    useState(false);

  const isManagerGroupModified = useMemo(() => {
    if (!managerSelectedGroupId) return true;
    const original = courseGroups.find((g) => g.id === managerSelectedGroupId);
    if (!original) return true;
    const current = { id: original.id, ...managerGroupForm };
    return JSON.stringify(original) !== JSON.stringify(current);
  }, [managerSelectedGroupId, managerGroupForm, courseGroups]);

  const [editModeSnapshot, setEditModeSnapshot] =
    useState<CompanyRecord | null>(null);
  const [drawerNameEditing, setDrawerNameEditing] = useState(false);
  const [drawerNameDraft, setDrawerNameDraft] = useState("");
  const [cancelConfirmPending, setCancelConfirmPending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving] = useState(false);

  const [addCourseGroupName, setAddCourseGroupName] = useState("");
  const [addCourseSelection, setAddCourseSelection] = useState<Set<string>>(
    new Set(),
  );

  const lastSelectedIdRef = useRef<string | null>(null);

  const [companyParticipants, setCompanyParticipants] =
    useState<Record<string, CourseParticipantsMap>>(INITIAL_COMPANY_PARTICIPANTS);

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
    if (activeModal === "course-manager" && isManagerGroupModified) {
      setManagerCancelConfirmPending(true);
      return;
    }
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
    setManagerError("");
    setManagerMessage("");
    setPendingDeleteGroupId(null);
    setManagerDetailForm(null);
    setManagerEditingDetailId(null);
    setManagerCancelConfirmPending(false);
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

  function saveDraftCompany() {
    if (!draftCompany) return;

    const normalized = normalizeCompanyParticipations(
      draftCompany,
      courseGroups,
    );
    setCompanies((current) => {
      const exists = current.some((company) => company.id === normalized.id);
      if (exists) {
        return current.map((company) =>
          company.id === normalized.id ? normalized : company,
        );
      }
      return [normalized, ...current];
    });

    closeDrawer();
  }

  function getSortIndicator(key: SortKey): string {
    if (sortState.key !== key || !sortState.direction) {
      return "↕";
    }
    return sortState.direction === "asc" ? "↑" : "↓";
  }

  function getSortIndicatorClass(key: SortKey): string {
    if (sortState.key !== key || !sortState.direction) {
      return "sort-indicator sort-indicator-idle";
    }
    return "sort-indicator sort-indicator-active";
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

  function openCourseManagerModal() {
    const firstGroup = courseGroups[0];
    setManagerSelectedGroupId(firstGroup?.id ?? null);
    setManagerGroupForm(
      firstGroup ? cloneGroupToForm(firstGroup) : createEmptyGroupForm(),
    );
    setManagerDetailForm(null);
    setManagerEditingDetailId(null);
    setManagerError("");
    setManagerMessage("");
    setPendingDeleteGroupId(null);
    setActiveModal("course-manager");
  }

  function selectGroupForManager(groupId: string) {
    const group = courseGroups.find((item) => item.id === groupId);
    if (!group) return;

    setManagerSelectedGroupId(group.id);
    setManagerGroupForm(cloneGroupToForm(group));
    setManagerDetailForm(null);
    setManagerEditingDetailId(null);
    setManagerError("");
    setManagerMessage("");
  }

  function startCreateCourseGroup() {
    setManagerSelectedGroupId(null);
    setManagerGroupForm(createEmptyGroupForm());
    setManagerDetailForm(null);
    setManagerEditingDetailId(null);
    setManagerError("");
    setManagerMessage("");
  }

  function toggleManagerAudience(target: AudienceOption) {
    setManagerGroupForm((previous) => {
      const hasTarget = previous.audiences.includes(target);
      const nextAudiences = hasTarget
        ? previous.audiences.filter((audience) => audience !== target)
        : [...previous.audiences, target];
      return { ...previous, audiences: nextAudiences };
    });
  }

  function startAddDetail() {
    setManagerDetailForm(createEmptyDetailDraft());
    setManagerEditingDetailId(ADDING_NEW_DETAIL);
  }

  function startEditDetail(groupId: string, detailId: string) {
    const sourceGroup =
      groupId === managerSelectedGroupId
        ? {
            id: groupId,
            ...managerGroupForm,
          }
        : courseGroups.find((group) => group.id === groupId);

    const detail = sourceGroup?.details.find((item) => item.id === detailId);
    if (!detail || !sourceGroup) return;

    if (groupId !== managerSelectedGroupId) {
      setManagerSelectedGroupId(groupId);
      setManagerGroupForm(cloneGroupToForm(sourceGroup as CourseGroup));
    }

    setManagerEditingDetailId(detail.id);
    setManagerDetailForm({
      name: detail.name,
      startDate: detail.startDate,
      endDate: detail.endDate,
      durationDays: String(detail.durationDays),
      totalHours: String(detail.totalHours),
      targetOutcome: String(detail.targetOutcome),
    });
  }

  function removeDetailFromForm(groupId: string, detailId: string) {
    if (groupId !== managerSelectedGroupId) {
      const group = courseGroups.find((item) => item.id === groupId);
      if (!group) return;
      setManagerSelectedGroupId(groupId);
      setManagerGroupForm({
        name: group.name,
        audiences: [...group.audiences],
        details: group.details.filter((detail) => detail.id !== detailId),
      });
      setManagerDetailForm(null);
      setManagerEditingDetailId(null);
      return;
    }

    setManagerGroupForm((previous) => ({
      ...previous,
      details: previous.details.filter((detail) => detail.id !== detailId),
    }));

    if (managerEditingDetailId === detailId) {
      setManagerEditingDetailId(null);
      setManagerDetailForm(null);
    }
  }

  function applyDetailDraft() {
    if (!managerDetailForm) return;
    const trimmedName = managerDetailForm.name.trim();
    if (!trimmedName) {
      setManagerError("세부 과정명을 입력해 주세요.");
      return;
    }

    const autoDuration = calculateDurationDays(
      managerDetailForm.startDate,
      managerDetailForm.endDate,
    );
    const durationValue =
      Number(managerDetailForm.durationDays) || autoDuration || 0;
    const totalHours = Number(managerDetailForm.totalHours) || 0;
    const targetOutcome = Number(managerDetailForm.targetOutcome) || 0;

    if (durationValue <= 0 || totalHours <= 0 || targetOutcome <= 0) {
      setManagerError("진행 기간, 시간, 목표 성과는 1 이상 값이 필요합니다.");
      return;
    }

    const isEditing =
      managerEditingDetailId && managerEditingDetailId !== ADDING_NEW_DETAIL;

    const nextDetail: CourseDetail = {
      id: isEditing ? managerEditingDetailId! : createLocalId("detail"),
      name: trimmedName,
      startDate: managerDetailForm.startDate,
      endDate: managerDetailForm.endDate,
      durationDays: durationValue,
      totalHours,
      targetOutcome,
    };

    setManagerGroupForm((previous) => {
      if (isEditing) {
        return {
          ...previous,
          details: previous.details.map((detail) =>
            detail.id === managerEditingDetailId ? nextDetail : detail,
          ),
        };
      }

      return {
        ...previous,
        details: [...previous.details, nextDetail],
      };
    });

    setManagerDetailForm(null);
    setManagerEditingDetailId(null);
    setManagerError("");
  }

  function saveCourseGroup() {
    const trimmedName = managerGroupForm.name.trim();
    if (!trimmedName) {
      setManagerError("과정 구분 이름을 입력해 주세요.");
      return;
    }

    const duplicate = courseGroups.find(
      (group) =>
        group.name.toLowerCase() === trimmedName.toLowerCase() &&
        group.id !== managerSelectedGroupId,
    );
    if (duplicate) {
      setManagerError("동일한 과정 구분 이름이 이미 존재합니다.");
      return;
    }

    if (managerGroupForm.details.length === 0) {
      setManagerError("세부 과정을 최소 1개 이상 등록해 주세요.");
      return;
    }

    const nextGroup: CourseGroup = {
      id: managerSelectedGroupId ?? createLocalId("group"),
      name: trimmedName,
      audiences: [...managerGroupForm.audiences],
      details: managerGroupForm.details.map((detail) => ({ ...detail })),
    };

    if (managerSelectedGroupId) {
      const oldGroup = courseGroups.find(
        (group) => group.id === managerSelectedGroupId,
      );
      if (!oldGroup) return;

      const removedDetailNames = oldGroup.details
        .map((detail) => detail.name)
        .filter(
          (name) =>
            !nextGroup.details.some(
              (detail) => detail.name.toLowerCase() === name.toLowerCase(),
            ),
        );

      setCourseGroups((current) =>
        current.map((group) => (group.id === oldGroup.id ? nextGroup : group)),
      );

      setCompanies((current) =>
        current.map((company) => {
          let matched = false;
          const nextParticipations = company.participations.map(
            (participation) => {
              if (participation.courseType !== oldGroup.name) {
                return participation;
              }
              matched = true;
              const nextProgramNames = participation.programNames.filter(
                (programName) => !removedDetailNames.includes(programName),
              );
              return {
                ...participation,
                courseType: nextGroup.name,
                programNames: nextProgramNames,
                enabled:
                  nextProgramNames.length > 0 ? participation.enabled : false,
                status:
                  nextProgramNames.length > 0 ? participation.status : "미참여",
              };
            },
          );

          if (!matched) {
            nextParticipations.push({
              courseType: nextGroup.name,
              enabled: false,
              programNames: [],
              status: "미참여",
            });
          }

          return { ...company, participations: nextParticipations };
        }),
      );

      setManagerGroupForm(cloneGroupToForm(nextGroup));
      setManagerMessage("과정 구분이 저장되었습니다.");
      setManagerError("");
      return;
    }

    setCourseGroups((current) => [...current, nextGroup]);
    setCompanies((current) =>
      current.map((company) => ({
        ...company,
        participations: [
          ...company.participations,
          {
            courseType: nextGroup.name,
            enabled: false,
            programNames: [],
            status: "미참여",
          },
        ],
      })),
    );

    setManagerSelectedGroupId(nextGroup.id);
    setManagerGroupForm(cloneGroupToForm(nextGroup));
    setManagerMessage("새 과정 구분이 추가되었습니다.");
    setManagerError("");
  }

  function confirmDeleteCourseGroup() {
    if (!pendingDeleteGroupId) return;
    const target = courseGroups.find(
      (group) => group.id === pendingDeleteGroupId,
    );
    if (!target) return;

    setCourseGroups((current) =>
      current.filter((group) => group.id !== target.id),
    );
    setCompanies((current) =>
      current.map((company) => ({
        ...company,
        participations: company.participations.filter(
          (participation) => participation.courseType !== target.name,
        ),
      })),
    );

    const remaining = courseGroups.filter((group) => group.id !== target.id);
    const firstGroup = remaining[0];
    setManagerSelectedGroupId(firstGroup?.id ?? null);
    setManagerGroupForm(
      firstGroup ? cloneGroupToForm(firstGroup) : createEmptyGroupForm(),
    );
    setManagerMessage("과정 구분이 삭제되었습니다.");
    setManagerError("");
    setPendingDeleteGroupId(null);
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

  function toggleManagerGroup(groupId: string, event: React.MouseEvent) {
    event.stopPropagation();
    setManagerExpandedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
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

    setTooltipInfo({
      content: (
        <>
          {participations.map((participation) => (
            <div key={participation.courseType} className="tooltip-course-row">
              <span className="tooltip-course-type">
                {participation.courseType}
              </span>
              <span className="tooltip-course-names">
                {participation.programNames.join(", ") || "세부 과정 없음"}
              </span>
            </div>
          ))}
        </>
      ),
      style: {
        left: rect.left,
        top: rect.top + rect.height / 2,
        transform: "translateX(calc(-100% - 8px)) translateY(-50%)",
      },
    });
  }

  function getCourseTypeTagStyle(courseType: string): React.CSSProperties {
    if (courseType === "훈련비과정") {
      return { background: "#dcfce7", color: "#166534" };
    }
    if (courseType === "지원비과정") {
      return { background: "#dbeafe", color: "#1d4ed8" };
    }
    return { background: "#fef9c3", color: "#854d0e" };
  }

  function getCourseTypeTagLabel(courseType: string): string {
    if (courseType === "훈련비과정") return "훈련";
    if (courseType === "지원비과정") return "지원";
    return "세미나";
  }

  function getSubCoursesForCompany(
    companyId: string,
    groupId: string,
  ) {
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
    if (!draftCompany) return;
    const companyId = draftCompany.id;
    setCompanyParticipants((prev) => {
      const groupMap = { ...(prev[companyId]?.[groupId] ?? {}) };
      const sc = groupMap[subCourseId];
      if (!sc) return prev;
      groupMap[subCourseId] = {
        ...sc,
        participants: sc.participants.filter((p) => p.id !== participantId),
      };
      return {
        ...prev,
        [companyId]: {
          ...(prev[companyId] ?? {}),
          [groupId]: groupMap,
        },
      };
    });
  }

  function addParticipantToSubCourse(
    subCourseId: string,
    groupId: string,
  ) {
    if (!draftCompany || !addParticipantDraft.trim()) return;
    const companyId = draftCompany.id;
    const name = addParticipantDraft.trim();

    const newParticipant = {
      id: createLocalId("pt"),
      name: name,
      email: "",
      phone: "",
      position: "",
      completedCourses: 0,
      totalCourses: 1,
      completed: false,
    };

    setCompanyParticipants((prev) => {
      const groupMap = { ...(prev[companyId]?.[groupId] ?? {}) };
      const sc = groupMap[subCourseId];
      if (sc) {
        groupMap[subCourseId] = {
          ...sc,
          participants: [...sc.participants, newParticipant],
        };
      } else {
        groupMap[subCourseId] = {
          id: subCourseId,
          name: subCourseId,
          startDate: "",
          endDate: "",
          totalHours: 0,
          participants: [newParticipant],
        };
      }
      return {
        ...prev,
        [companyId]: {
          ...(prev[companyId] ?? {}),
          [groupId]: groupMap,
        },
      };
    });
    setAddParticipantDraft("");
    setAddParticipantSubCourseId(null);
  }

  function showParticipantPopover(
    participant: any,
    event: React.MouseEvent,
  ) {
    if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    popoverTimerRef.current = setTimeout(() => {
      setParticipantPopover({
        participant,
        style: {
          left: rect.right + 8,
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
        onOpenCourseManager={openCourseManagerModal}
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
        getSortIndicatorClass={getSortIndicatorClass}
        getCourseTypeTagStyle={getCourseTypeTagStyle}
        getCourseTypeTagLabel={getCourseTypeTagLabel}
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
                <Phone className="icon-sm" />
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

      {activeModal === "course-manager" && (
        <CourseManagerModal
          onClose={closeModal}
          courseGroups={courseGroups}
          managerSelectedGroupId={managerSelectedGroupId}
          managerExpandedGroups={managerExpandedGroups}
          managerGroupForm={managerGroupForm}
          managerDetailForm={managerDetailForm}
          managerEditingDetailId={managerEditingDetailId}
          managerError={managerError}
          managerMessage={managerMessage}
          audienceOptions={AUDIENCE_OPTIONS}
          addingNewDetailId={ADDING_NEW_DETAIL}
          isManagerGroupModified={isManagerGroupModified}
          onSelectGroup={selectGroupForManager}
          onStartCreateGroup={startCreateCourseGroup}
          onToggleGroup={toggleManagerGroup}
          onDeleteGroupClick={setPendingDeleteGroupId}
          onGroupNameChange={(name) => setManagerGroupForm(prev => ({ ...prev, name }))}
          onToggleAudience={toggleManagerAudience}
          onStartAddDetail={startAddDetail}
          onStartEditDetail={startEditDetail}
          onRemoveDetail={removeDetailFromForm}
          onDetailFormChange={(field, value) => setManagerDetailForm(prev => prev ? ({ ...prev, [field]: value }) : prev)}
          onApplyDetailDraft={applyDetailDraft}
          onCancelDetailEdit={() => { setManagerDetailForm(null); setManagerEditingDetailId(null); }}
          onSaveGroup={saveCourseGroup}
          calculateDurationDays={calculateDurationDays}
          toDotDate={toDotDate}
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

      {pendingDeleteGroupId && (
        <div className="modal-backdrop confirm-modal">
          <div className="modal-panel modal-panel-sm">
            <div className="modal-header">
              <h3>과정 삭제</h3>
              <button type="button" className="icon-btn" onClick={() => setPendingDeleteGroupId(null)}><X className="icon-sm" /></button>
            </div>
            <div className="modal-content"><p>과정을 삭제하시겠습니까?</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPendingDeleteGroupId(null)}>취소</button>
              <button className="btn btn-primary" onClick={confirmDeleteCourseGroup}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {managerCancelConfirmPending && (
        <div className="modal-backdrop confirm-modal">
          <div className="modal-panel modal-panel-sm">
            <div className="modal-header">
              <h3>변경 사항 취소</h3>
              <button type="button" className="icon-btn" onClick={() => setManagerCancelConfirmPending(false)}><X className="icon-sm" /></button>
            </div>
            <div className="modal-content"><p>내용이 저장되지 않았습니다. 닫으시겠습니까?</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setManagerCancelConfirmPending(false)}>계속 편집</button>
              <button className="btn btn-primary" onClick={() => { setManagerCancelConfirmPending(false); forceCloseModal(); }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {cancelConfirmPending && (
        <div className="modal-backdrop confirm-modal">
          <div className="modal-panel modal-panel-sm">
            <div className="modal-header">
              <h3>변경 사항 취소</h3>
              <button type="button" className="icon-btn" onClick={() => setCancelConfirmPending(false)}><X className="icon-sm" /></button>
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
