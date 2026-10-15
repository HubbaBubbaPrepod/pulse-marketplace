'use client';
import { useParams } from 'next/navigation';
import { workspaceCopy } from '../lib/workspace-copy.mjs';
export function WorkspaceLoading() {
  const { lang } = useParams();
  return (
    <div className="page-container">
      <div
        className="workspace workspace-loading"
        role="status"
        aria-label={workspaceCopy[lang]?.loading || workspaceCopy.ru.loading}
      >
        <span className="sr-only">{workspaceCopy[lang]?.loading || workspaceCopy.ru.loading}</span>
        <div className="skeleton toolbar-skeleton" />
        <div className="skeleton hero-skeleton" />
        <div className="workspace-body moderation-layout" aria-hidden="true">
          <div className="skeleton workspace-loading-panel" />
          <div className="skeleton workspace-loading-panel" />
        </div>
      </div>
    </div>
  );
}
