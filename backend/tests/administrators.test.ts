import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { ROLE_NAMES } from '../src/constants/roles';
import { ADMIN_MANAGED_ROLES } from '../src/constants/rolePermissions';
import {
  PASSWORD,
  SUPER_ADMIN_EMAIL,
  app,
  bearer,
  createCommunity,
  createDistrict,
  createUnit,
  createUser,
  login,
  seedFoundation,
} from './helpers';

const idOf = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    const nested = (value as { _id?: unknown })._id;
    return nested ? String(nested) : '';
  }
  return String(value);
};

const createAdmin = (token: string, payload: Record<string, unknown>) =>
  request(app).post('/api/administrators').set(bearer(token)).send(payload);

describe('Administrator account management', () => {
  let districtA: string;
  let districtB: string;
  let unitA1: string;
  let superToken: string;
  let districtAdminAToken: string;
  let superAdminId: string;
  let districtAdminId: string;
  let districtAdminPassword: string;
  let unitAdminId: string;

  beforeAll(async () => {
    await seedFoundation();
    const sunsari = await createDistrict('Sunsari', 'SUN');
    const jhapa = await createDistrict('Jhapa', 'JHA');
    districtA = sunsari.id;
    districtB = jhapa.id;

    unitA1 = await createUnit(districtA, 'Itahari Unit', 'SUN-IT');
    await createCommunity(districtA, 'SUN-C1', unitA1);

    await createUser({ email: SUPER_ADMIN_EMAIL, role: ROLE_NAMES.SUPER_ADMIN });
    await createUser({
      email: 'district.admin.a@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtA,
    });

    superToken = await login(SUPER_ADMIN_EMAIL);
    districtAdminAToken = await login('district.admin.a@hps.test');
    const me = await request(app).get('/api/auth/me').set(bearer(superToken));
    superAdminId = me.body.data.id as string;
  });

  it('creates a district administrator with a temporary password', async () => {
    const response = await createAdmin(superToken, {
      firstName: 'Nabin',
      lastName: 'Rai',
      email: 'new.district.admin@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtA,
    });

    expect(response.status).toBe(201);
    expect(response.body.data.account.role).toBe(ROLE_NAMES.DISTRICT_ADMIN);
    expect(response.body.data.account.status).toBe('ACTIVE');
    districtAdminId = response.body.data.account.id as string;
    districtAdminPassword = response.body.data.temporaryPassword as string;
    expect(districtAdminPassword).toHaveLength(12);

    const signIn = await request(app)
      .post('/api/auth/login')
      .send({ email: 'new.district.admin@hps.test', password: districtAdminPassword });
    expect(signIn.status).toBe(200);
    expect(signIn.body.data.forcePasswordChange).toBe(true);
  });

  it('enforces the scope requirements of every administrator role', async () => {
    const withoutDistrict = await createAdmin(superToken, {
      firstName: 'No',
      lastName: 'District',
      email: 'no.district@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
    });
    expect(withoutDistrict.status).toBe(400);

    const unitAdminWithoutUnit = await createAdmin(superToken, {
      firstName: 'No',
      lastName: 'Unit',
      email: 'no.unit@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      district: districtA,
    });
    expect(unitAdminWithoutUnit.status).toBe(400);

    const coordinatorWithoutCommunity = await createAdmin(superToken, {
      firstName: 'No',
      lastName: 'Community',
      email: 'no.community@hps.test',
      role: ROLE_NAMES.COMMUNITY_COORDINATOR,
      district: districtA,
    });
    expect(coordinatorWithoutCommunity.status).toBe(400);

    const unitAdmin = await createAdmin(superToken, {
      firstName: 'Sita',
      lastName: 'Karki',
      email: 'unit.admin@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      district: districtA,
      unit: unitA1,
    });
    expect(unitAdmin.status).toBe(201);
    unitAdminId = unitAdmin.body.data.account.id as string;
  });

  it('refuses roles that are not administrable', async () => {
    for (const role of [ROLE_NAMES.SUPER_ADMIN, ROLE_NAMES.MEMBER]) {
      const response = await createAdmin(superToken, {
        firstName: 'Not',
        lastName: 'Administrable',
        email: `not.allowed.${role.toLowerCase()}@hps.test`,
        role,
        district: districtA,
      });
      expect(response.status, role).toBe(422);
    }
  });

  it('rejects duplicate email addresses', async () => {
    const response = await createAdmin(superToken, {
      firstName: 'Duplicate',
      lastName: 'Email',
      email: 'new.district.admin@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtA,
    });
    expect(response.status).toBe(409);
  });

  it('lets a district administrator create accounts inside their own district only', async () => {
    const own = await createAdmin(districtAdminAToken, {
      firstName: 'Sita',
      lastName: 'Karki',
      email: 'delegated.unit.admin@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      unit: unitA1,
    });
    expect(own.status, JSON.stringify(own.body)).toBe(201);

    const foreign = await createAdmin(districtAdminAToken, {
      firstName: 'Outsider',
      lastName: 'Attempt',
      email: 'outsider.attempt@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      district: districtB,
      unit: unitA1,
    });
    expect(foreign.status).toBe(403);
  });

  it('lists administrators by role inside the caller scope', async () => {
    const superList = await request(app).get('/api/administrators').set(bearer(superToken));
    expect(superList.status).toBe(200);
    const roles = (superList.body.data as Array<{ role: string }>).map((row) => row.role);
    const emails = (superList.body.data as Array<{ email: string }>)
      .map((row) => row.email)
      .sort();
    expect(emails).toEqual([
      'delegated.unit.admin@hps.test',
      'district.admin.a@hps.test',
      'new.district.admin@hps.test',
      'unit.admin@hps.test',
    ]);
    for (const role of roles) {
      expect(ADMIN_MANAGED_ROLES as string[]).toContain(role);
    }

    const filtered = await request(app)
      .get(`/api/administrators?role=${ROLE_NAMES.UNIT_ADMIN}`)
      .set(bearer(superToken));
    expect(filtered.body.data).toHaveLength(2);
    expect(
      (filtered.body.data as Array<{ email: string }>).map((row) => row.email).sort(),
    ).toEqual(['delegated.unit.admin@hps.test', 'unit.admin@hps.test']);

    const scoped = await request(app).get('/api/administrators').set(bearer(districtAdminAToken));
    expect(scoped.status).toBe(200);
    expect(scoped.body.data.length).toBeGreaterThan(0);
    for (const row of scoped.body.data as Array<{ district?: unknown }>) {
      expect(idOf(row.district)).toBe(districtA);
    }
  });

  it('suspends and reactivates an administrator account', async () => {
    const suspended = await request(app)
      .patch(`/api/administrators/${districtAdminId}/status`)
      .set(bearer(superToken))
      .send({ status: 'SUSPENDED' });
    expect(suspended.status).toBe(200);

    const blocked = await request(app)
      .post('/api/auth/login')
      .send({ email: 'new.district.admin@hps.test', password: districtAdminPassword });
    expect(blocked.status).toBe(403);

    const reactivated = await request(app)
      .patch(`/api/administrators/${districtAdminId}/status`)
      .set(bearer(superToken))
      .send({ status: 'ACTIVE' });
    expect(reactivated.status).toBe(200);

    const allowed = await request(app)
      .post('/api/auth/login')
      .send({ email: 'new.district.admin@hps.test', password: districtAdminPassword });
    expect(allowed.status).toBe(200);

    // Super admin accounts are outside the administrators module entirely.
    const selfChange = await request(app)
      .patch(`/api/administrators/${superAdminId}/status`)
      .set(bearer(superToken))
      .send({ status: 'SUSPENDED' });
    expect(selfChange.status).toBe(404);
  });

  it('resets an administrator password', async () => {
    const response = await request(app)
      .post(`/api/administrators/${unitAdminId}/reset-password`)
      .set(bearer(superToken));
    expect(response.status).toBe(200);
    const temporaryPassword = response.body.data.temporaryPassword as string;

    const signIn = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unit.admin@hps.test', password: temporaryPassword });
    expect(signIn.status).toBe(200);
    expect(signIn.body.data.forcePasswordChange).toBe(true);

    const oldPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unit.admin@hps.test', password: PASSWORD });
    expect(oldPassword.status).toBe(401);
  });

  it('refuses to touch administrators outside the caller district', async () => {
    const foreign = await createAdmin(superToken, {
      firstName: 'Jhapa',
      lastName: 'Admin',
      email: 'district.admin.b@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtB,
    });
    expect(foreign.status).toBe(201);
    const foreignId = foreign.body.data.account.id as string;

    const detail = await request(app)
      .get(`/api/administrators/${foreignId}`)
      .set(bearer(districtAdminAToken));
    expect(detail.status).toBe(404);

    const permission = await request(app)
      .post(`/api/administrators/${foreignId}/reset-password`)
      .set(bearer(districtAdminAToken));
    expect(permission.status).toBe(404);

    const status = await request(app)
      .patch(`/api/administrators/${foreignId}/status`)
      .set(bearer(districtAdminAToken))
      .send({ status: 'SUSPENDED' });
    expect(status.status).toBe(404);
  });

  it('exposes the role list and the guarded permission catalog', async () => {
    const roles = await request(app).get('/api/administrators/roles').set(bearer(superToken));
    expect(roles.status).toBe(200);
    expect(roles.body.data).toHaveLength(8);

    const forbiddenCatalog = await request(app)
      .get('/api/administrators/roles/catalog')
      .set(bearer(districtAdminAToken));
    expect(forbiddenCatalog.status).toBe(403);

    const catalog = await request(app)
      .get('/api/administrators/roles/catalog')
      .set(bearer(superToken));
    expect(catalog.status).toBe(200);
    const keys = (catalog.body.data as Array<{ permissions: Array<{ key: string }> }>).flatMap(
      (group) => group.permissions.map((entry) => entry.key),
    );
    expect(keys).toContain('member.view');
    expect(keys).toContain('report.export');
  });

  it('protects the break-glass permissions of a role', async () => {
    const roles = await request(app).get('/api/administrators/roles').set(bearer(superToken));
    const target = (roles.body.data as Array<{ _id: string; name: string }>).find(
      (role) => role.name === ROLE_NAMES.COMMITTEE_MEMBER,
    );
    expect(target).toBeTruthy();

    const missingRequired = await request(app)
      .patch(`/api/administrators/roles/${target?._id}/permissions`)
      .set(bearer(superToken))
      .send({ permissions: ['committee.view'] });
    expect(missingRequired.status).toBe(400);

    const unknownKey = await request(app)
      .patch(`/api/administrators/roles/${target?._id}/permissions`)
      .set(bearer(superToken))
      .send({ permissions: ['portal.access', 'not.a.permission'] });
    expect(unknownKey.status).toBe(422);

    const updated = await request(app)
      .patch(`/api/administrators/roles/${target?._id}/permissions`)
      .set(bearer(superToken))
      .send({ permissions: ['portal.access', 'committee.view', 'committee.view'] });
    expect(updated.status).toBe(200);
    expect(updated.body.data.permissions).toEqual(['portal.access', 'committee.view']);
  });
});
