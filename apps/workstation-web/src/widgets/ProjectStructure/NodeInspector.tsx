// apps/workstation-web/src/widgets/ProjectStructure/NodeInspector.tsx
import {
  type ContentNodeSchema,
  type MediaAsset,
  MEDIA_KIND_OPTIONS,
  getMediaClassFromKind,
} from '@hk26/schema';
import { Save, Trash2, FileText, Upload, Film, Image, Music, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { updateNode as updateNodeAPI, deleteNode as deleteNodeAPI } from '../../lib/content-client';
import {
  getMediaForNode,
  initUpload,
  uploadFile,
  completeUpload,
  deleteMedia,
} from '../../lib/media-client';
import { useContentStore } from '../../lib/use-content-store';
import { slugify } from '../../utils/slugify';
import type { WidgetProps } from '../../types';
import type { z } from 'zod';

type ContentNode = z.infer<typeof ContentNodeSchema>;

interface MediaFileState {
  asset: MediaAsset | null;
  isLoading: boolean;
}

const getAcceptedMimeTypes = (mediaClass: 'video' | 'audio' | 'image'): string => {
  switch (mediaClass) {
    case 'video':
      return 'video/*';
    case 'audio':
      return 'audio/*';
    case 'image':
      return 'image/*';
    default:
      return '*/*';
  }
};

function NodeInspector({
  title,
  onClose,
  titleIcon,
}: WidgetProps & { titleIcon?: React.ComponentType<{ size?: number; className?: string }> }) {
  const { loadProjectTree } = useContentStore();
  const [node, setNode] = useState<ContentNode | null>(null);
  const [nodeName, setNodeName] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [mediaKind, setMediaKind] = useState<string>('video_other');
  const [mediaState, setMediaState] = useState<MediaFileState>({ asset: null, isLoading: false });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Load media when node changes
  const nodeId = node?.nodeId;
  const nodeType = node?.nodeType;
  useEffect(() => {
    if (!nodeId || nodeType === 'group') {
      setMediaState({ asset: null, isLoading: false });
      return;
    }

    const loadMedia = async () => {
      setMediaState({ asset: null, isLoading: true });
      try {
        const { asset } = await getMediaForNode(nodeId);
        setMediaState({ asset, isLoading: false });
      } catch {
        setMediaState({ asset: null, isLoading: false });
      }
    };

    loadMedia();
  }, [nodeId, nodeType]);

  useEffect(() => {
    const handler = (e: Event) => {
      const selectedNode = (e as CustomEvent).detail as ContentNode | null;
      setNode(selectedNode);
      setNodeName(selectedNode?.title ?? '');
      setSynopsis(selectedNode?.synopsis ?? '');
      setMediaKind(selectedNode?.mediaKindCode ?? 'video_other');
    };
    window.addEventListener('node:selected', handler);
    return () => window.removeEventListener('node:selected', handler);
  }, []);

  const save = async () => {
    if (!node) return;
    setIsSaving(true);
    try {
      await updateNodeAPI(node.nodeId, {
        body: {
          title: nodeName.trim() || node.title,
          synopsis: synopsis || undefined,
          mediaKindCode: mediaKind,
        },
      });

      // Reload tree to show updated data
      if (node.parentId) {
        await loadProjectTree(node.parentId);
      }

      // Dispatch updated node event
      window.dispatchEvent(new CustomEvent('node:updated', { detail: node.nodeId }));
    } catch {
      // eslint-disable-next-line no-alert -- User notification for save failure
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!node) return;
    // eslint-disable-next-line no-alert -- User confirmation required for destructive action
    if (!confirm(`Delete node "${node.title}"?`)) return;

    try {
      const { parentId } = node;
      await deleteNodeAPI(node.nodeId);

      setNode(null);
      window.dispatchEvent(new CustomEvent('node:selected', { detail: null }));

      if (parentId) {
        await loadProjectTree(parentId);
      }
    } catch {
      // eslint-disable-next-line no-alert -- User notification for delete failure
      alert('Failed to delete node. Please try again.');
    }
  };

  const handleKindChange = (newKind: string) => {
    setMediaKind(newKind);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!node || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Initialize upload
      const { uploadId } = await initUpload(node.nodeId, file);

      // 2. Upload file with progress
      await uploadFile(uploadId, file, (progress) => {
        setUploadProgress(progress);
      });

      // 3. Complete upload (creates DB record)
      await completeUpload(uploadId);

      // 4. Reload media to show uploaded file
      const { asset } = await getMediaForNode(node.nodeId);
      setMediaState({ asset, isLoading: false });

      setUploadProgress(100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // eslint-disable-next-line no-alert -- User notification for upload failure
      alert(`Failed to upload media: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleRemoveMedia = async () => {
    if (!mediaState.asset || !node) return;
    // eslint-disable-next-line no-alert -- User confirmation required for destructive action
    if (!confirm('Remove linked media?')) return;

    try {
      await deleteMedia(mediaState.asset.mediaAssetId);
      setMediaState({ asset: null, isLoading: false });
    } catch {
      // eslint-disable-next-line no-alert -- User notification for media removal failure
      alert('Failed to remove media. Please try again.');
    }
  };

  const getMediaIcon = (mimeType: string) => {
    if (mimeType.startsWith('video/')) {
      return <Film size={20} className="text-purple-600" />;
    }
    if (mimeType.startsWith('image/')) {
      return <Image size={20} className="text-blue-600" />;
    }
    if (mimeType.startsWith('audio/')) {
      return <Music size={20} className="text-green-600" />;
    }
    return <Upload size={20} className="text-gray-600" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const getNodeTypeLabel = () => {
    if (!node) return '';
    if (node.nodeType === 'group') return 'Group';
    if (node.nodeType === 'bonus_content') return 'Bonus Content';
    return 'Content';
  };

  const isGroup = node?.nodeType === 'group';
  const mediaClass = getMediaClassFromKind(mediaKind);
  const acceptTypes = getAcceptedMimeTypes(mediaClass);

  return (
    <BaseWidget
      title={title || 'Node Inspector'}
      onClose={onClose}
      titleIcon={titleIcon || FileText}
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
          {!node ? (
            <div className="ws-empty">
              <FileText size={24} className="opacity-60" />
              <div className="text-sm font-medium">No node selected</div>
              <p className="text-xs text-gray-500">Click a node in the Content Tree</p>
            </div>
          ) : (
            <>
              {/* Compact Header with Type Badges */}
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-gray-200">
                <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide rounded bg-blue-100 text-blue-700">
                  {getNodeTypeLabel()}
                </span>
                {node.mediaClass && (
                  <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide rounded bg-purple-100 text-purple-700">
                    {node.mediaClass}
                  </span>
                )}
              </div>

              {/* Title & Content Type Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                  <input
                    className="ws-input w-full text-sm"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    placeholder="Node title"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                      {slugify(nodeName || '') || 'node-slug'}
                    </span>
                  </p>
                </div>

                {/* Content Type Dropdown (only for content nodes) */}
                {!isGroup ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Content Type
                    </label>
                    <select
                      className="ws-input w-full text-sm cursor-pointer"
                      value={mediaKind}
                      onChange={(e) => handleKindChange(e.target.value)}
                    >
                      {MEDIA_KIND_OPTIONS.map((cat) => (
                        <optgroup key={cat.category} label={`── ${cat.category} ──`}>
                          {cat.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div />
                )}
              </div>

              {/* Synopsis */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Synopsis</label>
                <textarea
                  className="ws-input w-full min-h-[70px] md:min-h-[90px] text-sm resize-none"
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Brief description..."
                />
              </div>

              {/* Media Upload Section - Only for content nodes */}
              {!isGroup && (
                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Linked Media
                    <span className="ml-1 text-[10px] font-normal text-gray-500">
                      ({mediaClass} only)
                    </span>
                  </label>

                  {mediaState.isLoading && (
                    <div className="border-2 border-gray-300 rounded-lg p-4 md:p-6 text-center bg-gray-50">
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={28} className="text-gray-400 animate-pulse" />
                        <p className="text-xs text-gray-600 font-medium">Loading media...</p>
                      </div>
                    </div>
                  )}
                  {!mediaState.isLoading && !mediaState.asset && !isUploading && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 text-center bg-gray-50">
                      <div className="flex flex-col items-center gap-2">
                        {mediaClass === 'video' && <Film size={28} className="text-gray-400" />}
                        {mediaClass === 'audio' && <Music size={28} className="text-gray-400" />}
                        {mediaClass === 'image' && <Image size={28} className="text-gray-400" />}
                        <p className="text-xs text-gray-600 font-medium">Media not yet linked</p>
                        <label className="ws-btn ws-btn-sm ws-btn-soft mt-1">
                          <Upload size={14} />
                          <span>Upload {mediaClass}</span>
                          <input
                            type="file"
                            accept={acceptTypes}
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                  {!mediaState.isLoading && isUploading && (
                    <div className="border-2 border-green-400 rounded-lg p-4 bg-green-50">
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={24} className="text-green-600 animate-pulse" />
                        <p className="text-xs font-medium text-green-700">Uploading...</p>
                        <div className="w-full flex items-center gap-2">
                          <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-600 transition-all duration-200"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-green-700 min-w-[35px]">
                            {uploadProgress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {!mediaState.isLoading && !isUploading && mediaState.asset && (
                    <div className="border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-300 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getMediaIcon(mediaState.asset.mimeType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {mediaState.asset.filename}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            <span>{mediaState.asset.mimeType.split('/')[0]}</span>
                            <span className="mx-1.5">•</span>
                            <span>{formatFileSize(mediaState.asset.sizeBytes)}</span>
                            {mediaState.asset.status && (
                              <>
                                <span className="mx-1.5">•</span>
                                <span className="capitalize">{mediaState.asset.status}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          onClick={handleRemoveMedia}
                          title="Remove media"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Group info - when group is selected */}
              {isGroup && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-medium">
                      ℹ️ Groups cannot have media content
                    </p>
                    <p className="text-[11px] text-blue-600 mt-1">
                      Use groups to organize content nodes. Media can only be linked to content
                      nodes.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky Action Buttons at bottom */}
        {node && (
          <div className="border-t border-gray-200 bg-white p-3 md:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <button className="ws-btn ws-btn-sm ws-btn-solid" onClick={save} disabled={isSaving}>
                <Save size={14} />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button className="ws-btn ws-btn-sm ws-btn-soft ws-danger" onClick={remove}>
                <Trash2 size={14} />
                <span>Delete Node</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}

export default NodeInspector;
