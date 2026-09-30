import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  DescriptionList,
  ErrorState,
  LoadingState,
  Section,
  statusTone,
} from '../../../../../components';
import { fetchMemberById } from '../services/memberService';
import { resolveAssetUrl } from '../../../../../services/api/httpClient';
import { useAuthState } from '../../../../Auth/hooks/useAuth';
import { refName, humanize, type Member } from '../../../../../types';

/**
 * Member record: read only profile, organization placement and committee seats.
 * Every field is already scope filtered by the backend, so nothing here needs
 * to be re-checked in the browser.
 */
export function MemberDetailsPage() {
  const { id = '' } = useParams();
  const { can } = useAuthState();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setMember(await fetchMemberById(id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load this member');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState label="Loading member..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!member) return <ErrorState message="This member could not be found in your scope." />;

  const fullName =
    member.fullName ?? [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
  const communities = (member.communities ?? []).map((community) => refName(community)).filter(Boolean);
  const positions = member.committeePositions ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {member.photo ? (
            <img
              src={resolveAssetUrl(member.photo)}
              alt=""
              className="h-14 w-14 rounded-full border border-line object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
              {member.firstName?.[0]}
              {member.lastName?.[0]}
            </span>
          )}
          <div>
            <h1 className="text-xl font-semibold text-secondary">{fullName}</h1>
            <p className="text-sm text-muted">
              {member.memberId} &middot; {humanize(member.membershipType)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Badge tone={statusTone(member.status)} dot>
                {humanize(member.status)}
              </Badge>
              {member.gender && <Badge tone="neutral">{humanize(member.gender)}</Badge>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {can('member.update') && (
            <Link to={`/admin/members/${id}/edit`}>
              <Button size="sm" variant="outline">
                Edit member
              </Button>
            </Link>
          )}
          {can('member.create') && (
            <Link to="/admin/members/new">
              <Button size="sm">Add member</Button>
            </Link>
          )}
        </div>
      </div>

      {member.registrationStatus && member.registrationStatus !== 'APPROVED' && (
        <Card
          className={
            member.registrationStatus === 'PENDING'
              ? 'border-amber-200 bg-amber-50'
              : 'border-red-200 bg-red-50'
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {member.registrationStatus === 'PENDING'
                  ? 'Awaiting district approval'
                  : 'Registration rejected'}
              </p>
              <p className="text-xs text-slate-600">
                {member.registrationStatus === 'PENDING'
                  ? 'The member cannot sign in until a district administrator approves this registration.'
                  : (member.registrationReviewNote ??
                    'The district administrator rejected this registration.')}
              </p>
            </div>
            {can('member.register.approve') && member.registrationStatus === 'PENDING' && (
              <Link to="/admin/members/requests">
                <Button size="sm">Review request</Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <Section title="Personal details" className="lg:col-span-2">
          <Card>
            <DescriptionList
              items={[
                { label: 'Member ID', value: member.memberId },
                { label: 'Gender', value: member.gender ? humanize(member.gender) : null },
                {
                  label: 'Date of birth',
                  value: member.dateOfBirth
                    ? new Date(member.dateOfBirth).toLocaleDateString()
                    : null,
                },
                { label: 'Phone', value: member.phone },
                { label: 'Email', value: member.email },
                { label: 'Occupation', value: member.occupation },
                { label: 'Education', value: member.education },
                { label: 'Emergency contact', value: member.emergencyContact },
                {
                  label: 'Joined',
                  value: member.joinedDate
                    ? new Date(member.joinedDate).toLocaleDateString()
                    : null,
                },
                { label: 'Municipality', value: member.municipality },
                { label: 'Ward', value: member.ward },
              ]}
            />
            {member.address && (
              <p className="mt-3 border-t border-line pt-3 text-sm text-slate-700">{member.address}</p>
            )}
            {member.notes && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-xs font-medium text-muted">Internal notes</p>
                <p className="mt-0.5 text-sm whitespace-pre-line text-slate-700">{member.notes}</p>
              </div>
            )}
          </Card>
        </Section>

        <Section title="Organization">
          <Card>
            <DescriptionList
              items={[
                { label: 'Organization', value: refName(member.organization) },
                { label: 'District', value: refName(member.district) },
                { label: 'Unit', value: refName(member.unit) ?? 'Not assigned' },
                {
                  label: 'Communities',
                  value: communities.length > 0 ? communities.join(', ') : 'None',
                },
              ]}
            />
            <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
              Unit and community determine which records this member can see. Only an
              administrator can change them.
            </p>
          </Card>
        </Section>
      </div>

      <Section title="Committee positions">
        <Card padding="none">
          {positions.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              This member does not hold a committee position.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {positions.map((position) => (
                <li key={refName(position.committee) ?? position.position} className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {refName(position.committee) ?? 'Committee'}
                    </p>
                    <p className="text-xs text-muted">{humanize(position.position)}</p>
                  </div>
                  {position.startDate && (
                    <span className="text-xs text-muted">
                      Since {new Date(position.startDate).toLocaleDateString()}
                    </span>
                  )}
                  {!position.active && <Badge tone="neutral">Inactive</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Section>
    </div>
  );
}

export default MemberDetailsPage;
