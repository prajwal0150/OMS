import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { ROLE_NAMES } from '../src/constants/roles';
import {
  app,
  bearer,
  createCommunity,
  createDistrict,
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

const createAccount = (token: string, payload: Record<string, unknown>) =>
  request(app).post('/api/administrators').set(bearer(token)).send(payload);

/**
 * Each unit of a district has its own members and its own unit administrator,
 * so the district administrator appoints, re-scopes and retires those accounts.
 * The delegation never leaves the district, and a unit administrator never gains
 * the power to manage administrator accounts.
 */
describe('Administrator accounts delegated to district administrators', () => {
  let districtA: string;
  let districtB: string;
  let unitA1: string;
  let unitA2: string;
  let communityA1: string;
  let foreignUnitId: string;
  let districtAdminAToken: string;
  let unitAdminToken: string;
  let foreignAccountId = '';
  let createdUnitAdminId = '';

  beforeAll(async () => {
    await seedFoundation();
    districtA = (await createDistrict('Sunsari', 'SUN')).id;
    districtB = (await createDistrict('Jhapa', 'JHA')).id;
    unitA1 = await createUnit(districtA, 'Itahari Unit', 'SUN-IT');
    unitA2 = await createUnit(districtA, 'Biratnagar Unit', 'SUN-BR');
    communityA1 = await createCommunity(districtA, 'SUN-C1', unitA1);
    foreignUnitId = await createUnit(districtB, 'Damak Unit', 'JHA-DM');

    await createUser({ email: 'super.delegation@hps.test', role: ROLE_NAMES.SUPER_ADMIN });
    await createUser({
      email: 'dadmin.delegation.a@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtA,
    });
    await createUser({
      email: 'dadmin.delegation.b@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtB,
    });
    await createUser({
      email: 'uadmin.delegation.a@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      district: districtA,
      unit: unitA1,
    });

    districtAdminAToken = await login('dadmin.delegation.a@hps.test');
    unitAdminToken = await login('uadmin.delegation.a@hps.test');

    const superToken = await login('super.delegation@hps.test');
    const foreign = await createAccount(superToken, {
      firstName: 'Foreign',
      lastName: 'Account',
      email: 'foreign.delegation@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      district: districtB,
      unit: foreignUnitId,
    });
    foreignAccountId = foreign.body.data.account.id as string;
  });

  it('appoints a unit administrator for each unit of the district', async () => {
    const first = await createAccount(districtAdminAToken, {
      firstName: 'Sita',
      lastName: 'Karki',
      email: 'unit.a.delegation@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      unit: unitA1,
    });
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    createdUnitAdminId = first.body.data.account.id as string;

    const second = await createAccount(districtAdminAToken, {
      firstName: 'Bishal',
      lastName: 'Khadka',
      email: 'unit.b.delegation@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      unit: unitA2,
    });
    expect(second.status, JSON.stringify(second.body)).toBe(201);

    const detail = await request(app)
      .get(`/api/administrators/${createdUnitAdminId}`)
      .set(bearer(districtAdminAToken));
    expect(detail.status).toBe(200);
    // The district is never sent by the caller: it is filled in from their scope.
    expect(idOf(detail.body.data.district)).toBe(districtA);
    expect(idOf(detail.body.data.unit)).toBe(unitA1);
  });

  it('appoints a community coordinator inside the district', async () => {
    const response = await createAccount(districtAdminAToken, {
      firstName: 'Anita',
      lastName: 'Limbu',
      email: 'coordinator.delegation@hps.test',
      role: ROLE_NAMES.COMMUNITY_COORDINATOR,
      community: communityA1,
    });
    expect(response.status, JSON.stringify(response.body)).toBe(201);
  });

  it('refuses an appointment that leaves the caller district', async () => {
    const foreignDistrict = await createAccount(districtAdminAToken, {
      firstName: 'Outsider',
      lastName: 'Attempt',
      email: 'outsider.delegation@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      district: districtB,
    });
    expect(foreignDistrict.status).toBe(403);

    const foreignUnit = await createAccount(districtAdminAToken, {
      firstName: 'Wrong',
      lastName: 'Unit',
      email: 'wrong.unit.delegation@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      unit: foreignUnitId,
    });
    // The district is auto-filled, so the foreign unit is caught by its parent.
    expect(foreignUnit.status).toBe(400);
    expect(foreignUnit.body.message).toContain('does not belong to this district');
  });

  it('never appoints a role the module does not manage', async () => {
    for (const role of [ROLE_NAMES.SUPER_ADMIN, ROLE_NAMES.MEMBER]) {
      const response = await createAccount(districtAdminAToken, {
        firstName: 'Not',
        lastName: 'Allowed',
        email: `not.allowed.${role.toLowerCase()}@hps.test`,
        role,
      });
      expect(response.status, role).toBe(422);
    }
  });

  it('re-scopes and edits an account of the district', async () => {
    const updated = await request(app)
      .patch(`/api/administrators/${createdUnitAdminId}`)
      .set(bearer(districtAdminAToken))
      .send({ phone: '9800000456', role: ROLE_NAMES.UNIT_COMMITTEE_MEMBER, unit: unitA2 });

    expect(updated.status, JSON.stringify(updated.body)).toBe(200);

    const detail = await request(app)
      .get(`/api/administrators/${createdUnitAdminId}`)
      .set(bearer(districtAdminAToken));
    expect(detail.body.data.role).toBe(ROLE_NAMES.UNIT_COMMITTEE_MEMBER);
    expect(detail.body.data.phone).toBe('9800000456');
    expect(idOf(detail.body.data.unit)).toBe(unitA2);
  });

  it('deactivates and reactivates an account of the district', async () => {
    const deactivated = await request(app)
      .patch(`/api/administrators/${createdUnitAdminId}/status`)
      .set(bearer(districtAdminAToken))
      .send({ status: 'INACTIVE' });
    expect(deactivated.status, JSON.stringify(deactivated.body)).toBe(200);

    const reactivated = await request(app)
      .patch(`/api/administrators/${createdUnitAdminId}/status`)
      .set(bearer(districtAdminAToken))
      .send({ status: 'ACTIVE' });
    expect(reactivated.status).toBe(200);
  });

  it('never touches an account of another district', async () => {
    const read = await request(app)
      .get(`/api/administrators/${foreignAccountId}`)
      .set(bearer(districtAdminAToken));
    expect(read.status).toBe(404);

    const edit = await request(app)
      .patch(`/api/administrators/${foreignAccountId}`)
      .set(bearer(districtAdminAToken))
      .send({ phone: '9800000999' });
    expect(edit.status).toBe(404);

    const status = await request(app)
      .patch(`/api/administrators/${foreignAccountId}/status`)
      .set(bearer(districtAdminAToken))
      .send({ status: 'SUSPENDED' });
    expect(status.status).toBe(404);

    const list = await request(app).get('/api/administrators').set(bearer(districtAdminAToken));
    expect(list.status).toBe(200);
    expect(
      (list.body.data as Array<{ _id: string }>).some((row) => row._id === foreignAccountId),
    ).toBe(false);
  });

  it('clears the parent a new role can no longer use', async () => {
    const promoted = await request(app)
      .patch(`/api/administrators/${createdUnitAdminId}`)
      .set(bearer(districtAdminAToken))
      .send({ role: ROLE_NAMES.DISTRICT_COMMITTEE_MEMBER });
    expect(promoted.status, JSON.stringify(promoted.body)).toBe(200);

    const detail = await request(app)
      .get(`/api/administrators/${createdUnitAdminId}`)
      .set(bearer(districtAdminAToken));
    expect(detail.body.data.role).toBe(ROLE_NAMES.DISTRICT_COMMITTEE_MEMBER);
    expect(detail.body.data.unit ?? null).toBeNull();
    expect(idOf(detail.body.data.district)).toBe(districtA);
  });

  it('deletes a retired account but never an active one', async () => {
    const tooEarly = await request(app)
      .delete(`/api/administrators/${createdUnitAdminId}`)
      .set(bearer(districtAdminAToken));
    expect(tooEarly.status, JSON.stringify(tooEarly.body)).toBe(409);
    expect(tooEarly.body.message).toContain('Deactivate');

    const retired = await request(app)
      .patch(`/api/administrators/${createdUnitAdminId}/status`)
      .set(bearer(districtAdminAToken))
      .send({ status: 'INACTIVE' });
    expect(retired.status).toBe(200);

    const removed = await request(app)
      .delete(`/api/administrators/${createdUnitAdminId}`)
      .set(bearer(districtAdminAToken));
    expect(removed.status, JSON.stringify(removed.body)).toBe(200);

    const gone = await request(app)
      .get(`/api/administrators/${createdUnitAdminId}`)
      .set(bearer(districtAdminAToken));
    expect(gone.status).toBe(404);
  });

  it('never deletes itself or an account of another district', async () => {
    const me = await request(app).get('/api/auth/me').set(bearer(districtAdminAToken));
    const own = await request(app)
      .delete(`/api/administrators/${me.body.data.id}`)
      .set(bearer(districtAdminAToken));
    expect(own.status).toBe(403);

    const foreign = await request(app)
      .delete(`/api/administrators/${foreignAccountId}`)
      .set(bearer(districtAdminAToken));
    expect(foreign.status).toBe(404);
  });

  it('keeps unit administrators out of account management', async () => {
    const create = await createAccount(unitAdminToken, {
      firstName: 'Peer',
      lastName: 'Admin',
      email: 'peer.unit.delegation@hps.test',
      role: ROLE_NAMES.UNIT_COMMITTEE_MEMBER,
      unit: unitA1,
    });
    expect(create.status).toBe(403);

    const edit = await request(app)
      .patch(`/api/administrators/${createdUnitAdminId}`)
      .set(bearer(unitAdminToken))
      .send({ phone: '9800000777' });
    expect(edit.status).toBe(403);

    const status = await request(app)
      .patch(`/api/administrators/${createdUnitAdminId}/status`)
      .set(bearer(unitAdminToken))
      .send({ status: 'INACTIVE' });
    expect(status.status).toBe(403);

    const list = await request(app).get('/api/administrators').set(bearer(unitAdminToken));
    expect(list.status).toBe(200);
  });
});