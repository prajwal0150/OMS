import { ShieldCheck, User } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorState, Skeleton, statusTone } from '../../../../components/ui';
import { usePortalData } from '../../hooks/usePortalData';
import { fetchMyCommittees } from '../../services/memberPortalService';
import { humanize, refName, type Committee } from '../../../../types';

/** Committees the signed-in member holds a position in. */
export function MyCommitteesPage() {
  const { data: committees, loading, error, reload } = usePortalData<Committee[]>(fetchMyCommittees);

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-xl font-semibold text-secondary">My committees</h1>
        <p className="mt-0.5 text-sm text-muted">
          Committees you are a member of and the position you hold.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : (committees ?? []).length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="No committee memberships"
            description="When you are appointed to a committee it will appear here."
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(committees ?? []).map((committee) => {
            const positions = (committee.positions ?? []).filter(
              (position) => position.member && refName(position.member) === undefined ? false : true,
            );
            const mine = positions.filter((position) => position.active);
            return (
              <Card key={committee._id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge tone="primary">{humanize(committee.level)}</Badge>
                    <Badge tone={statusTone(committee.status)} dot>
                      {humanize(committee.status)}
                    </Badge>
                  </div>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-secondary">{committee.name}</h3>
                <p className="mt-0.5 text-xs text-muted">
                  {[refName(committee.unit), refName(committee.community)]
                    .filter(Boolean)
                    .join(' / ') || 'District level'}
                </p>
                {committee.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">
                    {committee.description}
                  </p>
                )}

                <div className="mt-2 border-t border-line pt-2">
                  <p className="text-xs font-medium text-muted">Positions</p>
                  {mine.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-500">No active position recorded</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {mine.map((position) => (
                        <li key={position._id} className="flex items-center gap-1.5 text-xs">
                          <User className="h-3 w-3 text-slate-400" aria-hidden />
                          <span className="text-slate-700">{humanize(position.position)}</span>
                          {position.member && (
                            <span className="truncate text-muted">
                              - {refName(position.member)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyCommitteesPage;
