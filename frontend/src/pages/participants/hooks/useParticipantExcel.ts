import { useState } from "react";
import { useParticipantStore } from "../../../stores";
import type { ParticipantRecord, CompanyRecord } from "../../../types/models";

export function useParticipantExcel(allCompanies: CompanyRecord[], addToast: (msg: string) => void) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [uploadPreview, setUploadPreview] = useState<ParticipantRecord[] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const openUploadModal = () => {
    setUploadFile(null);
    setUploadStep(1);
    setRawRows([]);
    setColumnMapping({});
    setUploadPreview(null);
    setUploadError(null);
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadError(null);
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

        if (rows.length === 0) {
          setUploadError("인식된 데이터가 없습니다.");
          return;
        }

        const headers = Object.keys(rows[0]);
        const initialMapping: Record<string, string> = {};
        headers.forEach(h => {
          const lower = h.trim().toLowerCase();
          if (lower.includes("이름") || lower.includes("성명")) initialMapping[h] = "name";
          else if (lower.includes("기업") || lower.includes("회사") || lower.includes("소속")) initialMapping[h] = "companyName";
          else if (lower.includes("직위") || lower.includes("직급")) initialMapping[h] = "position";
          else if (lower.includes("연락처") || lower.includes("전화") || lower.includes("휴대폰")) initialMapping[h] = "phone";
          else if (lower.includes("이메일") || lower.includes("메일")) initialMapping[h] = "email";
          else if (lower.includes("고용보험") || lower.includes("보험")) initialMapping[h] = "employmentInsurance";
          else if (lower.includes("경력")) initialMapping[h] = "workExperience";
          else if (lower.includes("역량")) initialMapping[h] = "documentSkill";
          else initialMapping[h] = "__skip__";
        });

        setRawRows(rows);
        setColumnMapping(initialMapping);
        setUploadStep(2);
      } catch (err) {
        setUploadError("파일 파싱 실패. 형식을 확인해 주세요.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const goNextToPreview = () => {
    const nextPreview: ParticipantRecord[] = rawRows.map((row, idx) => {
      const p: any = {
        id: `upload-${Date.now()}-${idx}`,
        name: "",
        companyName: "",
        enrollments: [],
      };

      Object.entries(columnMapping).forEach(([col, field]) => {
        if (field === "__skip__") return;
        p[field] = String(row[col] || "").trim();
      });

      if (p.companyName) {
        const found = allCompanies.find(c => c.companyName.toLowerCase() === p.companyName.toLowerCase());
        if (found) p.companyId = found.id;
      }

      return p;
    }).filter(p => p.name.trim().length > 0);

    if (nextPreview.length === 0) {
      setUploadError("유효한 데이터가 없습니다. 매핑을 확인해 주세요.");
      return;
    }

    setUploadPreview(nextPreview);
    setUploadStep(3);
  };

  const confirmUpload = async () => {
    if (!uploadPreview) return;
    try {
      await useParticipantStore.getState().batchUpsertParticipants(uploadPreview);
      closeUploadModal();
      addToast(`${uploadPreview.length}명의 참여자가 등록되었습니다.`);
    } catch (err: any) {
      setUploadError(`업로드 실패: ${err.message}`);
    }
  };

  const resetUpload = () => {
    setUploadFile(null);
    setUploadStep(1);
    setRawRows([]);
    setColumnMapping({});
    setUploadPreview(null);
    setUploadError(null);
  };

  return {
    showUploadModal,
    openUploadModal,
    closeUploadModal,
    uploadFile,
    setUploadFile,
    uploadStep,
    rawRows,
    columnMapping,
    setColumnMapping,
    uploadPreview,
    uploadError,
    parseExcelFile,
    goNextToPreview,
    confirmUpload,
    resetUpload,
  };
}
