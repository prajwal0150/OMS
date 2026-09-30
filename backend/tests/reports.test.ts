import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { ROLE_NAMES } from '../src/constants/roles';
import {
  SUPER_ADMIN_EMAIL,
  app,
  bearer,
  binaryParser,
  createCommunity,
  createDistrict,
  createMember,
  createUnit,
  createUser,
  login,
  seedFoundation,
} from './helpers';

const previewUrl = (type: string) => `/api/reports/preview?type=${type}`;

describe('Reports and analytics', () => {
  let districtA: string;
  let superToken: string;
  let districtAdminAToken: string;
  let memberAccountToken: string;
  let firstMemberId: string;

  beforeAll(async () => {
    await seedFoundation();
    const sunsari = await createDistrict('Sunsari', 'SUN');
    const jhapa = await createDistrict('Jhapa', 'JHA');
    districtA = sunsari.id;

    const unitA = await createUnit(districtA, 'Itahari Unit', 'SUN-IT');
    const unitB = await createUnit(jhapa.id, 'Birtamod Unit', 'JHA-BM');
    const communityA = await createCommunity(districtA, 'SUN-C1', unitA);
    await createCommunity(jhapa.id, 'JHA-C1', unitB);

    const first = await createMember({
      district: districtA,
      unit: unitA,
      communities: [communityA],
      gender: 'FEMALE',
    });
    firstMemberId = first.memberId;
    await createMember({ district: districtA, unit: unitA, gender: 'MALE' });
    await createMember({ district: districtA, gender: 'OTHER' });
    await createMember({ district: jhapa.id, unit: unitB, gender: 'MALE' });

    await createUser({ email: SUPER_ADMIN_EMAIL, role: ROLE_NAMES.SUPER_ADMIN });
    await createUser({
      email: 'district.admin.a@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtA,
    });
    await createUser({
      email: 'member.account@hps.test',
      role: ROLE_NAMES.MEMBER,
      district: districtA,
      member: first.id,
    });

    superToken = await login(SUPER_ADMIN_EMAIL);
    districtAdminAToken = await login('district.admin.a@hps.test');
    memberAccountToken = await login('member.account@hps.test');
  });

  it('returns organization wide dashboard analytics to the super admin', async () => {
    const response = await request(app)
      .get('/api/reports/dashboard')
      .set(bearer(superToken));

    expect(response.status).toBe(200);
    expect(response.body.data.members.total).toBe(4);
    expect(response.body.data.members.active).toBe(4);
    expect(response.body.data.totals.units).toBe(2);
    expect(response.body.data.totals.communities).toBe(2);
    expect(Array.isArray(response.body.data.charts.membersByUnit)).toBe(true);
    expect(response.body.data.charts.membersByUnit).toHaveLength(3);
    expect(response.body.data.charts.monthlyGrowth).toHaveLength(12);
    expect(response.body.data.upcomingEvents).toEqual([]);
  });

  it('scopes the dashboard to the caller district', async () => {
    const response = await request(app)
      .get('/api/reports/dashboard')
      .set(bearer(districtAdminAToken));

    expect(response.status).toBe(200);
    expect(response.body.data.members.total).toBe(3);
    expect(response.body.data.totals.units).toBe(1);
    expect(response.body.data.totals.communities).toBe(1);
  });

  it('summarises the district and the membership trend', async () => {
    const summary = await request(app)
      .get('/api/reports/summary/district')
      .set(bearer(districtAdminAToken));
    expect(summary.status).toBe(200);
    expect(summary.body.data.members.total).toBe(3);
    expect(summary.body.data.totals.units).toBe(1);

    const trend = await request(app)
      .get('/api/reports/trend/membership?months=6')
      .set(bearer(districtAdminAToken));
    expect(trend.status).toBe(200);
    expect(trend.body.data).toHaveLength(6);
  });

  it('previews the member report with a scoped register', async () => {
    const response = await request(app).get(previewUrl('MEMBER')).set(bearer(superToken));
    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe('Member report');

    const summary = response.body.data.summary as Array<{ label: string; value: number }>;
    expect(summary.find((item) => item.label === 'Total members')?.value).toBe(4);

    const tables = response.body.data.tables as Array<{
      title: string;
      primary?: boolean;
      rows: Array<Record<string, string | number>>;
    }>;
    const register = tables.find((table) => table.primary);
    expect(register?.title).toBe('Member register');
    expect(register?.rows).toHaveLength(4);
    expect(register?.rows.map((row) => row.memberId)).toContain(firstMemberId);
  });

  it('rejects unknown report types and unauthorised previews', async () => {
    const unknown = await request(app).get(previewUrl('NOT_A_REPORT')).set(bearer(superToken));
    expect(unknown.status).toBe(400);

    const forbidden = await request(app)
      .get(previewUrl('MEMBER'))
      .set(bearer(memberAccountToken));
    expect(forbidden.status).toBe(403);

    const anonymous = await request(app).get(previewUrl('MEMBER'));
    expect(anonymous.status).toBe(401);
  });

  it('exports the member register as CSV, Excel and PDF', async () => {
    const csv = await request(app)
      .post('/api/reports/generate')
      .set(bearer(superToken))
      .send({ type: 'MEMBER', format: 'CSV' });
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.headers['content-disposition']).toContain('attachment');
    expect(csv.text).toContain('Member ID');
    expect(csv.text).toContain(firstMemberId);

    const excel = await request(app)
      .post('/api/reports/generate')
      .set(bearer(superToken))
      .send({ type: 'MEMBER', format: 'EXCEL' })
      .buffer(true)
      .parse(binaryParser);
    expect(excel.status).toBe(200);
    expect(excel.headers['content-type']).toContain('spreadsheetml');
    expect((excel.body as Buffer).subarray(0, 2).toString()).toBe('PK');

    const pdf = await request(app)
      .post('/api/reports/generate')
      .set(bearer(superToken))
      .send({ type: 'MEMBER', format: 'PDF' })
      .buffer(true)
      .parse(binaryParser);
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('rejects an unsupported export format', async () => {
    const response = await request(app)
      .post('/api/reports/generate')
      .set(bearer(superToken))
      .send({ type: 'MEMBER', format: 'DOCX' });
    expect(response.status).toBe(422);
  });

  it('records every export in the scoped report history', async () => {
    const superHistory = await request(app).get('/api/reports/history').set(bearer(superToken));
    expect(superHistory.status).toBe(200);
    expect(superHistory.body.meta.pagination.total).toBe(3);
    const formats = (superHistory.body.data as Array<{ format: string; rowCount: number }>)
      .map((row) => row.format)
      .sort();
    expect(formats).toEqual(['CSV', 'EXCEL', 'PDF']);
    expect(
      (superHistory.body.data as Array<{ rowCount: number }>).every((row) => row.rowCount > 0),
    ).toBe(true);

    // Exports made by the super admin stay invisible to a district administrator.
    const districtHistory = await request(app)
      .get('/api/reports/history')
      .set(bearer(districtAdminAToken));
    expect(districtHistory.body.meta.pagination.total).toBe(0);

    await request(app)
      .post('/api/reports/generate')
      .set(bearer(districtAdminAToken))
      .send({ type: 'MEMBER', format: 'CSV' });

    const districtHistoryAfter = await request(app)
      .get('/api/reports/history')
      .set(bearer(districtAdminAToken));
    expect(districtHistoryAfter.body.meta.pagination.total).toBe(1);
    expect(districtHistoryAfter.body.data[0].district).toBe(districtA);
  });

  it('deletes a history entry and refuses foreign records', async () => {
    const history = await request(app).get('/api/reports/history').set(bearer(superToken));
    const records = history.body.data as Array<{ _id: string; district?: string }>;
    expect(records).toHaveLength(4);
    // Super admin exports are organization wide (no district) — a district
    // administrator must never be able to read or delete them.
    const record = records.find((row) => !row.district);
    expect(record).toBeTruthy();

    const foreign = await request(app)
      .get(`/api/reports/history/${record?._id}`)
      .set(bearer(districtAdminAToken));
    expect(foreign.status).toBe(404);

    const foreignDelete = await request(app)
      .delete(`/api/reports/history/${record?._id}`)
      .set(bearer(districtAdminAToken));
    expect(foreignDelete.status).toBe(404);

    const removed = await request(app)
      .delete(`/api/reports/history/${record?._id}`)
      .set(bearer(superToken));
    expect(removed.status).toBe(200);

    const after = await request(app).get('/api/reports/history').set(bearer(superToken));
    expect(after.body.meta.pagination.total).toBe(3);
  });
});
