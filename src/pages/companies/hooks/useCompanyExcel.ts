import { useState, useCallback } from "react";
import { useCompanyStore } from "@/stores";
import type { CompanyRecord, CourseGroup } from "@/types/models";

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

function createEmptyCompany(): CompanyRecord {
  return {
    id: `new-${Date.now()}`,
    companyName: "",
    businessRegNo: "",
    location: "",
    representative: "",
    manager: "",
    phone: "",
    email: "",
    mouSigned: false,
    mouSignedDate: undefined,
    createdAt: new Date().toISOString(),
    participations: [],
  };
}

export function useCompanyExcel(courseGroups: CourseGroup[]) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [uploadPreview, setUploadPreview] = useState<CompanyRecord[] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const resetUpload = useCallback(() => {
    setUploadFile(null);
    setUploadStep(1);
    setRawRows([]);
    setColumnMapping({});
    setUploadPreview(null);
    setUploadError(null);
  }, []);

  const parseExcelFile = (file: File) => {
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
  };

  const goNextToPreview = () => {
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
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadError(null);
    setUploadPreview(null);
    parseExcelFile(file);
  };

  const handleDropzoneDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadError(null);
    setUploadPreview(null);
    parseExcelFile(file);
  };

  const confirmUpload = async () => {
    if (!uploadPreview || uploadPreview.length === 0) return;
    try {
      await useCompanyStore.getState().batchUpsertCompanies(uploadPreview);
    } catch (err: any) {
      setUploadError(`업로드 실패: ${err.message}`);
      throw err;
    }
  };

  return {
    uploadFile,
    uploadStep,
    rawRows,
    columnMapping,
    setColumnMapping,
    uploadPreview,
    uploadError,
    setUploadError,
    resetUpload,
    goNextToPreview,
    handleFileChange,
    handleDropzoneDrop,
    confirmUpload,
  };
}
