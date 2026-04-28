import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  ChevronDown,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { mainNavigation, educationSubNavigation } from '../../constants';
import junSymbolLogo from '../../../assets/jun_simbol.png';

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const location = useLocation();
  const [educationOpen, setEducationOpen] = useState(true);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const educationGroupRef = useRef<HTMLDivElement | null>(null);
  
  const dashboardItem = mainNavigation[0];
  const automationMenuItems = mainNavigation.slice(1);

  const educationPaths = educationSubNavigation.map((item) => item.to);
  const isEducationActive = educationPaths.some((path) => location.pathname.startsWith(path));

  useEffect(() => {
    setFlyoutOpen(false);
  }, [location.pathname, collapsed]);

  useEffect(() => {
    if (!flyoutOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (!educationGroupRef.current?.contains(e.target as Node)) setFlyoutOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFlyoutOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [flyoutOpen]);

  const toggleEducationMenu = () => {
    if (collapsed) {
      setFlyoutOpen((prev) => !prev);
      return;
    }
    setEducationOpen((prev) => !prev);
  };

  return (
    <aside 
      className={`relative flex flex-col bg-white border-r border-gray-100 shadow-soft transition-all duration-300 z-30 ${collapsed ? 'w-20' : 'w-64'}`}
      aria-label="주 메뉴"
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={junSymbolLogo} alt="Logo" className="w-8 h-8 object-contain" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-800 leading-tight">전남대학교</span>
              <span className="text-xs font-medium text-emerald-600 leading-tight">K-하이테크 플랫폼</span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors ${collapsed ? 'mx-auto' : ''}`}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {collapsed ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {dashboardItem && (
          <NavLink
            to={dashboardItem.to}
            end={dashboardItem.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? dashboardItem.label : undefined}
            aria-label={dashboardItem.label}
          >
            <dashboardItem.icon size={20} className={collapsed ? '' : 'shrink-0'} />
            {!collapsed && <span>{dashboardItem.label}</span>}
          </NavLink>
        )}

        <div ref={educationGroupRef} className="relative pt-2">
          <button
            type="button"
            onClick={toggleEducationMenu}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
              isEducationActive 
                ? 'text-emerald-700 font-semibold bg-emerald-50/50' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? '교육 과정 관리' : undefined}
            aria-expanded={collapsed ? flyoutOpen : educationOpen}
          >
            <div className="flex items-center gap-3">
              <GraduationCap size={20} className={collapsed ? '' : 'shrink-0'} />
              {!collapsed && <span>교육 과정 관리</span>}
            </div>
            {!collapsed && (
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${educationOpen ? 'rotate-180' : ''}`} 
              />
            )}
          </button>

          {!collapsed && (
            <div 
              className={`overflow-hidden transition-all duration-300 ${
                educationOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="flex flex-col gap-1 pl-10 pr-2">
                {educationSubNavigation.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between py-2 px-3 rounded-lg text-sm transition-colors ${
                        isActive 
                          ? 'text-emerald-700 bg-emerald-50 font-medium' 
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{item.label}</span>
                        {isActive && <ChevronRight size={14} />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {collapsed && flyoutOpen && (
            <div className="absolute left-full top-0 ml-2 w-48 bg-white rounded-xl shadow-glass border border-gray-100 py-2 z-50">
              {educationSubNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm transition-colors ${
                      isActive 
                        ? 'text-emerald-700 bg-emerald-50 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 space-y-1">
          {automationMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <Icon size={20} className={collapsed ? '' : 'shrink-0'} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}