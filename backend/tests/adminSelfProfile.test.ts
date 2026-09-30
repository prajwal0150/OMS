import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { ROLE_NAMES } from '../src/constants/roles';
import { UserModel } from '../src/modules/users/user.model';
import {
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

/**
 * Administrator self service (`/administrators/me`).
 *
 * Administrators are account holders, not Member records, so the member portal
 * profile is the wrong model for them. These cases pin the contract the admin
 * profile page depends on.
 */
describe('Administrator self service profile', () => {
  let districtId: string;
  let unitId: string;
  let districtAdminToken: string;
  let unitAdminToken: string;
  let memberToken: string;

  beforeAll(async () => {
    await seedFoundation();
    const sunsari = await createDistrict('Sunsari', 'SUN');
    districtId = sunsari.id;
    unitId = await createUnit(districtId, 'Itahari Unit', 'SUN-IT');
    await createCommunity(districtId, 'SUN-C1', unitId);

    await createUser({ email: SUPER_ADMIN_EMAIL, role: ROLE_NAMES.SUPER_ADMIN });
    await createUser({
      email: 'profile.district@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtId,
      firstName: 'Dina',
      lastName: 'Rai',
    });
    await createUser({
      email: 'profile.unit@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      district: districtId,
      unit: unitId,
      firstName: 'Bikash',
      lastName: 'Thapa',
    });
    await createUser({ email: 'profile.member@hps.test', role: ROLE_NAMES.MEMBER });

    districtAdminToken = await login('profile.district@hps.test');
    unitAdminToken = await login('profile.unit@hps.test');
    memberToken = await login('profile.member@hps.test');
  });

  it('returns the caller identity and assigned scope to a district admin', async () => {
    const response = await request(app).get('/api/administrators/me').set(bearer(districtAdminToken));

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('profile.district@hps.test');
    expect(response.body.data.firstName).toBe('Dina');
    expect(response.body.data.lastName).toBe('Rai');
    expect(response.body.data.role).toBe(ROLE_NAMES.DISTRICT_ADMIN);
    expect(response.body.data.roleLabel).toBe('District Administrator');
    // The scope names come from the populated references.
    expect(response.body.data.scope.district).toBe('Sunsari');
    expect(response.body.data.scope.unit).toBeNull();
  });

  it('never exposes the login identity of another administrator', async () => {
    const response = await request(app).get('/api/administrators/me').set(bearer(unitAdminToken));

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('profile.unit@hps.test');
    expect(response.body.data.scope.district).toBe('Sunsari');
    expect(response.body.data.scope.unit).toBe('Itahari Unit');
    // The caller's own record only - no sibling account data.
    expect(response.body.data.passwordHash).toBeUndefined();
    expect(response.body.data.refreshTokens).toBeUndefined();
  });

  it('lets an administrator update their own contact details', async () => {
    const response = await request(app)
      .patch('/api/administrators/me')
      .set(bearer(districtAdminToken))
      .send({ firstName: 'Dinaupdated', lastName: 'Rai', phone: '+9779812345678', note: 'Prefers email' });

    expect(response.status).toBe(200);
    expect(response.body.data.firstName).toBe('Dinaupdated');
    expect(response.body.data.phone).toBe('+9779812345678');

    const stored = await UserModel.findOne({ email: 'profile.district@hps.test' }).lean();
    expect(stored?.firstName).toBe('Dinaupdated');
  });

  it('refuses to change the login email, role or scope through self service', async () => {
    const response = await request(app)
      .patch('/api/administrators/me')
      .set(bearer(districtAdminToken))
      .send({
        firstName: 'StillDina',
        lastName: 'Rai',
        email: 'hijack@hps.test',
        role: ROLE_NAMES.SUPER_ADMIN,
        district: null,
        status: 'ACTIVE',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('profile.district@hps.test');
    expect(response.body.data.role).toBe(ROLE_NAMES.DISTRICT_ADMIN);

    const stored = await UserModel.findOne({ email: 'profile.district@hps.test' }).lean();
    expect(stored?.email).toBe('profile.district@hps.test');
    expect(stored?.role).toBe(ROLE_NAMES.DISTRICT_ADMIN);
    // Scope is untouched, so the admin stays inside their own district.
    expect(String(stored?.district)).toBe(districtId);
  });

  it('rejects an invalid phone number', async () => {
    const response = await request(app)
      .patch('/api/administrators/me')
      .set(bearer(districtAdminToken))
      .send({ firstName: 'Dina', lastName: 'Rai', phone: 'not-a-phone' });

    expect(response.status).toBe(422);
  });

  it('keeps the endpoint closed to member accounts', async () => {
    const response = await request(app).get('/api/administrators/me').set(bearer(memberToken));
    expect(response.status).toBe(403);
  });

  it('keeps the endpoint closed to anonymous callers', async () => {
    const response = await request(app).get('/api/administrators/me');
    expect(response.status).toBe(401);
  });

  it('does not collide with the /:id administrator lookup', async () => {
    // "me" must reach the self service handler, never be read as an id.
    const asId = await request(app)
      .get('/api/administrators/me')
      .set(bearer(districtAdminToken));
    expect(asId.status).toBe(200);
    expect(asId.body.data).not.toHaveProperty('_id');
  });
});