// src/components/Layout/SideNav.tsx
import {
  Home, FolderKanban, LayoutDashboard, TrendingUp, HelpCircle, LogOut, Shield, GitBranch,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';
import type { SideNavProps, MenuItem } from '../../types';

const SideNav: React.FC<SideNavProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { logout, accessLoaded, user, currentTenantInfo, can } = useAuth();

  const userName = useMemo(() => {
    if (!user) return '';
    return (
      user.displayName?.trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      user.email ||
      ''
    );
  }, [user]);

  const orgName = useMemo(() => {
    const u = user as Record<string, unknown> | null;
    const getNestedString = (obj: unknown, key: string): string | undefined => {
      if (obj && typeof obj === 'object' && key in obj) {
        const val = (obj as Record<string, unknown>)[key];
        return typeof val === 'string' ? val : undefined;
      }
      return undefined;
    };
    const platform = u?.platform as Record<string, unknown> | undefined;
    const company = u?.company as Record<string, unknown> | undefined;
    const org = u?.org as Record<string, unknown> | undefined;
    const tenant = u?.tenant as Record<string, unknown> | undefined;
    return (
      currentTenantInfo?.name ||
      getNestedString(platform, 'title') ||
      getNestedString(platform, 'name') ||
      getNestedString(company, 'name') ||
      getNestedString(org, 'title') ||
      getNestedString(org, 'name') ||
      getNestedString(tenant, 'title') ||
      getNestedString(tenant, 'name') ||
      (typeof u?.tenantName === 'string' ? u.tenantName : undefined) ||
      (typeof u?.companyName === 'string' ? u.companyName : undefined) ||
      ''
    );
  }, [user, currentTenantInfo]);

  const avatarUrl = useMemo(() => {
    const u = user as Record<string, unknown> | null;
    const getString = (key: string): string | undefined => {
      const val = u?.[key];
      return typeof val === 'string' ? val : undefined;
    };
    return (
      getString('avatarUrl') ||
      getString('profileImageUrl') ||
      getString('imageUrl') ||
      '/profile_demo.png'
    );
  }, [user]);

  const canSeeAdmin =
    can('member.list.view') ||
    can('role.list.view') ||
    can('role.perms.view') ||
    can('member.invite.send') ||
    can('role.create');

  const menuItems: MenuItem[] = [
    { icon: Home,        label: 'Start Page',         path: '/start' },
    { icon: GitBranch,   label: 'Project Structure',  path: '/project-structure' },
    { icon: FolderKanban, label: 'Project Management', path: '/projects' },
    { icon: LayoutDashboard, label: 'Content Dashboard', path: '/content' },
    { icon: TrendingUp,  label: 'Performance & Engagement', path: '/performance' },
    { icon: TrendingUp,  label: 'Dummy Page', path: '/dummy' },
    ...(canSeeAdmin ? [{ icon: Shield, label: 'Admin', path: '/admin', requiresAdmin: true }] : []),
  ];

  const bottomMenuItems: MenuItem[] = [
    { icon: HelpCircle, label: 'Help', path: '/help' },
  ];

  return (
    <>
      <div
        className="fixed left-0 top-0 w-4 h-full z-50 bg-transparent hidden md:block"
        onMouseEnter={() => setIsExpanded(true)}
      />

      <div
        className={`fixed left-0 top-0 h-full sidenav border-r transition-all duration-300 ease-in-out z-40 flex flex-col ${
          isExpanded ? 'w-64' : 'w-16'
        } ${className}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Header */}
        <div className="sidenav-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0">
              <img src={avatarUrl} alt={userName || 'Profile'} className="w-full h-full rounded-lg object-cover" />
            </div>
            <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              {!accessLoaded ? (
                <>
                  <div className="w-32 h-3 rounded ws-skeleton mb-2" />
                  <div className="w-24 h-3 rounded ws-skeleton" />
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold sidenav-user-name whitespace-nowrap">{userName || '—'}</div>
                  <div className="text-xs sidenav-user-company whitespace-nowrap">{orgName || '—'}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    [
                      'flex items-center justify-start gap-3 mx-1 px-3 py-3 rounded-lg sidenav-link',
                      isActive ? 'active' : '',
                    ].join(' ')
                  }
                  title={item.label}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                      isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                    }`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="mt-auto p-2">
          <ul className="space-y-1">
            {bottomMenuItems.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    [
                      'flex items-center justify-start gap-3 mx-1 px-3 py-3 rounded-lg sidenav-link',
                      isActive ? 'active' : '',
                    ].join(' ')
                  }
                  title={item.label}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                      isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                    }`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
            <li>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login', { replace: true });
                }}
                className="flex items-center justify-start gap-3 mx-1 px-3 py-3 rounded-lg sidenav-link w-full text-left"
                title="Log Out"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span
                  className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                    isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                  }`}
                >
                  Log Out
                </span>
              </button>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-gray-200 sidenav-logo">
            <div className="flex justify-center">
              <div className="flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                <img src="/hoolsy_logo.png" alt="Hoolsy" className="object-contain" style={{ width: '48px', height: '48px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setIsExpanded(false)} />
      )}
    </>
  );
};

export default SideNav;
