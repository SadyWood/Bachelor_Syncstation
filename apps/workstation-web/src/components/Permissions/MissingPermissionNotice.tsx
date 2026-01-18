// src/components/Permissions/MissingPermissionNotice.tsx
import React from 'react';

export default function MissingPermissionNotice({ perm }: { perm: string }) {
  return (
    <div className="ws-alert ws-alert-error">
      <div>
        <div className="font-medium">You don’t have permission</div>
        <div className="text-sm">
          Missing permission: <code>{perm}</code>
        </div>
      </div>
    </div>
  );
}
