import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Inbox, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  PageHeader,
  Pagination,
  statusTone,
  Textarea,
} from '../../../../../components';
import {
  approveMemberRegistration,
  fetchRegistrationRequests,
  rejectMemberRegistration,
} from '../services/memberService';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import {
  humanize,
  refName,
  type Member,
  type PaginationMeta,
} from '../../../../../types';

type Decision = { mode: 'approve' | 'reject'; member: Member };

/** Render-safe date formatting (never calls impure functions during render). */
const formatDate = (value?: string): string => (value ? new Date(value).toLocaleString() : '—');

/** District review queue for member registrations submitted by unit accounts. */
export function MemberRequestsPage() {
  const [items, setItems] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await fetchRegistrationRequests({ page, limit: 10 });
      setItems(result.items);
      setPagination(result.meta?.pagination);
      setError(null);
    } catch (caught) {
      setError(normalizeApiError(caught).message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // Data load: every state update happens after the awaited request resolves.
    // eslint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  const openDecision = (mode: Decision['mode'], member: Member) => {
    setNote('');
    setDecision({ mode, member });
  };

  const submitDecision = async () => {
    if (!decision) return;
    const reason = note.trim();
    if (decision.mode === 'reject' && reason.length < 3) {
      toast.error('Enter a reason for rejecting the registration');
      return;
    }
    setSaving(true);
    try {
      if (decision.mode === 'approve') {
        await approveMemberRegistration(decision.member._id, reason || undefined);
        toast.success('Registration approved — the member can now sign in');
      } else {
        await rejectMemberRegistration(decision.member._id, reason);
        toast.success('Registration rejected');
      }
      setDecision(null);
      setLoading(true);
      void load();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Registration requests"
        description="Members registered by unit accounts that need district approval before they can sign in."
      />

      {error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            void load();
          }}
        />
      ) : loading ? (
        <LoadingState label="Loading requests..." />
      ) : items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="No pending requests"
            description="New unit level registrations will appear here for review."
            icon={<Inbox className="h-5 w-5" />}
          />
        </Card>
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-line">
            {items.map((row) => (
              <li key={row._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">
                    {row.fullName ??
                      [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ')}
                  </p>
                  <p className="truncate text-xs text-muted">
                    <span className="font-mono">{row.memberId}</span>
                    {' · '}
                    {refName(row.unit) ?? 'No unit'}
                    {row.email ? ` · ${row.email}` : row.phone ? ` · ${row.phone}` : ''}
                  </p>
                </div>
                <div className="hidden text-xs text-muted sm:block">
                  <p>Requested by {row.registrationRequestedByName ?? 'Unknown'}</p>
                  <p>{formatDate(row.registrationRequestedAt ?? row.createdAt)}</p>
                </div>
                <Badge tone={statusTone(row.registrationStatus ?? 'PENDING')}>
                  {humanize(row.registrationStatus ?? 'PENDING')}
                </Badge>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    onClick={() => openDecision('approve', row)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<XCircle className="h-3.5 w-3.5" />}
                    onClick={() => openDecision('reject', row)}
                  >
                    Reject
                  </Button>
                  <Link to={`/admin/members/${row._id}`}>
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Pagination
        meta={pagination}
        onPageChange={(next) => {
          setLoading(true);
          setPage(next);
        }}
        itemLabel="registration requests"
      />

      <Modal
        open={decision !== null}
        onClose={() => setDecision(null)}
        title={decision?.mode === 'reject' ? 'Reject registration' : 'Approve registration'}
        description={
          decision
            ? `${[decision.member.firstName, decision.member.lastName]
                .filter(Boolean)
                .join(' ')} (${decision.member.memberId})`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDecision(null)} disabled={saving}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={decision?.mode === 'reject' ? 'danger' : 'primary'}
              loading={saving}
              onClick={() => void submitDecision()}
            >
              {decision?.mode === 'reject' ? 'Reject' : 'Approve'}
            </Button>
          </>
        }
      >
        <Textarea
          label={decision?.mode === 'reject' ? 'Reason (required)' : 'Note (optional)'}
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={
            decision?.mode === 'reject'
              ? 'Why is this registration being rejected?'
              : 'Optional note recorded with the approval'
          }
        />
        <p className="mt-2 text-xs text-muted">
          {decision?.mode === 'reject'
            ? 'The member stays inactive and cannot sign in.'
            : 'The member becomes active and can sign in to the member portal right away.'}
        </p>
      </Modal>
    </div>
  );
}

export default MemberRequestsPage;
