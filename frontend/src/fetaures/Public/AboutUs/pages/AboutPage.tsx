import { Card } from '../../../../components/ui';
import { PublicPageHeader } from '../../Layouts/components/publicSections';
import { usePublicDetail, usePublicList } from '../../hooks/usePublicData';
import { fetchCommunitiesPublic, fetchOrganizationPublic, fetchUnitsPublic } from '../../services/publicService';
import { DEFAULT_COUNTRY, DEFAULT_DISTRICT_NAME, DEFAULT_PROVINCE } from '../../../../constants';

const PILLARS = [
  {
    title: 'Community service',
    text: 'Social service campaigns delivered by our units and the Youth community across Sunsari.',
  },
  {
    title: 'Education & training',
    text: 'Awareness programs, workshops and skill-building sessions for every age group.',
  },
  {
    title: 'Good governance',
    text: 'Elected district, unit and community committees with transparent records and reporting.',
  },
];

export function AboutPage() {
  const { data: organization } = usePublicDetail(fetchOrganizationPublic);
  const units = usePublicList(fetchUnitsPublic, { limit: 10, sort: 'name', order: 'asc' });
  const communities = usePublicList(fetchCommunitiesPublic, { limit: 10, sort: 'name', order: 'asc' });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <PublicPageHeader
        eyebrow={DEFAULT_PROVINCE}
        title="About the organization"
        description={
          organization?.description ??
          'HEAVENLY PATH SUNSARI DISTRICT coordinates four units and three communities under one district body.'
        }
      />

      <Card>
        <h2 className="text-base font-semibold text-secondary">Who we are</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          HEAVENLY PATH SUNSARI DISTRICT is a community organization in {DEFAULT_COUNTRY}. The
          district body oversees four operational units and three communities: Parents, Women and
          Youth. Each level runs its own committees, events and activities while reporting into the
          district.
        </p>
        {organization?.establishedDate && (
          <p className="mt-2 text-xs text-muted">
            Established {new Date(organization.establishedDate).toLocaleDateString()}
          </p>
        )}
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {PILLARS.map((pillar) => (
          <Card key={pillar.title}>
            <h3 className="text-sm font-semibold text-secondary">{pillar.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">{pillar.text}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-secondary">Units ({units.items.length})</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {units.items.map((unit) => (
              <li key={unit._id} className="flex items-center justify-between gap-2">
                <span>{unit.name}</span>
                <span className="text-xs text-muted">{unit.code}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-secondary">
            Communities ({communities.items.length})
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {communities.items.map((community) => (
              <li key={community._id} className="flex items-center justify-between gap-2">
                <span>{community.name}</span>
                <span className="text-xs text-muted">{community.code}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="text-base font-semibold text-secondary">Structure</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
          <li>• {DEFAULT_DISTRICT_NAME} District Committee - the highest elected body.</li>
          <li>• Four Unit Committees - Itahari, Dharan, Barahachhhetra and Saune.</li>
          <li>• Three Community Committees - Parents, Women and Youth.</li>
        </ul>
      </Card>
    </div>
  );
}

export default AboutPage;
