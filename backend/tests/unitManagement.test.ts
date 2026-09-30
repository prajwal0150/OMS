import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
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
 * Unit administration is a district administrator capability: they create,
 * edit and delete the units of their own district, the unit stays invisible to
 * every other district, and unit administrators keep read-only access.
 */
describe('Unit management by district administrators', () => {
  let districtA: string;
  let districtB: string;
  let unitA1: string;
  let districtAdminAToken: string;
  let districtAdminBToken: string;
  let unitAdminToken: string;
  let createdUnitId = '';

  beforeAll(async () => {
    await seedFoundation();
    districtA = (await createDistrict('Sunsari', 'SUN')).id;
    districtB = (await createDistrict('Jhapa', 'JHA')).id;
    unitA1 = await createUnit(districtA, 'Inchorwa Unit', 'SUN-IN');

    await createUser({ email: 'super.units@hps.test', role: ROLE_NAMES.SUPER_ADMIN });
    await createUser({
      email: 'dadmin.units.a@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtA,
    });
    await createUser({
      email: 'dadmin.units.b@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtB,
    });
    await createUser({
      email: 'uadmin.units.a@hps.test',
      role: ROLE_NAMES.UNIT_ADMIN,
      district: districtA,
      unit: unitA1,
    });

    districtAdminAToken = await login('dadmin.units.a@hps.test');
    districtAdminBToken = await login('dadmin.units.b@hps.test');
    unitAdminToken = await login('uadmin.units.a@hps.test');
  });

  it('creates a unit inside its own district', async () => {
    const response = await request(app)
      .post('/api/units')
      .set(bearer(districtAdminAToken))
      .send({
        name: 'Kankai Unit',
        code: 'SUN-KA',
        location: 'Belka',
        contactPerson: 'District Admin',
        phone: '9800000002',
      });

    expect(response.status).toBe(201);
    createdUnitId = String(response.body.data._id);
    expect(idOf(response.body.data.district)).toBe(districtA);
    expect(response.body.data.code).toBe('SUN-KA');
    expect(response.body.data.location).toBe('Belka');
  });

  it('edits a unit of its own district', async () => {
    const updated = await request(app)
      .patch(`/api/units/${unitA1}`)
      .set(bearer(districtAdminAToken))
      .send({ name: 'Inchorwa Unit', location: 'Inchorwa', contactPerson: 'Sunita Rai' });

    expect(updated.status).toBe(200);
    expect(updated.body.data.location).toBe('Inchorwa');
    expect(updated.body.data.contactPerson).toBe('Sunita Rai');

    const detail = await request(app).get(`/api/units/${unitA1}`).set(bearer(districtAdminAToken));
    expect(detail.status).toBe(200);
    expect(detail.body.data.location).toBe('Inchorwa');
  });

  it('keeps every other district out', async () => {
    const read = await request(app).get(`/api/units/${unitA1}`).set(bearer(districtAdminBToken));
    expect(read.status).toBe(404);

    const edit = await request(app)
      .patch(`/api/units/${unitA1}`)
      .set(bearer(districtAdminBToken))
      .send({ location: 'Not my district' });
    expect(edit.status).toBe(404);

    const remove = await request(app)
      .delete(`/api/units/${unitA1}`)
      .set(bearer(districtAdminBToken));
    expect(remove.status).toBe(404);

    const createInside = await request(app)
      .post('/api/units')
      .set(bearer(districtAdminBToken))
      .send({ name: 'Stranger unit', code: 'SUN-ST', district: districtA });
    expect(createInside.status).toBe(403);

    const stillThere = await request(app).get(`/api/units/${unitA1}`).set(bearer(districtAdminAToken));
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.data.location).toBe('Inchorwa');
  });

  it('refuses to delete a unit that still has members', async () => {
    await createMember({ district: districtA, unit: unitA1, firstName: 'Anita', lastName: 'Limbu' });

    const blocked = await request(app)
      .delete(`/api/units/${unitA1}`)
      .set(bearer(districtAdminAToken));
    expect(blocked.status).toBe(409);

    const detail = await request(app).get(`/api/units/${unitA1}`).set(bearer(districtAdminAToken));
    expect(detail.status).toBe(200);
  });

  it('deletes an empty unit', async () => {
    expect(createdUnitId).not.toBe('');

    const removed = await request(app)
      .delete(`/api/units/${createdUnitId}`)
      .set(bearer(districtAdminAToken));
    expect(removed.status).toBe(200);

    const detail = await request(app)
      .get(`/api/units/${createdUnitId}`)
      .set(bearer(districtAdminAToken));
    expect(detail.status).toBe(404);
  });

  it('keeps unit administrators read only on units', async () => {
    const create = await request(app)
      .post('/api/units')
      .set(bearer(unitAdminToken))
      .send({ name: 'Unit admin unit', code: 'SUN-UA' });
    expect(create.status).toBe(403);

    const remove = await request(app)
      .delete(`/api/units/${unitA1}`)
      .set(bearer(unitAdminToken));
    expect(remove.status).toBe(403);

    const list = await request(app).get('/api/units').set(bearer(unitAdminToken));
    expect(list.status).toBe(200);
  });
});
