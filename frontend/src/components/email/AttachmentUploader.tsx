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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {/* Compact Upload Trigger */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            h-9 px-4 border-2 border-dashed rounded-xl flex items-center gap-2 cursor-pointer transition-all
            ${isDragging ? 'border-brand-primary bg-brand-primary/5' : 'border-border/40 bg-surface-subtle hover:border-brand-primary/40'}
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
          <UploadCloud size={14} className={isDragging ? 'text-brand-primary' : 'text-tertiary'} />
          <span className="text-[11px] font-black text-secondary">
            {isDragging ? '여기에 드롭' : '파일 추가'}
          </span>
        </div>

        {/* Attachment List (Inline) */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {attachments.map((att) => (
            <div key={att.id} className="group flex items-center gap-2 px-2.5 py-1 bg-surface border border-border/60 rounded-lg shadow-sm hover:border-brand-primary/30 transition-all">
              <Paperclip size={10} className="text-tertiary" />
              <span className="text-[10px] font-bold text-primary max-w-[120px] truncate">{att.originalName}</span>
              <span className="text-[9px] text-disabled font-medium">{(att.size / 1024).toFixed(0)}K</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(att.id); }}
                className="p-1 text-disabled hover:text-error hover:bg-error/5 rounded-md transition-all ml-1"
                title="삭제"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          
          {attachments.length === 0 && (
            <span className="text-[10px] font-bold text-disabled italic ml-1">첨부된 파일이 없습니다.</span>
          )}
        </div>

        {/* Capacity Info */}
        {attachments.length > 0 && (
          <div className="ml-auto px-2 py-1 bg-surface-subtle/50 rounded-lg border border-border/30">
            <span className={`text-[9px] font-black uppercase tracking-tighter ${totalSizeMB > 18 ? 'text-warning' : 'text-disabled'}`}>
              {totalSizeMB.toFixed(1)} / {sizeLimitMB}MB
            </span>
          </div>
        )}
      </div>

      {totalSizeMB > sizeLimitMB && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-error/5 text-error rounded-lg border border-error/10 animate-pulse">
          <AlertCircle size={12} />
          <span className="text-[9px] font-black uppercase tracking-wider">용량 초과! 발송 불가 (25MB 제한)</span>
        </div>
      )}
    </div>
  );
}
