import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { COMMITTEE_LEVEL, COMMITTEE_POSITION, MEMBERSHIP_TYPE, MEMBER_STATUS } from '../src/constants/enums';
import { ROLE_NAMES } from '../src/constants/roles';
import {
  app,
  bearer,
  createDistrict,
  createMember,
  createUnit,
  createUser,
  login,
  seedFoundation,
} from './helpers';

/**
 * Member administration is a district administrator capability: they register,
 * edit and delete the members of their own district, a member with a login
 * account or an active committee seat is never deleted, other districts stay out
 * and read-only roles keep the list without write access.
 */
describe('Member management by district administrators', () => {
  let districtA: string;
  let districtB: string;
  let unitA1: string;
  let districtAdminAToken: string;
  let committeeMemberToken: string;
  let editableMemberId = '';
  let plainMemberId = '';
  let committeeId = '';

  beforeAll(async () => {
    await seedFoundation();
    districtA = (await createDistrict('Sunsari', 'SUN')).id;
    districtB = (await createDistrict('Jhapa', 'JHA')).id;
    unitA1 = await createUnit(districtA, 'Inchorwa Unit', 'SUN-IN');
    await createUnit(districtB, 'Damak Unit', 'JHA-DM');

    await createUser({ email: 'super.members@hps.test', role: ROLE_NAMES.SUPER_ADMIN });
    await createUser({
      email: 'dadmin.members.a@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtA,
    });
    await createUser({
      email: 'cmember.members.a@hps.test',
      role: ROLE_NAMES.DISTRICT_COMMITTEE_MEMBER,
      district: districtA,
    });

    districtAdminAToken = await login('dadmin.members.a@hps.test');
    committeeMemberToken = await login('cmember.members.a@hps.test');

    const editable = await createMember({
      district: districtA,
      unit: unitA1,
      firstName: 'Sunita',
      lastName: 'Rai',
    });
    editableMemberId = editable.id;

    const plain = await createMember({
      district: districtA,
      unit: unitA1,
      firstName: 'Anita',
      lastName: 'Limbu',
    });
    plainMemberId = plain.id;

    const committee = await request(app)
      .post('/api/committees')
      .set(bearer(districtAdminAToken))
      .send({ name: 'District Steering Committee', level: COMMITTEE_LEVEL.DISTRICT });
    committeeId = String(committee.body.data._id);
  });

  it('edits a member of its own district', async () => {
    const updated = await request(app)
      .patch(`/api/members/${editableMemberId}`)
      .set(bearer(districtAdminAToken))
      .send({
        phone: '9800000123',
        municipality: 'Dharan Municipality',
        ward: '04',
        membershipType: MEMBERSHIP_TYPE.JOINT_SECRETARY,
        status: MEMBER_STATUS.ACTIVE,
      });

    expect(updated.status, JSON.stringify(updated.body)).toBe(200);
    expect(updated.body.data.phone).toBe('9800000123');
    expect(updated.body.data.municipality).toBe('Dharan Municipality');
    expect(updated.body.data.ward).toBe('04');
    expect(updated.body.data.membershipType).toBe(MEMBERSHIP_TYPE.JOINT_SECRETARY);
  });

  it('never changes the member id or the district on an edit', async () => {
    const detail = await request(app)
      .get(`/api/members/${editableMemberId}`)
      .set(bearer(districtAdminAToken));
    const originalId = detail.body.data.memberId;

    const renamed = await request(app)
      .patch(`/api/members/${editableMemberId}`)
      .set(bearer(districtAdminAToken))
      .send({ memberId: 'HACKED-01' });
    expect(renamed.status, JSON.stringify(renamed.body)).toBe(200);

    const after = await request(app)
      .get(`/api/members/${editableMemberId}`)
      .set(bearer(districtAdminAToken));
    expect(after.body.data.memberId).toBe(originalId);

    // A district is not movable: the scope guard rejects the whole request.
    const moved = await request(app)
      .patch(`/api/members/${editableMemberId}`)
      .set(bearer(districtAdminAToken))
      .send({ district: districtB });
    expect(moved.status).toBe(403);
    expect(after.body.data.district._id).toBe(districtA);
  });

  it('deletes a member that holds nothing', async () => {
    const removed = await request(app)
      .delete(`/api/members/${plainMemberId}`)
      .set(bearer(districtAdminAToken));
    expect(removed.status, JSON.stringify(removed.body)).toBe(200);

    const gone = await request(app)
      .get(`/api/members/${plainMemberId}`)
      .set(bearer(districtAdminAToken));
    expect(gone.status).toBe(404);
  });

  it('refuses to delete a member that still has a login account', async () => {
    await createUser({
      email: 'member.with.login@hps.test',
      role: ROLE_NAMES.MEMBER,
      district: districtA,
      member: editableMemberId,
    });

    const blocked = await request(app)
      .delete(`/api/members/${editableMemberId}`)
      .set(bearer(districtAdminAToken));
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toContain('login account');

    const stillThere = await request(app)
      .get(`/api/members/${editableMemberId}`)
      .set(bearer(districtAdminAToken));
    expect(stillThere.status).toBe(200);
  });

  it('refuses to delete a member that still holds a committee position', async () => {
    const seated = await createMember({
      district: districtA,
      unit: unitA1,
      firstName: 'Bishal',
      lastName: 'Khadka',
    });

    const assigned = await request(app)
      .post(`/api/committees/${committeeId}/positions`)
      .set(bearer(districtAdminAToken))
      .send({ position: COMMITTEE_POSITION.SECRETARY, member: seated.id });
    expect(assigned.status, JSON.stringify(assigned.body)).toBe(200);

    const blocked = await request(app)
      .delete(`/api/members/${seated.id}`)
      .set(bearer(districtAdminAToken));
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toContain('committee position');

    // Clearing the seat releases the member for deletion.
    const committee = await request(app)
      .get(`/api/committees/${committeeId}`)
      .set(bearer(districtAdminAToken));
    const positionId = String(
      committee.body.data.positions.find(
        (position: { member: { _id: string } }) => position.member._id === seated.id,
      )._id,
    );
    const cleared = await request(app)
      .delete(`/api/committees/${committeeId}/positions/${positionId}`)
      .set(bearer(districtAdminAToken));
    expect(cleared.status).toBe(200);

    const removed = await request(app)
      .delete(`/api/members/${seated.id}`)
      .set(bearer(districtAdminAToken));
    expect(removed.status).toBe(200);

    const gone = await request(app)
      .get(`/api/members/${seated.id}`)
      .set(bearer(districtAdminAToken));
    expect(gone.status).toBe(404);
  });

  it('keeps the member protected while the login account exists', async () => {
    const blocked = await request(app)
      .delete(`/api/members/${editableMemberId}`)
      .set(bearer(districtAdminAToken));
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toContain('login account');
  });

  it('keeps every other district out', async () => {
    const outsider = await createMember({
      district: districtB,
      firstName: 'Outside',
      lastName: 'District',
    });

    const read = await request(app)
      .get(`/api/members/${outsider.id}`)
      .set(bearer(districtAdminAToken));
    expect(read.status).toBe(404);

    const edit = await request(app)
      .patch(`/api/members/${outsider.id}`)
      .set(bearer(districtAdminAToken))
      .send({ phone: '9800000999' });
    expect(edit.status).toBe(404);

    const remove = await request(app)
      .delete(`/api/members/${outsider.id}`)
      .set(bearer(districtAdminAToken));
    expect(remove.status).toBe(404);

    const createInside = await request(app)
      .post('/api/members')
      .set(bearer(districtAdminAToken))
      .send({
        firstName: 'Stranger',
        lastName: 'Member',
        phone: '9800000777',
        district: districtB,
      });
    expect(createInside.status).toBe(403);

    const ownList = await request(app).get('/api/members').set(bearer(districtAdminAToken));
    expect(ownList.status).toBe(200);
    expect(
      ownList.body.data.some((member: { _id: string }) => member._id === outsider.id),
    ).toBe(false);
  });

  it('keeps district committee members read only', async () => {
    const edit = await request(app)
      .patch(`/api/members/${editableMemberId}`)
      .set(bearer(committeeMemberToken))
      .send({ phone: '9800000000' });
    expect(edit.status).toBe(403);

    const remove = await request(app)
      .delete(`/api/members/${editableMemberId}`)
      .set(bearer(committeeMemberToken));
    expect(remove.status).toBe(403);

    const list = await request(app).get('/api/members').set(bearer(committeeMemberToken));
    expect(list.status).toBe(200);
  });
});