import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MEMBER_STATUS } from '../src/constants/enums';
import { ROLE_NAMES } from '../src/constants/roles';
import { MemberModel } from '../src/modules/members/member.model';
import {
  SUPER_ADMIN_EMAIL,
  app,
  bearer,
  createCommunity,
  createDistrict,
  createMember,
  createUnit,
  createUser,
  login,
  seedFoundation,
} from './helpers';

/** Reads the identifier whether a reference is populated or a raw value. */
const idOf = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    const nested = (value as { _id?: unknown })._id;
    return nested ? String(nested) : '';
  }
  return String(value);
};

describe('Organizational scope enforcement', () => {
  let districtA: string;
  let districtB: string;
  let unitA1: string;
  let unitA2: string;
  let unitB1: string;
  let memberA1: { id: string; memberId: string };
  let memberA2: { id: string; memberId: string };
  let memberB1: { id: string; memberId: string };
  let superToken: string;
  let districtAdminAToken: string;
  let unitAdminA1Token: string;
  let memberAccountToken: string;
  let districtAdminBToken: string;

  beforeAll(async () => {
    await seedFoundation();
    const sunsari = await createDistrict('Sunsari', 'SUN');
    const jhapa = await createDistrict('Jhapa', 'JHA');
    districtA = sunsari.id;
    districtB = jhapa.id;

    unitA1 = await createUnit(districtA, 'Itahari Unit', 'SUN-IT');
    unitA2 = await createUnit(districtA, 'Dharan Unit', 'SUN-DH');
    unitB1 = await createUnit(districtB, 'Birtamod Unit', 'JHA-BM');
    const communityA1 = await createCommunity(districtA, 'SUN-C1', unitA1);

    memberA1 = await createMember({
      district: districtA,
      unit: unitA1,
      communities: [communityA1],
      gender: 'FEMALE',
    });
    memberA2 = await createMember({ district: districtA, unit: unitA2, gender: 'MALE' });
    memberB1 = await createMember({ district: districtB, unit: unitB1, gender: 'MALE' });

    await createUser({ email: SUPER_ADMIN_EMAIL, role: ROLE_NAMES.SUPER_ADMIN });
    await createUser({
      email: 'district.admin.a@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtA,
    });
    await createUser({
      email: 'unit.admin.a1@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      district: districtA,
      unit: unitA1,
    });
    await createUser({
      email: 'district.admin.b@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtB,
    });
    await createUser({
      email: 'member.account@hps.test',
      role: ROLE_NAMES.MEMBER,
      district: districtA,
      unit: unitA1,
      member: memberA1.id,
    });

    superToken = await login(SUPER_ADMIN_EMAIL);
    districtAdminAToken = await login('district.admin.a@hps.test');
    unitAdminA1Token = await login('unit.admin.a1@hps.test');
    districtAdminBToken = await login('district.admin.b@hps.test');
    memberAccountToken = await login('member.account@hps.test');
  });

  it('rejects anonymous access to administrative endpoints', async () => {
    for (const path of ['/api/members', '/api/units', '/api/reports/dashboard']) {
      const response = await request(app).get(path);
      expect(response.status, path).toBe(401);
    }
  });

  it('limits a district administrator to their own district', async () => {
    const response = await request(app).get('/api/members').set(bearer(districtAdminAToken));
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    for (const item of response.body.data) {
      expect(idOf((item as Record<string, unknown>).district)).toBe(districtA);
    }
    expect(response.body.meta.pagination.total).toBe(2);
  });

  it('limits a unit administrator to their own unit', async () => {
    const response = await request(app).get('/api/members').set(bearer(unitAdminA1Token));
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].memberId).toBe(memberA1.memberId);
  });

  it('lets the super admin read every district', async () => {
    const response = await request(app).get('/api/members').set(bearer(superToken));
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
  });

  it('hides records that live outside the caller scope', async () => {
    const outside = await request(app)
      .get(`/api/members/${memberB1.id}`)
      .set(bearer(districtAdminAToken));
    expect(outside.status).toBe(404);

    const inScope = await request(app)
      .get(`/api/members/${memberA1.id}`)
      .set(bearer(districtAdminAToken));
    expect(inScope.status).toBe(200);
  });

  it('refuses to register a member in a foreign district', async () => {
    const response = await request(app)
      .post('/api/members')
      .set(bearer(districtAdminAToken))
      .send({ firstName: 'Intruder', lastName: 'Member', district: districtB });
    expect(response.status).toBe(403);
  });

  it('refuses to create or move a unit outside the caller district', async () => {
    const foreignCreate = await request(app)
      .post('/api/units')
      .set(bearer(districtAdminAToken))
      .send({ name: 'Foreign unit', code: 'FR-1', district: districtB });
    expect(foreignCreate.status).toBe(403);

    const ownCreate = await request(app)
      .post('/api/units')
      .set(bearer(districtAdminAToken))
      .send({ name: 'New own unit', code: 'SUN-NEW' });
    expect(ownCreate.status).toBe(201);
    expect(idOf(ownCreate.body.data.district)).toBe(districtA);

    const foreignMove = await request(app)
      .patch(`/api/units/${unitA1}`)
      .set(bearer(districtAdminAToken))
      .send({ district: districtB });
    expect(foreignMove.status).toBe(403);
  });

  it('keeps administrative endpoints closed to member accounts', async () => {
    const list = await request(app).get('/api/members').set(bearer(memberAccountToken));
    expect(list.status).toBe(403);

    const dashboard = await request(app)
      .get('/api/reports/dashboard')
      .set(bearer(memberAccountToken));
    expect(dashboard.status).toBe(403);
  });

  it('lets members read and update only their own profile', async () => {
    const profile = await request(app).get('/api/members/me').set(bearer(memberAccountToken));
    expect(profile.status).toBe(200);
    expect(profile.body.data.memberId).toBe(memberA1.memberId);

    const updated = await request(app)
      .patch('/api/members/me')
      .set(bearer(memberAccountToken))
      .send({
        phone: '9800000001',
        // These fields must be ignored by the self service endpoint.
        status: MEMBER_STATUS.SUSPENDED,
        district: districtB,
        memberId: 'HACKED-1',
      });
    expect(updated.status).toBe(200);

    const stored = await MemberModel.findById(memberA1.id).lean().exec();
    expect(stored?.phone).toBe('9800000001');
    expect(stored?.status).toBe(MEMBER_STATUS.ACTIVE);
    expect(String(stored?.district)).toBe(districtA);
    expect(stored?.memberId).toBe(memberA1.memberId);
  });

  it('scopes the other district administrator independently', async () => {
    const response = await request(app).get('/api/members').set(bearer(districtAdminBToken));
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].memberId).toBe(memberB1.memberId);

    const foreign = await request(app)
      .get(`/api/members/${memberA2.id}`)
      .set(bearer(districtAdminBToken));
    expect(foreign.status).toBe(404);
  });
});
