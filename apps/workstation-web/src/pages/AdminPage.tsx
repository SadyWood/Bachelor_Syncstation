// src/pages/AdminPage.tsx
import { Users, UserSquare2, MailPlus, Shield, KeySquare, BookOpen } from 'lucide-react';
import PageShell from '../components/Layout/PageShell';
import SideNav from '../components/Layout/SideNav';
import { WidgetGrid } from '../components/WidgetBase/WidgetGrid';
import InviteWidget from '../widgets/Admin/Invite';
import MemberWidget from '../widgets/Admin/Member';
import MembersWidget from '../widgets/Admin/MembersList';
import PermissionsCatalogWidget from '../widgets/Admin/PermissionsCatalog';
import RolePermissionsWidget from '../widgets/Admin/RolePermissionsList';
import RolesListWidget from '../widgets/Admin/RolesList';
import type { GridItemMeta, WidgetRegistry } from '../types';


const registry: WidgetRegistry = {
  MembersWidget,
  MemberWidget,
  InviteWidget,
  RolesListWidget,
  RolePermissionsWidget,
  PermissionsCatalogWidget,
};

// Default layout (12 cols, 60px row height)
const items: GridItemMeta[] = [
  // Left column
  { i: 'adm-mem',   x: 0, y: 0,  w: 7, h: 8, minW: 5, minH: 5, widget: 'MembersWidget',          title: 'Members',        icon: Users },
  { i: 'adm-roles', x: 0, y: 7,  w: 7, h: 8, minW: 5, minH: 5, widget: 'RolesListWidget',       title: 'Roles',          icon: Shield },

  // Right column
  { i: 'adm-det',   x: 7, y: 0,  w: 5, h: 5, minW: 4, minH: 4, widget: 'MemberWidget',          title: 'Member details', icon: UserSquare2 },
  { i: 'adm-inv',   x: 7, y: 5,  w: 5, h: 3, minW: 2, minH: 2, widget: 'InviteWidget',          title: 'Invite member',  icon: MailPlus },
  { i: 'adm-perm',  x: 7, y: 8,  w: 5, h: 8, minW: 4, minH: 6, widget: 'RolePermissionsWidget', title: 'Permissions',     icon: KeySquare },
  { i: 'adm-cat',   x: 0, y: 16, w: 12, h: 8, minW: 6, minH: 4, widget: 'PermissionsCatalogWidget', title: 'Permissions Catalog', icon: BookOpen },
];

export default function AdminPage() {
  return (
    <div className="h-screen flex bg-[var(--ws-page-bg)]">
      <SideNav />
      <PageShell>
        <div>
          <WidgetGrid className="h-[calc(100vh-4rem)] w-full" items={items} registry={registry} persistKey="admin-v1" />
        </div>
      </PageShell>
    </div>
  );
}

