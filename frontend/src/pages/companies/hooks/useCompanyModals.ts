import { useState, useCallback } from "react";
import { initialTemplates } from "../../../constants";

export type ActiveModal =
  | "choice"
  | "upload"
  | "course-manager"
  | "email"
  | "add-course"
  | null;

export function useCompanyModals() {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  
  // Email Modal State
  const [emailRecipientIds, setEmailRecipientIds] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialTemplates[0]?.id ?? "",
  );

  // Upload Modal State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [uploadPreview, setUploadPreview] = useState<any[] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const openEmailModal = useCallback((companyIds: string[]) => {
    if (companyIds.length === 0) return;
    setEmailRecipientIds(companyIds);
    setSelectedTemplateId(initialTemplates[0]?.id ?? "");
    setActiveModal("email");
  }, []);

  const openUploadModal = useCallback(() => {
    setUploadFile(null);
    setUploadStep(1);
    setRawRows([]);
    setColumnMapping({});
    setUploadPreview(null);
    setUploadError(null);
    setActiveModal("upload");
  }, []);

  const resetUpload = useCallback(() => {
    setUploadFile(null);
    setUploadStep(1);
    setRawRows([]);
    setColumnMapping({});
    setUploadPreview(null);
    setUploadError(null);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  return {
    activeModal,
    setActiveModal,
    emailRecipientIds,
    setEmailRecipientIds,
    selectedTemplateId,
    setSelectedTemplateId,
    uploadFile,
    setUploadFile,
    uploadStep,
    setUploadStep,
    rawRows,
    setRawRows,
    columnMapping,
    setColumnMapping,
    uploadPreview,
    setUploadPreview,
    uploadError,
    setUploadError,
    openEmailModal,
    openUploadModal,
    resetUpload,
    closeModal,
  };
}
