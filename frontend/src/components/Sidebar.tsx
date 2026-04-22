import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  ChevronDown,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { mainNavigation, educationSubNavigation } from '../constants';
import junSymbolLogo from '../../assets/jun_simbol.png';

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
    if (!flyoutOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!educationGroupRef.current?.contains(event.target as Node)) {
        setFlyoutOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFlyoutOpen(false);
      }
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
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`} aria-label="주 메뉴">
      <div className="sidebar-header">
        {!collapsed && (
          <div className="brand">
            <img src={junSymbolLogo} alt="JNU K-Platform Logo" className="brand-logo" />
            <div className="brand-info">
              <p className="brand-title">
                <span>전남대학교</span>
                <span>K-하이테크 플랫폼</span>
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          className="sidebar-collapse-button"
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          onClick={onToggleCollapsed}
        >
          {collapsed ? (
            <PanelRightOpen className="sidebar-menu-icon sidebar-collapse-icon" />
          ) : (
            <PanelRightClose className="sidebar-menu-icon sidebar-collapse-icon" />
          )}
        </button>
      </div>

      <div className="sidebar-divider" />

      <nav className="sidebar-nav">
        {dashboardItem ? (
          <NavLink
            key={dashboardItem.to}
            to={dashboardItem.to}
            end={dashboardItem.to === '/'}
            aria-label={dashboardItem.label}
            data-tooltip={collapsed ? dashboardItem.label : undefined}
            className={({ isActive }) =>
              ['sidebar-link', collapsed ? 'sidebar-link-icon' : '', isActive ? 'sidebar-link-active' : '']
                .filter(Boolean)
                .join(' ')
            }
          >
            <dashboardItem.icon className="sidebar-menu-icon" />
            {!collapsed && <span className="sidebar-link-label">{dashboardItem.label}</span>}
          </NavLink>
        ) : null}

        <div
          ref={educationGroupRef}
          className={`sidebar-group ${isEducationActive ? 'sidebar-group-active' : ''} ${
            collapsed ? 'sidebar-group-collapsed' : ''
          }`}
        >
          <button
            type="button"
            className={`sidebar-group-label ${collapsed ? 'sidebar-group-label-icon' : ''}`}
            data-tooltip={collapsed ? '교육 과정 관리' : undefined}
            onClick={toggleEducationMenu}
            aria-label="교육 과정 하위 메뉴 펼치기 또는 접기"
            aria-expanded={collapsed ? flyoutOpen : educationOpen}
            aria-controls="education-submenu"
          >
            <GraduationCap className="sidebar-menu-icon" />
            {!collapsed && <span className="sidebar-link-label">교육 과정 관리</span>}
            {!collapsed &&
              (educationOpen ? (
                <ChevronDown className="sidebar-toggle-chevron" />
              ) : (
                <ChevronDown className="sidebar-toggle-chevron sidebar-toggle-chevron-collapsed" />
              ))}
          </button>

          {!collapsed && (
            <div
              id="education-submenu"
              className={`sidebar-submenu ${educationOpen ? 'sidebar-submenu-open' : 'sidebar-submenu-closed'}`}
            >
              {educationSubNavigation.map((item) => {
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      isActive ? 'sidebar-sublink sidebar-sublink-active' : 'sidebar-sublink'
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="sidebar-sublink-label">{item.label}</span>
                        {isActive && <ChevronRight className="sidebar-sublink-chevron" />}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}

          {collapsed && flyoutOpen && (
            <div id="education-submenu" className="sidebar-flyout" role="menu" aria-label="교육 과정 하위 메뉴">
              {educationSubNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? 'sidebar-flyout-link sidebar-flyout-link-active' : 'sidebar-flyout-link'
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {automationMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              aria-label={item.label}
              data-tooltip={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                ['sidebar-link', collapsed ? 'sidebar-link-icon' : '', isActive ? 'sidebar-link-active' : '']
                  .filter(Boolean)
                  .join(' ')
              }
            >
              <Icon className="sidebar-menu-icon" />
              {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
