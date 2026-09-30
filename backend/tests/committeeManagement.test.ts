import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { COMMITTEE_LEVEL, COMMITTEE_POSITION, RECORD_STATUS } from '../src/constants/enums';
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

/** Reads the identifier whether a reference is populated or a raw value. */
const idOf = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    const nested = (value as { _id?: unknown })._id;
    return nested ? String(nested) : '';
  }
  return String(value);
};

/**
 * Committee administration is a district administrator capability: they create,
 * edit and delete the committees of their own district at every level, each
 * committee stays invisible to every other district, a committee may never point
 * outside its district, and read-only roles keep the list without write access.
 */
describe('Committee management by district administrators', () => {
  let districtA: string;
  let districtB: string;
  let unitA1: string;
  let communityA1: string;
  let unitB1: string;
  let districtAdminAToken: string;
  let districtAdminBToken: string;
  let committeeMemberToken: string;
  let districtCommitteeId = '';
  let unitCommitteeId = '';
  let communityCommitteeId = '';

  beforeAll(async () => {
    await seedFoundation();
    districtA = (await createDistrict('Sunsari', 'SUN')).id;
    districtB = (await createDistrict('Jhapa', 'JHA')).id;
    unitA1 = await createUnit(districtA, 'Inchorwa Unit', 'SUN-IN');
    communityA1 = await createCommunity(districtA, 'SUN-C1', unitA1);
    unitB1 = await createUnit(districtB, 'Damak Unit', 'JHA-DM');

    await createUser({ email: 'super.committees@hps.test', role: ROLE_NAMES.SUPER_ADMIN });
    await createUser({
      email: 'dadmin.commit.a@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtA,
    });
    await createUser({
      email: 'dadmin.commit.b@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtB,
    });
    await createUser({
      email: 'cmember.commit.a@hps.test',
      role: ROLE_NAMES.DISTRICT_COMMITTEE_MEMBER,
      district: districtA,
    });

    districtAdminAToken = await login('dadmin.commit.a@hps.test');
    districtAdminBToken = await login('dadmin.commit.b@hps.test');
    committeeMemberToken = await login('cmember.commit.a@hps.test');
  });

  it('creates a district committee inside its own district', async () => {
    const response = await request(app)
      .post('/api/committees')
      .set(bearer(districtAdminAToken))
      .send({
        name: 'District Coordination Committee',
        level: COMMITTEE_LEVEL.DISTRICT,
        description: 'Runs the district programme.',
        status: RECORD_STATUS.ACTIVE,
      });

    expect(response.status, JSON.stringify(response.body)).toBe(201);
    districtCommitteeId = String(response.body.data._id);
    expect(idOf(response.body.data.district)).toBe(districtA);
    expect(response.body.data.level).toBe(COMMITTEE_LEVEL.DISTRICT);
    expect(response.body.data.description).toBe('Runs the district programme.');
  });

  it('creates unit and community level committees with their parent', async () => {
    const unitLevel = await request(app)
      .post('/api/committees')
      .set(bearer(districtAdminAToken))
      .send({ name: 'Inchorwa Unit Committee', level: COMMITTEE_LEVEL.UNIT, unit: unitA1 });
    expect(unitLevel.status, JSON.stringify(unitLevel.body)).toBe(201);
    unitCommitteeId = String(unitLevel.body.data._id);
    expect(idOf(unitLevel.body.data.unit)).toBe(unitA1);

    const communityLevel = await request(app)
      .post('/api/committees')
      .set(bearer(districtAdminAToken))
      .send({
        name: 'Community Welfare Committee',
        level: COMMITTEE_LEVEL.COMMUNITY,
        unit: unitA1,
        community: communityA1,
      });
    expect(communityLevel.status, JSON.stringify(communityLevel.body)).toBe(201);
    communityCommitteeId = String(communityLevel.body.data._id);
    expect(idOf(communityLevel.body.data.community)).toBe(communityA1);
  });

  it('rejects a committee that misses the parent its level requires', async () => {
    const noUnit = await request(app)
      .post('/api/committees')
      .set(bearer(districtAdminAToken))
      .send({ name: 'Unit committee without unit', level: COMMITTEE_LEVEL.UNIT });
    expect(noUnit.status).toBe(400);
    expect(noUnit.body.message).toContain('unit is required');

    const noCommunity = await request(app)
      .post('/api/committees')
      .set(bearer(districtAdminAToken))
      .send({ name: 'Community committee no community', level: COMMITTEE_LEVEL.COMMUNITY });
    expect(noCommunity.status).toBe(400);
    expect(noCommunity.body.message).toContain('community is required');

    const shortName = await request(app)
      .post('/api/committees')
      .set(bearer(districtAdminAToken))
      .send({ name: 'AB', level: COMMITTEE_LEVEL.DISTRICT });
    expect(shortName.status).toBe(422);
  });

  it('refuses a unit that belongs to another district', async () => {
    const foreignUnit = await request(app)
      .post('/api/committees')
      .set(bearer(districtAdminAToken))
      .send({ name: 'Foreign unit committee', level: COMMITTEE_LEVEL.UNIT, unit: unitB1 });
    expect(foreignUnit.status).toBe(400);
    expect(foreignUnit.body.message).toContain('does not belong to this district');
  });

  it('edits a committee of its own district', async () => {
    const updated = await request(app)
      .patch(`/api/committees/${unitCommitteeId}`)
      .set(bearer(districtAdminAToken))
      .send({ description: 'Rebuilt every quarter.', status: RECORD_STATUS.INACTIVE });

    expect(updated.status, JSON.stringify(updated.body)).toBe(200);
    expect(updated.body.data.description).toBe('Rebuilt every quarter.');
    expect(updated.body.data.status).toBe(RECORD_STATUS.INACTIVE);

    const detail = await request(app)
      .get(`/api/committees/${unitCommitteeId}`)
      .set(bearer(districtAdminAToken));
    expect(detail.status).toBe(200);
    expect(detail.body.data.status).toBe(RECORD_STATUS.INACTIVE);
  });

  it('clears the parents a new level can no longer use', async () => {
    const changed = await request(app)
      .patch(`/api/committees/${communityCommitteeId}`)
      .set(bearer(districtAdminAToken))
      .send({ level: COMMITTEE_LEVEL.DISTRICT });

    expect(changed.status, JSON.stringify(changed.body)).toBe(200);
    expect(changed.body.data.level).toBe(COMMITTEE_LEVEL.DISTRICT);
    expect(changed.body.data.unit ?? null).toBeNull();
    expect(changed.body.data.community ?? null).toBeNull();
  });

  it('keeps every other district out', async () => {
    const read = await request(app)
      .get(`/api/committees/${districtCommitteeId}`)
      .set(bearer(districtAdminBToken));
    expect(read.status).toBe(404);

    const edit = await request(app)
      .patch(`/api/committees/${districtCommitteeId}`)
      .set(bearer(districtAdminBToken))
      .send({ description: 'Not my district' });
    expect(edit.status).toBe(404);

    const remove = await request(app)
      .delete(`/api/committees/${districtCommitteeId}`)
      .set(bearer(districtAdminBToken));
    expect(remove.status).toBe(404);

    const createInside = await request(app)
      .post('/api/committees')
      .set(bearer(districtAdminBToken))
      .send({ name: 'Stranger committee', level: COMMITTEE_LEVEL.DISTRICT, district: districtA });
    expect(createInside.status).toBe(403);

    const emptyList = await request(app).get('/api/committees').set(bearer(districtAdminBToken));
    expect(emptyList.status).toBe(200);
    expect(emptyList.body.data).toHaveLength(0);

    const ownList = await request(app).get('/api/committees').set(bearer(districtAdminAToken));
    expect(ownList.body.data.length).toBeGreaterThan(0);
  });

  it('refuses to delete a committee that still has members in its positions', async () => {
    const member = await createMember({
      district: districtA,
      unit: unitA1,
      firstName: 'Kalpana',
      lastName: 'Basnet',
    });

    const assigned = await request(app)
      .post(`/api/committees/${districtCommitteeId}/positions`)
      .set(bearer(districtAdminAToken))
      .send({ position: COMMITTEE_POSITION.CHAIRPERSON, member: member.id });
    expect(assigned.status, JSON.stringify(assigned.body)).toBe(200);

    const blocked = await request(app)
      .delete(`/api/committees/${districtCommitteeId}`)
      .set(bearer(districtAdminAToken));
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toContain('positions');

    const stillThere = await request(app)
      .get(`/api/committees/${districtCommitteeId}`)
      .set(bearer(districtAdminAToken));
    expect(stillThere.status).toBe(200);
  });

  it('deletes a committee once its positions are cleared', async () => {
    const detail = await request(app)
      .get(`/api/committees/${districtCommitteeId}`)
      .set(bearer(districtAdminAToken));
    const positionId = String(detail.body.data.positions[0]._id);

    const cleared = await request(app)
      .delete(`/api/committees/${districtCommitteeId}/positions/${positionId}`)
      .set(bearer(districtAdminAToken));
    expect(cleared.status).toBe(200);

    const removed = await request(app)
      .delete(`/api/committees/${districtCommitteeId}`)
      .set(bearer(districtAdminAToken));
    expect(removed.status).toBe(200);

    const gone = await request(app)
      .get(`/api/committees/${districtCommitteeId}`)
      .set(bearer(districtAdminAToken));
    expect(gone.status).toBe(404);
  });

  it('deletes a committee that never held members', async () => {
    const removed = await request(app)
      .delete(`/api/committees/${communityCommitteeId}`)
      .set(bearer(districtAdminAToken));
    expect(removed.status).toBe(200);
  });

  it('keeps district committee members read only', async () => {
    const create = await request(app)
      .post('/api/committees')
      .set(bearer(committeeMemberToken))
      .send({ name: 'Read only committee', level: COMMITTEE_LEVEL.DISTRICT });
    expect(create.status).toBe(403);

    const edit = await request(app)
      .patch(`/api/committees/${unitCommitteeId}`)
      .set(bearer(committeeMemberToken))
      .send({ description: 'Not allowed' });
    expect(edit.status).toBe(403);

    const remove = await request(app)
      .delete(`/api/committees/${unitCommitteeId}`)
      .set(bearer(committeeMemberToken));
    expect(remove.status).toBe(403);

    const list = await request(app).get('/api/committees').set(bearer(committeeMemberToken));
    expect(list.status).toBe(200);
  });
});