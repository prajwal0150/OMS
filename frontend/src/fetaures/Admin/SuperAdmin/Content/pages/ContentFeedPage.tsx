import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Eye,
  FileText,
  Globe,
  Lock,
  Paperclip,
  Pencil,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FileUploader,
  FilterBar,
  Pagination,
  Select,
  SkeletonList,
  Textarea,
  statusTone,
} from '../../../../../components';
import { useContent } from '../hooks/useContent';
import {
  approveContent,
  archiveContent,
  createContent,
  deleteContent,
  publishContent,
  rejectContent,
  submitContent,
  unpublishContent,
} from '../services/contentService';
import { isImage as isImageFile, uploadMedia } from '../../Shared/services/mediaService';
import { uploadDocument } from '../../Shared/services/documentService';
import { resolveAssetUrl } from '../../../../../services/api/httpClient';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import { useAuthState } from '../../../../Auth/hooks/useAuth';
import {
  CONTENT_STATUS,
  CONTENT_TYPE,
  ENUM_LABELS,
  VISIBILITY,
  humanize,
  refName,
  type ContentRecord,
  type ContentType,
  type MediaItem,
  type Visibility,
} from '../../../../../types';

const TYPE_OPTIONS = Object.values(CONTENT_TYPE).map((value) => ({
  value,
  label: ENUM_LABELS[value] ?? humanize(value),
}));

/** Only the audiences a post can be addressed to from the feed. */
const VISIBILITY_OPTIONS = [
  VISIBILITY.PUBLIC,
  VISIBILITY.DISTRICT_ONLY,
  VISIBILITY.UNIT_ONLY,
  VISIBILITY.COMMUNITY_ONLY,
].map((value) => ({ value, label: ENUM_LABELS[value] ?? humanize(value) }));

const STATUS_OPTIONS = Object.values(CONTENT_STATUS).map((value) => ({
  value,
  label: humanize(value),
}));

/** "Vatsala Yami" -> "VY" for the post avatar. */
const initialsOf = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const displayName = (post: ContentRecord): string => refName(post.author) || 'Administrator';

/** Feed timestamps are relative, so they are stamped once per render pass. */
const now = Date.now();

const postedAt = (item: ContentRecord): string =>
  item.publishedAt ?? item.createdAt ?? new Date(now).toISOString();

const visibilityIcon = (visibility: string) => {
  if (visibility === VISIBILITY.PUBLIC) return <Globe className="h-3 w-3" aria-hidden />;
  if (visibility === VISIBILITY.DISTRICT_ONLY) return <Users className="h-3 w-3" aria-hidden />;
  return <Lock className="h-3 w-3" aria-hidden />;
};

const fileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface ComposerState {
  text: string;
  contentType: ContentType;
  visibility: Visibility;
  files: File[];
  documents: string[];
}

const EMPTY_COMPOSER: ComposerState = {
  text: '',
  contentType: CONTENT_TYPE.NEWS,
  visibility: VISIBILITY.DISTRICT_ONLY,
  files: [],
  documents: [],
};

/**
 * The single content surface of the admin site: a post is text plus media plus
 * documents, the way a social feed post is. The separate media library and
 * document screens are gone — files are attached here and the post owns them.
 */
export function ContentFeedPage() {
  const navigate = useNavigate();
  const { can } = useAuthState();
  const {
    items,
    pagination,
    loading,
    error,
    search,
    filters,
    setPage,
    setLimit,
    setSearch,
    setFilter,
    reset,
    refresh,
  } = useContent({ defaultSort: 'createdAt' });

  const [composer, setComposer] = useState<ComposerState>(EMPTY_COMPOSER);
  const [posting, setPosting] = useState(false);
  const [removing, setRemoving] = useState<ContentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canPost = composer.text.trim().length > 0 || composer.files.length > 0;

  /** Photos and videos become gallery items, everything else a document. */
  const post = async () => {
    const text = composer.text.trim();
    if (!canPost) return;

    setPosting(true);
    try {
      const uploaded: MediaItem[] = composer.files.length
        ? await uploadMedia(composer.files, { title: text.slice(0, 80) })
        : [];
      const documentIds = [...composer.documents];
      for (const file of composer.files) {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          const document = await uploadDocument(file, { title: file.name });
          documentIds.push(document._id);
        }
      }

      const gallery = uploaded.filter((item) => isImageFile(item));
      const title = text.split('\n')[0].slice(0, 120) || 'Untitled post';
      await createContent({
        title,
        content: text,
        contentType: composer.contentType,
        visibility: composer.visibility,
        ...(gallery.length
          ? {
              gallery: gallery.map((item, index) => ({
                url: item.storageUrl,
                alt: item.alt,
                order: index,
                isCover: index === 0,
              })),
            }
          : {}),
        ...(documentIds.length ? { documents: documentIds } : {}),
      });

      setComposer(EMPTY_COMPOSER);
      toast.success('Post added to the feed');
      refresh();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setPosting(false);
    }
  };

  const runAction = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toast.success(message);
      refresh();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setDeleting(true);
    try {
      await deleteContent(removing._id);
      toast.success('Post deleted');
      setRemoving(null);
      refresh();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setDeleting(false);
    }
  };

  const filterFields = useMemo(
    () => [
      {
        name: 'status',
        label: 'Status',
        value: filters.status ?? '',
        options: STATUS_OPTIONS,
        onChange: (value: string) => setFilter('status', value),
      },
      {
        name: 'contentType',
        label: 'Type',
        value: filters.contentType ?? '',
        options: TYPE_OPTIONS,
        onChange: (value: string) => setFilter('contentType', value),
      },
    ],
    [filters, setFilter],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div>
        <h1 className="text-xl font-semibold text-secondary">Content</h1>
        <p className="text-sm text-muted">
          One feed for every update, with the photos, videos and documents attached to it.
        </p>
      </div>

      {can('content.create') && (
        <Card>
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {initialsOf('You')}
            </span>
            <Textarea
              rows={3}
              placeholder="Share an update with the district, a unit or a community..."
              value={composer.text}
              onChange={(e) => setComposer({ ...composer, text: e.target.value })}
            />
          </div>

          {composer.files.length > 0 && (
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {composer.files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="overflow-hidden rounded-lg border border-line bg-slate-50"
                >
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="h-20 w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-20 items-center justify-center text-slate-400">
                      <Paperclip className="h-5 w-5" aria-hidden />
                    </span>
                  )}
                  <p className="truncate px-2 py-1 text-[11px] text-muted">{file.name}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3">
            <FileUploader
              accept="image/*,video/*,application/pdf"
              multiple
              maxSizeMb={25}
              label="Add photos, videos or files"
              hint="Photos and videos appear in the post, other files as attachments."
              files={composer.files}
              onFilesChange={(files) => setComposer({ ...composer, files })}
            />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Select
              label="Type"
              value={composer.contentType}
              options={TYPE_OPTIONS}
              onChange={(e) =>
                setComposer({ ...composer, contentType: e.target.value as ContentType })
              }
            />
            <Select
              label="Audience"
              value={composer.visibility}
              options={VISIBILITY_OPTIONS}
              onChange={(e) =>
                setComposer({ ...composer, visibility: e.target.value as Visibility })
              }
            />
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 border-t border-line pt-3">
            <Button variant="outline" size="sm" onClick={() => setComposer(EMPTY_COMPOSER)}>
              Clear
            </Button>
            <Button size="sm" onClick={() => void post()} loading={posting} disabled={!canPost}>
              <Send className="h-3.5 w-3.5" aria-hidden />
              Post
            </Button>
          </div>
        </Card>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search posts..."
        onReset={reset}
        fields={filterFields}
      />

      {error && <ErrorState message={error} onRetry={refresh} />}
      {loading && !items.length ? <SkeletonList rows={3} /> : null}
      {!loading && !items.length && !error ? (
        <EmptyState
          title="No posts yet"
          description="Share the first update with photos, videos or documents."
        />
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => {
          const documents = (item.documents ?? []) as Array<{
            _id?: string;
            title?: string;
            file?: { url?: string; name?: string; size?: number };
          }>;
          return (
            <li key={item._id}>
              <Card>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {initialsOf(displayName(item))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {displayName(item)}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      {formatDistanceToNow(new Date(postedAt(item)), { addSuffix: true })}
                      {visibilityIcon(item.visibility)}
                      <span>{humanize(item.visibility)}</span>
                    </p>
                  </div>
                  <Badge tone={statusTone(item.status)} dot>
                    {humanize(item.status)}
                  </Badge>
                </div>

                <h2 className="mt-3 text-base font-semibold text-secondary">{item.title}</h2>
                {item.content && (
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {item.content}
                  </p>
                )}

                {item.gallery && item.gallery.length > 0 && (
                  <div className="mt-3">
                    <img
                      src={resolveAssetUrl(item.gallery[0].url)}
                      alt={item.gallery[0].alt ?? ''}
                      loading="lazy"
                      className="max-h-96 w-full rounded-lg border border-line object-cover"
                    />
                    {item.gallery.length > 1 && (
                      <p className="mt-1 text-xs text-muted">
                        +{item.gallery.length - 1} more photo
                        {item.gallery.length - 1 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}

                {documents.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {documents.map((document, index) => (
                      <li
                        key={document._id ?? index}
                        className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                          {document.title ?? document.file?.name ?? 'Document'}
                        </span>
                        <span className="shrink-0 text-xs text-muted">
                          {fileSize(document.file?.size)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/admin/content/${item._id}/preview`)}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      View
                    </Button>
                    {can('content.update') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/admin/content/${item._id}/edit`)}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Edit
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {can('content.approve') && item.status === 'PENDING_REVIEW' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void runAction(() => approveContent(item._id), 'Post approved')
                        }
                      >
                        Approve
                      </Button>
                    )}
                    {can('content.approve') && item.status === 'PENDING_REVIEW' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void runAction(() => rejectContent(item._id), 'Post rejected')
                        }
                      >
                        Reject
                      </Button>
                    )}
                    {can('content.publish') && item.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void runAction(() => publishContent(item._id), 'Post published')
                        }
                      >
                        Publish
                      </Button>
                    )}
                    {can('content.update') && item.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void runAction(() => submitContent(item._id), 'Sent for review')
                        }
                      >
                        Submit
                      </Button>
                    )}
                    {can('content.publish') && item.status === 'PUBLISHED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void runAction(() => unpublishContent(item._id), 'Post unpublished')
                        }
                      >
                        Unpublish
                      </Button>
                    )}
                    {can('content.update') && item.status === 'PUBLISHED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void runAction(() => archiveContent(item._id), 'Post archived')
                        }
                      >
                        Archive
                      </Button>
                    )}
                    {can('content.delete') && (
                      <Button size="sm" variant="ghost" onClick={() => setRemoving(item)}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Pagination
        meta={pagination ?? undefined}
        onPageChange={setPage}
        onLimitChange={setLimit}
        itemLabel="posts"
      />

      <ConfirmDialog
        open={Boolean(removing)}
        title="Delete post"
        message={`Delete "${removing?.title ?? 'this post'}"? It disappears from the feed and the public site.`}
        confirmLabel="Delete post"
        destructive
        loading={deleting}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}

export default ContentFeedPage;