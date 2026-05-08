import React, { useRef, useState } from 'react';
import { Paperclip, Trash2, AlertCircle, UploadCloud } from 'lucide-react';
import type { AttachmentMeta } from '../../types/models';

interface AttachmentUploaderProps {
  attachments: AttachmentMeta[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
  isLoading?: boolean;
}

export function AttachmentUploader({ 
  attachments, 
  onUpload, 
  onDelete,
  isLoading = false 
}: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
  const totalSizeMB = totalSize / (1024 * 1024);
  const sizeLimitMB = 25;
  const recommendedLimitMB = 18;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await onUpload(files[i]);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await onUpload(files[i]);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-tertiary uppercase tracking-wider flex items-center gap-2">
          <Paperclip size={14} /> 첨부 파일 ({attachments.length})
        </span>
        <span className={`text-[10px] font-bold ${totalSizeMB > recommendedLimitMB ? 'text-warning' : 'text-disabled'}`}>
          총 용량: {totalSizeMB.toFixed(2)}MB / {sizeLimitMB}MB
        </span>
      </div>

      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
          ${isDragging ? 'border-brand-primary bg-brand-primary/5' : 'border-border/50 bg-surface-subtle hover:border-brand-primary/30'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          multiple 
        />
        <UploadCloud size={24} className={isDragging ? 'text-brand-primary' : 'text-disabled'} />
        <p className="text-xs font-bold text-secondary">
          {isDragging ? '여기에 놓으세요' : '파일을 드래그하거나 클릭하여 업로드'}
        </p>
        <p className="text-[10px] text-disabled italic text-center">
          최대 {sizeLimitMB}MB (18MB 이하 권장)<br/>
          실행 파일(.exe, .bat 등)은 업로드가 차단됩니다.
        </p>
      </div>

      {totalSizeMB > recommendedLimitMB && totalSizeMB <= sizeLimitMB && (
        <div className="flex items-center gap-2 p-2 bg-warning/10 text-warning rounded-lg border border-warning/20">
          <AlertCircle size={14} />
          <span className="text-[10px] font-bold">권장 용량(18MB)을 초과했습니다. 발송 성공률이 낮아질 수 있습니다.</span>
        </div>
      )}

      {totalSizeMB > sizeLimitMB && (
        <div className="flex items-center gap-2 p-2 bg-error/10 text-error rounded-lg border border-error/20">
          <AlertCircle size={14} />
          <span className="text-[10px] font-bold">제한 용량(25MB)을 초과했습니다. 일부 파일을 삭제해야 발송이 가능합니다.</span>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border/50 group hover:border-brand-primary/30 transition-all">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-1.5 bg-brand-primary/10 text-brand-primary rounded-lg">
                  <Paperclip size={14} />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-primary truncate">{att.originalName}</span>
                  <span className="text-[10px] text-disabled font-medium">{(att.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(att.id); }}
                className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
