import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MEMBERSHIP_TYPE, MEMBER_STATUS } from '../src/constants/enums';
import { ROLE_NAMES } from '../src/constants/roles';
import {
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

/**
 * The member list labels every record with a district committee membership
 * type, its unit, communities, address, municipality, ward and status. The
 * organization only ever runs one district, so the district itself is scope
 * data rather than a column. This suite pins that contract: the whole list
 * round-trips through the API, the legacy values keep working, and the
 * district admin never leaves their scope.
 */
const DISTRICT_ROLES = [
  MEMBERSHIP_TYPE.DISTRICT_CHIEF,
  MEMBERSHIP_TYPE.SECRETARY,
  MEMBERSHIP_TYPE.JOINT_SECRETARY,
  MEMBERSHIP_TYPE.CHAIRPERSON,
  MEMBERSHIP_TYPE.VICE_CHAIRPERSON,
  MEMBERSHIP_TYPE.TREASURER,
  MEMBERSHIP_TYPE.JOINT_TREASURER,
  MEMBERSHIP_TYPE.REGULAR,
];

const LEGACY_ROLES = [
  MEMBERSHIP_TYPE.COMMITTEE,
  MEMBERSHIP_TYPE.COORDINATOR,
  MEMBERSHIP_TYPE.VOLUNTEER,
  MEMBERSHIP_TYPE.OTHER,
];

describe('Member membership types', () => {
  let districtId: string;
  let otherDistrictId: string;
  let unitId: string;
  let communityId: string;
  let districtAdminToken: string;
  let memberId: string;

  beforeAll(async () => {
    await seedFoundation();

    const district = await createDistrict('Jhapa', 'JHA');
    districtId = district.id;
    otherDistrictId = (await createDistrict('Sunsari', 'SUN')).id;
    unitId = await createUnit(districtId, 'Damak Unit', 'JHA-DM');
    communityId = await createCommunity(districtId, 'JHA-C1', unitId);

    await createUser({ email: 'super.mtype@hps.test', role: ROLE_NAMES.SUPER_ADMIN });
    await createUser({
      email: 'dadmin.mtype@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtId,
    });

    districtAdminToken = await login('dadmin.mtype@hps.test');

    const member = await createMember({
      district: districtId,
      unit: unitId,
      communities: [communityId],
      firstName: 'Kalpana',
      lastName: 'Basnet',
    });
    memberId = member.id;
  });

  it('accepts every district committee role', async () => {
    for (const role of DISTRICT_ROLES) {
      const response = await request(app)
        .patch(`/api/members/${memberId}`)
        .set(bearer(districtAdminToken))
        .send({ membershipType: role });

      expect(response.status, `${role}: ${JSON.stringify(response.body)}`).toBe(200);
      expect(response.body.data.membershipType).toBe(role);
    }
  });

  it('still accepts the historical membership types', async () => {
    for (const role of LEGACY_ROLES) {
      const response = await request(app)
        .patch(`/api/members/${memberId}`)
        .set(bearer(districtAdminToken))
        .send({ membershipType: role });

      expect(response.status, `${role}: ${JSON.stringify(response.body)}`).toBe(200);
      expect(response.body.data.membershipType).toBe(role);
    }
  });

  it('rejects a membership type outside the list', async () => {
    const response = await request(app)
      .patch(`/api/members/${memberId}`)
      .set(bearer(districtAdminToken))
      .send({ membershipType: 'CHAIRMAN' });

    expect(response.status).toBe(422);
  });

  it('returns the fields the list screen renders', async () => {
    const created = await request(app)
      .post('/api/members')
      .set(bearer(districtAdminToken))
      .send({
        firstName: 'Bishal',
        lastName: 'Khadka',
        phone: '9800000111',
        unit: unitId,
        communities: [communityId],
        membershipType: MEMBERSHIP_TYPE.JOINT_TREASURER,
        address: 'Damak Bazaar',
        municipality: 'Damak Municipality',
        ward: '05',
        status: MEMBER_STATUS.ACTIVE,
      });

    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(created.body.data.membershipType).toBe(MEMBERSHIP_TYPE.JOINT_TREASURER);
    expect(created.body.data.address).toBe('Damak Bazaar');
    expect(created.body.data.municipality).toBe('Damak Municipality');
    expect(created.body.data.ward).toBe('05');
    expect(created.body.data.status).toBe(MEMBER_STATUS.ACTIVE);

    // Reads are what the screen renders: refs arrive populated, and the record
    // stays inside the district the admin is scoped to.
    const detail = await request(app)
      .get(`/api/members/${created.body.data._id}`)
      .set(bearer(districtAdminToken));
    expect(detail.status, JSON.stringify(detail.body)).toBe(200);
    expect(detail.body.data.district._id).toBe(districtId);
    expect(detail.body.data.communities).toHaveLength(1);
    expect(detail.body.data.communities[0]._id).toBe(communityId);
  });

  it('filters the list by a district membership type and keeps the district scope', async () => {
    await request(app)
      .patch(`/api/members/${memberId}`)
      .set(bearer(districtAdminToken))
      .send({ membershipType: MEMBERSHIP_TYPE.DISTRICT_CHIEF });

    const response = await request(app)
      .get(`/api/members?membershipType=${MEMBERSHIP_TYPE.DISTRICT_CHIEF}`)
      .set(bearer(districtAdminToken));

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    for (const member of response.body.data) {
      expect(member.membershipType).toBe(MEMBERSHIP_TYPE.DISTRICT_CHIEF);
      expect(member.district._id).toBe(districtId);
    }
  });

  it('never exposes a member of another district to the district admin', async () => {
    const outsider = await createMember({
      district: otherDistrictId,
      firstName: 'Outside',
      lastName: 'District',
      membershipType: MEMBERSHIP_TYPE.DISTRICT_CHIEF,
    });

    const list = await request(app)
      .get(`/api/members?membershipType=${MEMBERSHIP_TYPE.DISTRICT_CHIEF}`)
      .set(bearer(districtAdminToken));
    expect(list.body.data.some((member: { _id: string }) => member._id === outsider.id)).toBe(
      false,
    );

    const blocked = await request(app)
      .patch(`/api/members/${outsider.id}`)
      .set(bearer(districtAdminToken))
      .send({ membershipType: MEMBERSHIP_TYPE.REGULAR });
    expect(blocked.status).toBe(404);
  });
});
