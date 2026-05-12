import { useState, useEffect } from "react";
import { X, Shield, Save, RefreshCw, Server, CheckCircle2 } from "lucide-react";
import apiClient from "../../api/client";
import { useToastStore } from "../../stores/useToastStore";
import { ModalPortal } from "../Modal";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { addToast } = useToastStore();
  const [naverEmail, setNaverEmail] = useState("");
  const [naverPassword, setNaverPassword] = useState("");
  const [smtpHost, setNaverHost] = useState("smtp.naver.com"); // Default
  const [smtpPort, setSmtpPort] = useState("465"); // Default
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await apiClient.get("v1/settings");
        if (data.naver_smtp) {
          setNaverEmail(data.naver_smtp.email || "");
          setNaverPassword(data.naver_smtp.password || "");
          setNaverHost(data.naver_smtp.host || "smtp.naver.com");
          setSmtpPort(data.naver_smtp.port || "465");
        }
      } catch (err) {
        addToast("설정을 불러오지 못했습니다.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [addToast]);

  const handleTestConnection = async () => {
    if (!naverEmail || !naverPassword || !smtpHost || !smtpPort) {
      addToast("테스트를 위해 모든 정보(아이디, 비밀번호, 서버, 포트)를 입력해주세요.", "error");
      return;
    }
    setIsTesting(true);
    setTestResult("idle");
    try {
      await apiClient.post("v1/settings/smtp/test", {
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        email: naverEmail,
        password: naverPassword
      });
      setTestResult("success");
      addToast("SMTP 연결 테스트 성공", "success");
    } catch (err: any) {
      setTestResult("error");
      const errorMessage = err.response?.data?.error || "SMTP 연결 실패. 정보를 확인해주세요.";
      addToast(errorMessage, "error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!naverEmail || !naverPassword || !smtpHost || !smtpPort) {
      addToast("필수 입력란(아이디, 비밀번호, 서버 주소, 포트)을 모두 입력해 주세요.", "error");
      return;
    }
    setIsSaving(true);
    try {
      await Promise.all([
        apiClient.put("v1/settings/naver_smtp", { 
          value: { email: naverEmail, password: naverPassword, host: smtpHost, port: smtpPort } 
        })
      ]);
      addToast("환경 설정이 저장되었습니다.", "success");
      onClose();
    } catch (err) {
      addToast("저장에 실패했습니다.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalPortal>      <div className="fixed inset-0 z-[300] flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-200 pt-8">
        <div className="bg-surface rounded-[32px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col flex-shrink-0 animate-in zoom-in-95 duration-200">
        <header className="px-8 py-6 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
              <Shield size={20} />
            </div>
            <h3 className="text-lg font-bold text-primary">계정 및 환경 설정</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-subtle rounded-full transition-all">
            <X size={20} />
          </button>
        </header>

        <div className="p-8 space-y-8 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center py-12 gap-4">
              <RefreshCw className="animate-spin text-brand-primary" size={32} />
              <p className="text-sm font-bold text-tertiary">데이터 로딩 중...</p>
            </div>
          ) : (
            <>
              {/* Essential Account Section */}
              <section className="space-y-4">
                <h4 className="text-xs font-black text-tertiary uppercase tracking-widest flex items-center gap-2">
                  <Server size={14} /> 발송/수신 서버 및 계정 (필수)
                </h4>
                <div className="grid gap-4">
                  <div className="grid grid-cols-[2fr_1fr] gap-4">
                    <label className="field">
                      서버 주소 (ex: smtp.naver.com)
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-surface-subtle border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="smtp.naver.com"
                        value={smtpHost}
                        onChange={(e) => setNaverHost(e.target.value)}
                      />
                    </label>
                    <label className="field">
                      포트
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-surface-subtle border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="465"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="field">
                      네이버 아이디 (이메일)
                      <input 
                        type="email" 
                        className="w-full px-4 py-2.5 bg-surface-subtle border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="example@naver.com"
                        value={naverEmail}
                        onChange={(e) => setNaverEmail(e.target.value)}
                      />
                    </label>
                    <label className="field">
                      애플리케이션 비밀번호
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-surface-subtle border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="••••••••"
                        value={naverPassword}
                        onChange={(e) => { setNaverPassword(e.target.value); setTestResult("idle"); }}
                      />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting || !naverEmail || !naverPassword || !smtpHost || !smtpPort}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                        testResult === "success" 
                          ? "bg-green-500/10 text-green-600 border border-green-500/20"
                          : testResult === "error"
                          ? "bg-red-500/10 text-red-600 border border-red-500/20"
                          : "bg-surface border border-border text-secondary hover:bg-surface-subtle"
                      }`}
                    >
                      {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      {testResult === "success" ? "연결 성공" : testResult === "error" ? "연결 실패" : "연결 테스트"}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-tertiary leading-relaxed italic">
                  * 발송 공통 계정으로 사용됩니다.
                </p>
              </section>
            </>
          )}
        </div>

        <footer className="px-8 py-6 border-t border-border/50 bg-surface flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-secondary bg-surface-subtle hover:bg-surface-active rounded-xl transition-all"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex-[2] py-3 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            설정 저장
          </button>
        </footer>
        </div>
      </div>
    </ModalPortal>
  );
}
