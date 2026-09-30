import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { PERMISSIONS } from '../src/constants/permissions';
import { ROLE_NAMES } from '../src/constants/roles';
import { EVENT_LEVEL, EVENT_STATUS, EVENT_TYPE, TARGET_TYPE } from '../src/constants/enums';
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

const tomorrow = (): string => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

/**
 * Events and announcements are a district administrator capability: they run the
 * calendar and the notices of their own district at every level, nothing outside
 * that district is reachable, and a level change drops the parents it can no
 * longer use.
 */
describe('Events and announcements by district administrators', () => {
  let districtA: string;
  let districtB: string;
  let unitA1: string;
  let communityA1: string;
  let foreignUnitId: string;
  let districtAdminAToken: string;
  let districtAdminBToken: string;
  let committeeMemberToken: string;
  let portalMemberToken: string;
  let eventId = '';
  let announcementId = '';

  beforeAll(async () => {
    await seedFoundation();
    districtA = (await createDistrict('Sunsari', 'SUN')).id;
    districtB = (await createDistrict('Jhapa', 'JHA')).id;
    unitA1 = await createUnit(districtA, 'Itahari Unit', 'SUN-IT');
    communityA1 = await createCommunity(districtA, 'SUN-C1', unitA1);
    foreignUnitId = await createUnit(districtB, 'Damak Unit', 'JHA-DM');

    await createUser({ email: 'super.events@hps.test', role: ROLE_NAMES.SUPER_ADMIN });
    await createUser({
      email: 'dadmin.events.a@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtA,
    });
    await createUser({
      email: 'dadmin.events.b@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtB,
    });
    await createUser({
      email: 'cmember.events.a@hps.test',
      role: ROLE_NAMES.DISTRICT_COMMITTEE_MEMBER,
      district: districtA,
    });
    await createUser({
      email: 'portal.member.events@hps.test',
      role: ROLE_NAMES.MEMBER,
      district: districtA,
    });

    districtAdminAToken = await login('dadmin.events.a@hps.test');
    districtAdminBToken = await login('dadmin.events.b@hps.test');
    committeeMemberToken = await login('cmember.events.a@hps.test');
    portalMemberToken = await login('portal.member.events@hps.test');
  });

  it('creates a district event inside the caller district', async () => {
    const response = await request(app)
      .post('/api/events')
      .set(bearer(districtAdminAToken))
      .send({
        title: 'District monthly meeting',
        type: EVENT_TYPE.MEETING,
        level: EVENT_LEVEL.DISTRICT,
        location: 'Itahari hall',
        startDate: tomorrow(),
        startTime: '10:00',
        status: EVENT_STATUS.SCHEDULED,
      });

    expect(response.status, JSON.stringify(response.body)).toBe(201);
    eventId = String(response.body.data._id);
    expect(idOf(response.body.data.district)).toBe(districtA);
    expect(response.body.data.level).toBe(EVENT_LEVEL.DISTRICT);
    expect(response.body.data.startTime).toBe('10:00');
  });

  it('refuses an event whose level is missing its parent', async () => {
    const noUnit = await request(app)
      .post('/api/events')
      .set(bearer(districtAdminAToken))
      .send({ title: 'Unit event without unit', level: EVENT_LEVEL.UNIT, startDate: tomorrow() });
    expect(noUnit.status).toBe(400);
    expect(noUnit.body.message).toContain('unit is required');

    const foreignUnit = await request(app)
      .post('/api/events')
      .set(bearer(districtAdminAToken))
      .send({
        title: 'Event on a foreign unit',
        level: EVENT_LEVEL.UNIT,
        unit: foreignUnitId,
        startDate: tomorrow(),
      });
    expect(foreignUnit.status).toBe(400);
    expect(foreignUnit.body.message).toContain('does not belong to this district');

    const noDate = await request(app)
      .post('/api/events')
      .set(bearer(districtAdminAToken))
      .send({ title: 'Event without a date', level: EVENT_LEVEL.DISTRICT });
    expect(noDate.status).toBe(422);
  });

  it('edits an event and drops the parent a new level cannot use', async () => {
    const unitEvent = await request(app)
      .post('/api/events')
      .set(bearer(districtAdminAToken))
      .send({
        title: 'Itahari unit meeting',
        level: EVENT_LEVEL.UNIT,
        unit: unitA1,
        startDate: tomorrow(),
      });
    expect(unitEvent.status, JSON.stringify(unitEvent.body)).toBe(201);

    const promoted = await request(app)
      .patch(`/api/events/${unitEvent.body.data._id}`)
      .set(bearer(districtAdminAToken))
      .send({ level: EVENT_LEVEL.DISTRICT, location: 'District hall' });
    expect(promoted.status, JSON.stringify(promoted.body)).toBe(200);
    expect(promoted.body.data.level).toBe(EVENT_LEVEL.DISTRICT);
    expect(promoted.body.data.location).toBe('District hall');
    expect(promoted.body.data.unit ?? null).toBeNull();
  });

  it('refuses to delete an event that already has attendance', async () => {
    const member = await createMember({
      district: districtA,
      unit: unitA1,
      firstName: 'Kalpana',
      lastName: 'Basnet',
    });
    const marked = await request(app)
      .post('/api/attendance')
      .set(bearer(districtAdminAToken))
      .send({ event: eventId, member: member.id, date: tomorrow(), status: 'PRESENT' });
    expect(marked.status, JSON.stringify(marked.body)).toBe(201);

    const blocked = await request(app)
      .delete(`/api/events/${eventId}`)
      .set(bearer(districtAdminAToken));
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toContain('attendance');
  });

  it('deletes an event without attendance', async () => {
    const spare = await request(app)
      .post('/api/events')
      .set(bearer(districtAdminAToken))
      .send({ title: 'Spare training session', level: EVENT_LEVEL.DISTRICT, startDate: tomorrow() });
    expect(spare.status).toBe(201);

    const removed = await request(app)
      .delete(`/api/events/${spare.body.data._id}`)
      .set(bearer(districtAdminAToken));
    expect(removed.status, JSON.stringify(removed.body)).toBe(200);

    const gone = await request(app)
      .get(`/api/events/${spare.body.data._id}`)
      .set(bearer(districtAdminAToken));
    expect(gone.status).toBe(404);
  });

  it('publishes an announcement to the district, a unit and a community', async () => {
    const district = await request(app)
      .post('/api/announcements')
      .set(bearer(districtAdminAToken))
      .send({
        title: 'District holiday notice',
        content: 'The district office stays closed next Monday.',
        targetType: TARGET_TYPE.DISTRICT,
        isPublic: true,
      });
    expect(district.status, JSON.stringify(district.body)).toBe(201);
    announcementId = String(district.body.data._id);
    expect(district.body.data.targetType).toBe(TARGET_TYPE.DISTRICT);

    const unit = await request(app)
      .post('/api/announcements')
      .set(bearer(districtAdminAToken))
      .send({
        title: 'Unit level water notice',
        content: 'Water supply is interrupted on Tuesday.',
        targetType: TARGET_TYPE.UNIT,
        unit: unitA1,
      });
    expect(unit.status, JSON.stringify(unit.body)).toBe(201);
    expect(idOf(unit.body.data.unit)).toBe(unitA1);

    const community = await request(app)
      .post('/api/announcements')
      .set(bearer(districtAdminAToken))
      .send({
        title: 'Community clean up day',
        content: 'Join the clean up drive this Saturday.',
        targetType: TARGET_TYPE.COMMUNITY,
        community: communityA1,
      });
    expect(community.status, JSON.stringify(community.body)).toBe(201);
  });

  it('refuses an announcement whose audience is missing or foreign', async () => {
    const noUnit = await request(app)
      .post('/api/announcements')
      .set(bearer(districtAdminAToken))
      .send({ title: 'Unit notice without unit', content: 'Text', targetType: TARGET_TYPE.UNIT });
    expect(noUnit.status).toBe(400);
    expect(noUnit.body.message).toContain('unit is required');

    const foreignUnit = await request(app)
      .post('/api/announcements')
      .set(bearer(districtAdminAToken))
      .send({
        title: 'Notice on a foreign unit',
        content: 'Text',
        targetType: TARGET_TYPE.UNIT,
        unit: foreignUnitId,
      });
    expect(foreignUnit.status).toBe(400);
    expect(foreignUnit.body.message).toContain('does not belong to this district');
  });

  it('edits an announcement and keeps its audience valid', async () => {
    const withoutAudience = await request(app)
      .patch(`/api/announcements/${announcementId}`)
      .set(bearer(districtAdminAToken))
      .send({ targetType: TARGET_TYPE.UNIT });
    expect(withoutAudience.status).toBe(400);
    expect(withoutAudience.body.message).toContain('unit is required');

    const retargeted = await request(app)
      .patch(`/api/announcements/${announcementId}`)
      .set(bearer(districtAdminAToken))
      .send({ title: 'District holiday notice (updated)', isPublic: false });
    expect(retargeted.status, JSON.stringify(retargeted.body)).toBe(200);
    expect(retargeted.body.data.title).toBe('District holiday notice (updated)');
    expect(retargeted.body.data.isPublic).toBe(false);
  });

  it('never lets a district administrator manage roles or permissions', async () => {
    const me = await request(app).get('/api/auth/me').set(bearer(districtAdminAToken));
    const myPermissions = (me.body.data.permissions ?? []) as string[];
    expect(myPermissions, JSON.stringify(me.body.data)).not.toContain(PERMISSIONS.ROLE_MANAGE);
    expect(myPermissions).not.toContain(PERMISSIONS.PERMISSION_MANAGE);

    const roles = await request(app).get('/api/administrators/roles').set(bearer(districtAdminAToken));
    expect(roles.status).toBe(200);

    const target = (roles.body.data as Array<{ _id: string; name: string }>).find(
      (role) => role.name === ROLE_NAMES.UNIT_COMMITTEE_MEMBER,
    );
    expect(target).toBeTruthy();

    const edit = await request(app)
      .patch(`/api/administrators/roles/${target?._id}/permissions`)
      .set(bearer(districtAdminAToken))
      .send({ permissions: ['portal.access', 'committee.view'] });
    expect(edit.status).toBe(403);

    const catalog = await request(app)
      .get('/api/administrators/roles/catalog')
      .set(bearer(districtAdminAToken));
    expect(catalog.status).toBe(403);
  });

  it('keeps both modules inside the district and away from read only roles', async () => {
    const readEvent = await request(app)
      .get(`/api/events/${eventId}`)
      .set(bearer(districtAdminBToken));
    expect(readEvent.status).toBe(404);

    const readAnnouncement = await request(app)
      .get(`/api/announcements/${announcementId}`)
      .set(bearer(districtAdminBToken));
    expect(readAnnouncement.status).toBe(404);

    // District committee members are content authors inside their district, but
    // a plain member account never reaches the administrative module.
    const memberEvent = await request(app)
      .post('/api/events')
      .set(bearer(portalMemberToken))
      .send({ title: 'Member event', level: EVENT_LEVEL.DISTRICT, startDate: tomorrow() });
    expect(memberEvent.status).toBe(403);

    const memberAnnouncement = await request(app)
      .post('/api/announcements')
      .set(bearer(portalMemberToken))
      .send({ title: 'Member notice', content: 'Text' });
    expect(memberAnnouncement.status).toBe(403);

    const committeeEvent = await request(app)
      .post('/api/events')
      .set(bearer(committeeMemberToken))
      .send({ title: 'Committee authored event', level: EVENT_LEVEL.DISTRICT, startDate: tomorrow() });
    expect(committeeEvent.status).toBe(201);
    expect(idOf(committeeEvent.body.data.district)).toBe(districtA);

    const listEvents = await request(app).get('/api/events').set(bearer(committeeMemberToken));
    expect(listEvents.status).toBe(200);
    const listAnnouncements = await request(app)
      .get('/api/announcements')
      .set(bearer(committeeMemberToken));
    expect(listAnnouncements.status).toBe(200);
  });
});