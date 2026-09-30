import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { ACCOUNT_STATUS, MEMBER_STATUS, REGISTRATION_STATUS } from '../src/constants/enums';
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

/**
 * End-to-end workflow: a unit admin registers a community member, the request
 * reaches the district admin (with a notification), and only after district
 * approval can the member sign in to the member portal.
 */
describe('Member registration approval workflow', () => {
  let districtId: string;
  let unitId: string;
  let districtAdminToken: string;
  let unitAdminToken: string;
  let memberId = '';
  const memberEmail = 'pending.member@hps.test';
  const memberPassword = 'MemberPass@1';

  beforeAll(async () => {
    await seedFoundation();
    const district = await createDistrict('Morang', 'MOR');
    districtId = district.id;
    unitId = await createUnit(districtId, 'Biratnagar Unit', 'MOR-BR');
    await createCommunity(districtId, 'MOR-C1', unitId);

    await createUser({ email: 'super.reg@hps.test', role: ROLE_NAMES.SUPER_ADMIN });
    await createUser({
      email: 'dadmin.reg@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtId,
    });
    await createUser({
      email: 'uadmin.reg@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      district: districtId,
      unit: unitId,
    });

    districtAdminToken = await login('dadmin.reg@hps.test');
    unitAdminToken = await login('uadmin.reg@hps.test');
  });

  it('registers the member as pending, ignores client approval fields and notifies the district admin', async () => {
    const response = await request(app)
      .post('/api/members')
      .set(bearer(unitAdminToken))
      .send({
        firstName: 'Pending',
        lastName: 'Member',
        phone: '9800000001',
        email: memberEmail,
        unit: unitId,
        status: 'ACTIVE',
        registrationStatus: 'APPROVED',
      });

    expect(response.status, JSON.stringify(response.body)).toBe(201);
    memberId = response.body.data._id;
    expect(response.body.data.status).toBe(MEMBER_STATUS.PENDING);
    expect(response.body.data.registrationStatus).toBe(REGISTRATION_STATUS.PENDING);
    expect(response.body.data.registrationRequestedBy).toBeTruthy();

    const notifications = await request(app)
      .get('/api/notifications')
      .set(bearer(districtAdminToken));
    expect(notifications.status).toBe(200);
    const titles = notifications.body.data.map((entry: { title: string }) => entry.title);
    expect(titles).toContain('Member registration awaiting approval');
  });

  it('hides the request queue from unit admins', async () => {
    const response = await request(app)
      .get('/api/members/requests')
      .set(bearer(unitAdminToken));
    expect(response.status).toBe(403);
  });

  it('shows the pending request to the district admin with the requester name', async () => {
    const response = await request(app)
      .get('/api/members/requests')
      .set(bearer(districtAdminToken));
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]._id).toBe(memberId);
    expect(response.body.data[0].registrationRequestedByName).toBeTruthy();
  });

  it('creates a blocked (PENDING) login while the registration awaits approval', async () => {
    const response = await request(app)
      .post(`/api/members/${memberId}/account`)
      .set(bearer(unitAdminToken))
      .send({ email: memberEmail, password: memberPassword });

    expect(response.status).toBe(201);
    expect(response.body.data.account.status).toBe(ACCOUNT_STATUS.PENDING);

    const signIn = await request(app)
      .post('/api/auth/login')
      .send({ email: memberEmail, password: memberPassword });
    expect(signIn.status).toBe(403);
    expect(signIn.body.message).toContain('pending activation');
  });

  it('does not let a unit admin approve the registration', async () => {
    const response = await request(app)
      .post(`/api/members/${memberId}/approve`)
      .set(bearer(unitAdminToken))
      .send({});
    expect(response.status).toBe(403);
  });

  it('activates the member and the login after district approval and notifies the requester', async () => {
    const response = await request(app)
      .post(`/api/members/${memberId}/approve`)
      .set(bearer(districtAdminToken))
      .send({ note: 'Verified by the district' });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe(MEMBER_STATUS.ACTIVE);
    expect(response.body.data.registrationStatus).toBe(REGISTRATION_STATUS.APPROVED);

    const notifications = await request(app)
      .get('/api/notifications')
      .set(bearer(unitAdminToken));
    expect(notifications.status).toBe(200);
    const titles = notifications.body.data.map((entry: { title: string }) => entry.title);
    expect(titles).toContain('Member registration approved');
  });


  it('lets the approved member sign in to the member portal', async () => {
    const signIn = await request(app)
      .post('/api/auth/login')
      .send({ email: memberEmail, password: memberPassword });
    expect(signIn.status).toBe(200);
    expect(signIn.body.data.accessToken).toBeTruthy();
  });

  it('empties the queue and refuses a second decision on the same request', async () => {
    const list = await request(app)
      .get('/api/members/requests')
      .set(bearer(districtAdminToken));
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(0);

    const again = await request(app)
      .post(`/api/members/${memberId}/approve`)
      .set(bearer(districtAdminToken))
      .send({});
    expect(again.status).toBe(409);
  });

  it('rejects a registration while keeping the member unusable', async () => {
    const created = await request(app)
      .post('/api/members')
      .set(bearer(unitAdminToken))
      .send({
        firstName: 'Rejected',
        lastName: 'Member',
        phone: '9800000002',
        email: 'rejected.member@hps.test',
        unit: unitId,
      });
    expect(created.status).toBe(201);
    const rejectedId = created.body.data._id;

    const response = await request(app)
      .post(`/api/members/${rejectedId}/reject`)
      .set(bearer(districtAdminToken))
      .send({ reason: 'Documents not provided' });
    expect(response.status).toBe(200);
    expect(response.body.data.registrationStatus).toBe(REGISTRATION_STATUS.REJECTED);
    expect(response.body.data.status).toBe(MEMBER_STATUS.PENDING);

    const notifications = await request(app)
      .get('/api/notifications')
      .set(bearer(unitAdminToken));
    const titles = notifications.body.data.map((entry: { title: string }) => entry.title);
    expect(titles).toContain('Member registration rejected');
  });

  it('blocks a unit admin from activating a pending registration through the update path', async () => {
    const created = await request(app)
      .post('/api/members')
      .set(bearer(unitAdminToken))
      .send({
        firstName: 'Sneaky',
        lastName: 'Member',
        phone: '9800000003',
        unit: unitId,
      });
    expect(created.status).toBe(201);
    const pendingId = created.body.data._id;

    const response = await request(app)
      .patch(`/api/members/${pendingId}`)
      .set(bearer(unitAdminToken))
      .send({ status: 'ACTIVE' });
    expect(response.status).toBe(403);
  });

  it('lets district level accounts register members without an approval step', async () => {
    const response = await request(app)
      .post('/api/members')
      .set(bearer(districtAdminToken))
      .send({
        firstName: 'Direct',
        lastName: 'Member',
        phone: '9800000004',
        unit: unitId,
        status: 'ACTIVE',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.registrationStatus).toBeUndefined();
    expect(response.body.data.status).toBe(MEMBER_STATUS.ACTIVE);
  });
});
