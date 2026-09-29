import { Card } from '../../../../components/ui';
import { PublicPageHeader } from '../../Layouts/components/publicSections';
import { usePublicDetail, usePublicList } from '../../hooks/usePublicData';
import { fetchDistrictPublic, fetchUnitsPublic } from '../../services/publicService';

export function DistrictPage() {
  const { data: district, loading, error } = usePublicDetail(fetchDistrictPublic);
  const units = usePublicList(fetchUnitsPublic, { limit: 20, sort: 'name', order: 'asc' });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <PublicPageHeader
        eyebrow="District profile"
        title={district?.name ?? 'Sunsari'}
        description={district?.description ?? 'The Sunsari district chapter of HEAVENLY PATH.'}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Province', value: district?.province ?? '-' },
          { label: 'Country', value: district?.country ?? '-' },
          { label: 'District code', value: district?.code ?? '-' },
          { label: 'Units', value: units.pagination?.pagination?.total ?? 0 },
        ].map((item) => (
          <Card key={item.label}>
            <p className="text-xs text-muted uppercase">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-secondary">{item.value}</p>
          </Card>
        ))}
      </div>

      {district?.contact && (
        <Card className="mt-4">
          <h2 className="text-base font-semibold text-secondary">Contact</h2>
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
            {district.contact.phone && (
              <div>
                <dt className="text-xs text-muted">Phone</dt>
                <dd className="text-slate-700">{district.contact.phone}</dd>
              </div>
            )}
            {district.contact.email && (
              <div>
                <dt className="text-xs text-muted">Email</dt>
                <dd className="text-slate-700">{district.contact.email}</dd>
              </div>
            )}
            {district.contact.address && (
              <div>
                <dt className="text-xs text-muted">Address</dt>
                <dd className="text-slate-700">{district.contact.address}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      {loading && <p className="mt-3 text-sm text-muted">Loading district profile...</p>}
    </div>
  );
}

export default DistrictPage;
