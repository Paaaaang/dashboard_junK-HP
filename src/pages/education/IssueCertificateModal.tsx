import { useEffect, useState } from "react";
import { Download, FileWarning, Loader2, X } from "lucide-react";
import { supabase } from "@/api/supabase";
import { useToastStore } from "@/stores";
import {
  allocateCertificateNos,
  downloadBlob,
  generateOnePdf,
  generateBatchZip,
  isoToKoreanDate,
  isoToTrainingDate,
  mmddFromIso,
  type CertificateHtmlData,
} from "@/utils/certificate";

export interface RecipientInput {
  enrollmentId: string;
  participantId: string;
  name: string;
  birthDate?: string;
  companyName?: string;
  completionDate?: string;
  certificateNo?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recipients: RecipientInput[];
  courseName: string;
  onIssued: () => void;
}

export function IssueCertificateModal({ isOpen, onClose, recipients, courseName, onIssued }: Props) {
  const { addToast } = useToastStore();

  const [assignedNos, setAssignedNos] = useState<Record<string, string>>({});
  const [isPreparing, setIsPreparing] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsPreparing(true);
    setAssignedNos({});
    setProgress(null);

    const allocate = async () => {
      const needs = recipients.filter((r) => !r.certificateNo);
      if (needs.length === 0) { setIsPreparing(false); return; }

      const sorted = [...needs].sort((a, b) => a.name.localeCompare(b.name, "ko"));
      const today = new Date().toISOString().slice(0, 10);
      const completionDate = sorted[0]?.completionDate || today;
      const year = Number(completionDate.slice(0, 4));
      const mmdd = mmddFromIso(completionDate);

      try {
        const { data, error } = await supabase
          .from("enrollments")
          .select("certificate_no")
          .like("certificate_no", `${year}-${mmdd}%`);
        if (error) throw error;
        const existing = (data || []).map((r: any) => r.certificate_no);
        const next = allocateCertificateNos(existing, year, mmdd, sorted.length);
        const map: Record<string, string> = {};
        sorted.forEach((r, i) => { map[r.enrollmentId] = next[i]; });
        setAssignedNos(map);
      } catch (err: any) {
        addToast(`수료번호 채번 실패: ${err.message}`, "error");
      } finally {
        setIsPreparing(false);
      }
    };

    allocate();
  }, [isOpen, recipients, addToast]);

  if (!isOpen) return null;

  const handleIssue = async () => {
    setIssuing(true);
    setProgress({ current: 0, total: recipients.length });

    try {
      const today = new Date().toISOString().slice(0, 10);

      const certDataList: CertificateHtmlData[] = recipients.map((r) => ({
        certNo: r.certificateNo || assignedNos[r.enrollmentId] || "",
        name: r.name,
        birthDate: r.birthDate ? isoToKoreanDate(r.birthDate) : "",
        company: r.companyName,
        courseName,
        trainingDate: isoToTrainingDate(r.completionDate || today),
        totalHours: "",
        issueDate: isoToKoreanDate(today),
      }));

      if (certDataList.length === 1) {
        setProgress({ current: 0, total: 1 });
        const pdfBlob = await generateOnePdf(certDataList[0]);
        setProgress({ current: 1, total: 1 });
        downloadBlob(pdfBlob, `수료증_${certDataList[0].name}.pdf`);
      } else {
        const zipBlob = await generateBatchZip(certDataList, (cur, total) =>
          setProgress({ current: cur, total })
        );
        downloadBlob(zipBlob, `수료증_${today}.zip`);
      }

      // 새로 채번된 수료번호 DB 저장
      const newNos = recipients.filter((r) => !r.certificateNo && assignedNos[r.enrollmentId]);
      if (newNos.length > 0) {
        await Promise.all(
          newNos.map((r) =>
            supabase
              .from("enrollments")
              .update({ certificate_no: assignedNos[r.enrollmentId] })
              .eq("id", r.enrollmentId)
          )
        );
      }

      addToast(`${recipients.length}건의 수료증이 발급되었습니다.`, "success");
      onIssued();
      onClose();
    } catch (err: any) {
      addToast(`발급 실패: ${err.message}`, "error");
    } finally {
      setIssuing(false);
      setProgress(null);
    }
  };

  const canIssue = !isPreparing && !issuing && recipients.length > 0;

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-[var(--z-popover)] flex items-center justify-center p-4">
      <div className="bg-surface rounded-[32px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[80vh] overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-border/30">
          <div>
            <h3 className="text-lg font-black text-primary">수료증 발급</h3>
            <p className="text-xs text-tertiary font-medium mt-0.5">
              {courseName} · 총 {recipients.length}명
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-tertiary hover:text-primary rounded-xl hover:bg-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">

          {/* 수료자 목록 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-tertiary">
                발급 명단
              </label>
              {isPreparing && (
                <span className="flex items-center gap-1 text-[10px] text-tertiary font-bold">
                  <Loader2 size={10} className="animate-spin" /> 수료번호 채번 중...
                </span>
              )}
            </div>
            <div className="border border-border/40 rounded-2xl overflow-hidden">
              <div className="max-h-64 overflow-y-auto divide-y divide-border/20">
                {recipients.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-tertiary">
                    <FileWarning size={24} />
                    <p className="text-xs font-bold">수료 상태인 참여자를 선택하세요.</p>
                  </div>
                ) : recipients.map((r) => {
                  const certNo = r.certificateNo || assignedNos[r.enrollmentId];
                  const isNew = !r.certificateNo && !!certNo;
                  return (
                    <div key={r.enrollmentId} className="flex items-center justify-between px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-primary truncate">{r.name}</p>
                        <p className="text-[11px] font-medium text-tertiary truncate">
                          {r.companyName || "소속 없음"}
                        </p>
                      </div>
                      {certNo ? (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ml-3 ${
                          isNew
                            ? "text-success bg-success/5 border-success/20"
                            : "text-info bg-info/5 border-info/10"
                        }`}>
                          제{certNo}호{isNew && " (신규)"}
                        </span>
                      ) : isPreparing ? (
                        <span className="text-[10px] text-disabled font-mono ml-3">채번 중...</span>
                      ) : (
                        <span className="text-[10px] text-error font-bold ml-3">번호 없음</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-7 py-4 border-t border-border/30 bg-surface-subtle/30 flex items-center justify-between">
          <div className="text-[11px] text-tertiary font-medium">
            {progress ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin" />
                {progress.current} / {progress.total} 생성 중...
              </span>
            ) : (
              "발급 후 수료번호가 자동 저장됩니다."
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-secondary hover:bg-surface-subtle transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleIssue}
              disabled={!canIssue}
              className="flex items-center gap-1.5 px-5 py-2 bg-brand-primary text-white rounded-xl text-xs font-black shadow-md shadow-brand-primary/25 hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Download size={13} />
              {issuing ? "발급 중..." : recipients.length === 1 ? "PDF 발급" : `${recipients.length}건 ZIP 발급`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
