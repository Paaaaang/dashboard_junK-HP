import { ReactNode, useState } from "react";
import { X, LucideIcon, ChevronDown } from "lucide-react";
import { ModalPortal } from "@/components/Modal";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  isClosing?: boolean;
  width?: string;
  headerActions?: ReactNode;
}

export function SideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  isClosing = false,
  width = "480px",
  headerActions,
}: SideDrawerProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-brand-dark/40 z-[var(--z-modal-backdrop)] ${
          isClosing ? "animate-fade-out" : "animate-fade-in"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full bg-surface shadow-2xl z-[var(--z-drawer)] flex flex-col ${
          isClosing ? "animate-drawer-out" : "animate-drawer-in"
        }`}
        style={{ width }}
      >
        <header className="px-6 py-5 bg-surface border-b border-border/50 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary">
                <Icon size={20} strokeWidth={2.5} />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-primary leading-tight">{title}</h3>
              {subtitle && <div className="mt-0.5">{subtitle}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              className="p-2 text-tertiary hover:text-secondary hover:bg-surface-subtle rounded-full transition-all"
              onClick={onClose}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
          {children}
        </div>

        {footer && (
          <footer className="px-6 py-5 bg-surface border-t border-border/50 flex items-center gap-3">
            {footer}
          </footer>
        )}
      </div>
    </ModalPortal>
  );
}

interface DrawerSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  icon?: LucideIcon;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function DrawerSection({
  title,
  action,
  children,
  icon: Icon,
  description,
  collapsible = false,
  defaultCollapsed = false,
}: DrawerSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsible && defaultCollapsed);

  const toggle = () => {
    if (collapsible) setIsCollapsed(!isCollapsed);
  };

  return (
    <section className="space-y-4">
      <div 
        className={`flex items-center justify-between px-1 ${collapsible ? "cursor-pointer group/header" : ""}`}
        onClick={toggle}
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="p-1.5 bg-brand-primary/10 rounded-lg">
                <Icon size={14} strokeWidth={2.5} className="text-brand-primary" />
              </div>
            )}
            <h4 className="text-[14px] font-black text-[#000000] tracking-tight uppercase group-hover/header:text-brand-primary transition-colors">
              {title}
            </h4>
            {collapsible && (
              <ChevronDown 
                size={14} 
                strokeWidth={3} 
                className={`text-disabled transition-transform duration-300 ${isCollapsed ? "-rotate-90" : ""}`} 
              />
            )}
          </div>
          {description && (
            <p className="text-[11px] text-tertiary font-medium ml-1">{description}</p>
          )}
        </div>
        {!isCollapsed && action}
      </div>
      
      {!isCollapsed && (
        <div className="space-y-4 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </section>
  );
}

import { Copy, Check } from "lucide-react";
import { useToastStore } from "@/stores/useToastStore";

interface DrawerFieldProps {
  label: string;
  value: ReactNode;
  isEditMode?: boolean;
  required?: boolean;
  copyValue?: string;
}

export function DrawerField({ label, value, isEditMode, required, copyValue }: DrawerFieldProps) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToastStore();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!copyValue) return;
    
    navigator.clipboard.writeText(copyValue).then(() => {
      setCopied(true);
      addToast(`${label}이(가) 복사되었습니다.`, "success");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-1.5 group/field">
      <label className="text-[11px] font-bold text-tertiary uppercase tracking-wider flex items-center justify-between gap-1">
        <span>{label} {required && <span className="text-error">*</span>}</span>
        {copyValue && !isEditMode && (
          <button 
            onClick={handleCopy}
            className="p-1 hover:bg-brand-primary/10 rounded-md text-brand-primary transition-all opacity-0 group-hover/field:opacity-100"
            title="복사하기"
          >
            {copied ? <Check size={10} strokeWidth={3} /> : <Copy size={10} strokeWidth={3} />}
          </button>
        )}
      </label>
      <div className={`text-sm font-semibold text-primary ${!isEditMode ? "py-0.5" : ""}`}>
        {value}
      </div>
    </div>
  );
}
