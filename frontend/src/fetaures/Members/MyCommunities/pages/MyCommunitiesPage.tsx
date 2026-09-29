import { UsersRound } from 'lucide-react';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../../components/ui';
import { usePortalData } from '../../hooks/usePortalData';
import { fetchMyProfile } from '../../services/memberPortalService';
import { humanize, refName, type Community, type Member } from '../../../../types';

interface MemberWithCommunities extends Member {
  communities?: Community[];
}

/** Communities the member belongs to, read straight from their profile. */
export function MyCommunitiesPage() {
  const { data: member, loading, error, reload } = usePortalData<MemberWithCommunities>(
    () => fetchMyProfile() as Promise<MemberWithCommunities>,
  );

  if (loading) return <LoadingState label="Loading your communities..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const communities = member?.communities ?? [];

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-xl font-semibold text-secondary">My communities</h1>
        <p className="mt-0.5 text-sm text-muted">
          The Parents, Women and Youth communities you are registered with.
        </p>
      </div>

      {communities.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="Not registered with a community yet"
            description="Your unit administrator can add you to a community at any time."
            icon={<UsersRound className="h-5 w-5" />}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <Card key={community._id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <UsersRound className="h-4 w-4" aria-hidden />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <Badge tone="purple">{humanize(community.targetGroup)}</Badge>
                  <Badge tone={community.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
                    {humanize(community.status)}
                  </Badge>
                </div>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-secondary">{community.name}</h3>
              <p className="text-xs text-muted">
                {community.code}
                {community.ageGroup ? ` - ${community.ageGroup}` : ''}
              </p>
              {refName(community.unit) && (
                <p className="mt-1 text-xs text-muted">Unit: {refName(community.unit)}</p>
              )}
              {community.description && (
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600">
                  {community.description}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyCommunitiesPage;
