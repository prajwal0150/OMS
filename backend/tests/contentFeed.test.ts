import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { CONTENT_STATUS, CONTENT_TYPE, DOCUMENT_CATEGORY, VISIBILITY } from '../src/constants/enums';
import { ROLE_NAMES } from '../src/constants/roles';
import { DocumentFileModel } from '../src/modules/documents/document.model';
import {
  app,
  bearer,
  createDistrict,
  createUnit,
  createUser,
  login,
  seedFoundation,
} from './helpers';

const uploadDocumentFixture = async (district: string, title: string, key: string) =>
  String(
    (
      await DocumentFileModel.create({
        title,
        file: {
          url: `/uploads/${key}`,
          key,
          name: key,
          type: 'application/pdf',
          size: 2048,
          storageProvider: 'local',
        },
        category: DOCUMENT_CATEGORY.REPORTS,
        district,
        visibility: VISIBILITY.DISTRICT_ONLY,
        date: new Date(),
        tags: [],
      })
    )._id,
  );

/**
 * The content feed is the single surface for posts, media and documents. A post
 * is text plus gallery plus attached documents, every one of them scoped to the
 * caller's district: a district administrator composes and deletes their own
 * posts and never reaches another district's.
 */
describe('Content feed by district administrators', () => {
  let districtA: string;
  let districtB: string;
  let unitA1: string;
  let foreignUnitId: string;
  let superToken: string;
  let districtAdminAToken: string;
  let districtAdminBToken: string;
  let ownDocumentId = '';
  let foreignDocumentId = '';
  let postId = '';

  beforeAll(async () => {
    await seedFoundation();
    districtA = (await createDistrict('Sunsari', 'SUN')).id;
    districtB = (await createDistrict('Jhapa', 'JHA')).id;
    unitA1 = await createUnit(districtA, 'Itahari Unit', 'SUN-IT');
    foreignUnitId = await createUnit(districtB, 'Damak Unit', 'JHA-DM');

    await createUser({ email: 'super.feed@hps.test', role: ROLE_NAMES.SUPER_ADMIN });
    await createUser({
      email: 'dadmin.feed.a@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtA,
    });
    await createUser({
      email: 'dadmin.feed.b@hps.test',
      role: ROLE_NAMES.DISTRICT_ADMIN,
      district: districtB,
    });

    superToken = await login('super.feed@hps.test');
    districtAdminAToken = await login('dadmin.feed.a@hps.test');
    districtAdminBToken = await login('dadmin.feed.b@hps.test');

    ownDocumentId = await uploadDocumentFixture(districtA, 'District calendar', 'calendar.pdf');
    foreignDocumentId = await uploadDocumentFixture(
      districtB,
      'Other district file',
      'other.pdf',
    );
  });

  it('composes a post with text, photos and an attached document', async () => {
    const response = await request(app)
      .post('/api/content')
      .set(bearer(districtAdminAToken))
      .send({
        title: 'District health camp',
        content: 'A free health camp runs at the district hall this Saturday.',
        contentType: CONTENT_TYPE.NEWS,
        visibility: VISIBILITY.DISTRICT_ONLY,
        gallery: [{ url: '/uploads/camp.jpg', order: 0, isCover: true }],
        documents: [ownDocumentId],
      });

    expect(response.status, JSON.stringify(response.body)).toBe(201);
    postId = String(response.body.data._id);
    expect(response.body.data.status).toBe(CONTENT_STATUS.DRAFT);
    expect(response.body.data.gallery).toHaveLength(1);
    expect(response.body.data.gallery[0].url).toBe('/uploads/camp.jpg');
  });

  it('returns the attached document with the post so the feed needs no extra call', async () => {
    const list = await request(app).get('/api/content').set(bearer(districtAdminAToken));
    expect(list.status).toBe(200);

    const item = (list.body.data as Array<{ _id: string; documents: unknown[] }>).find(
      (row) => row._id === postId,
    );
    expect(item).toBeTruthy();
    expect(item?.documents).toHaveLength(1);
    expect(item?.documents[0]).toMatchObject({ title: 'District calendar' });
  });

  it('refuses a document or unit that belongs to another district', async () => {
    const foreignDocumentPost = await request(app)
      .post('/api/content')
      .set(bearer(districtAdminAToken))
      .send({
        title: 'Post with a foreign document',
        content: 'Should not be allowed.',
        documents: [foreignDocumentId],
      });
    expect(foreignDocumentPost.status).toBe(404);

    const foreignUnitPost = await request(app)
      .post('/api/content')
      .set(bearer(districtAdminAToken))
      .send({
        title: 'Post on a foreign unit',
        content: 'Should not be allowed.',
        unit: foreignUnitId,
      });
    expect(foreignUnitPost.status).toBe(400);
    expect(foreignUnitPost.body.message).toContain('does not belong to this district');
  });

  it('edits a post of its own district but never jumps the review queue', async () => {
    const updated = await request(app)
      .patch(`/api/content/${postId}`)
      .set(bearer(districtAdminAToken))
      .send({ content: 'The health camp moved to the school hall.', unit: unitA1 });

    expect(updated.status, JSON.stringify(updated.body)).toBe(200);
    expect(updated.body.data.content).toContain('school hall');
    // The status is not editable through the CRUD payload.
    expect(updated.body.data.status).toBe(CONTENT_STATUS.DRAFT);

    const attempt = await request(app)
      .patch(`/api/content/${postId}`)
      .set(bearer(districtAdminAToken))
      .send({ status: CONTENT_STATUS.PUBLISHED });
    expect(attempt.status).toBe(200);
    expect(attempt.body.data.status).toBe(CONTENT_STATUS.DRAFT);

    const submitted = await request(app)
      .post(`/api/content/${postId}/submit`)
      .set(bearer(districtAdminAToken))
      .send({});
    expect(submitted.status, JSON.stringify(submitted.body)).toBe(200);
    expect(submitted.body.data.status).toBe(CONTENT_STATUS.PENDING_REVIEW);
  });

  it('never lets a district administrator publish, only submit for review', async () => {
    // Publishing is a Super Admin decision; a district admin must not be able to
    // short-circuit the review queue even with a hand-crafted payload.
    const direct = await request(app)
      .post(`/api/content/${postId}/publish`)
      .set(bearer(districtAdminAToken))
      .send({});
    expect(direct.status).toBe(403);

    const afterAttempt = await request(app)
      .get(`/api/content/${postId}`)
      .set(bearer(districtAdminAToken));
    expect(afterAttempt.body.data.status).toBe(CONTENT_STATUS.PENDING_REVIEW);
  });

  it('walks a post through review before it can be published', async () => {
    // The post is already PENDING_REVIEW from the previous case.
    const approved = await request(app)
      .post(`/api/content/${postId}/approve`)
      .set(bearer(districtAdminAToken))
      .send({ notes: 'Looks good' });
    expect(approved.status, JSON.stringify(approved.body)).toBe(200);
    expect(approved.body.data.status).toBe(CONTENT_STATUS.APPROVED);

    // A district admin may approve but still may not publish.
    const districtPublish = await request(app)
      .post(`/api/content/${postId}/publish`)
      .set(bearer(districtAdminAToken))
      .send({});
    expect(districtPublish.status).toBe(403);

    const superPublish = await request(app)
      .post(`/api/content/${postId}/publish`)
      .set(bearer(superToken))
      .send({});
    expect(superPublish.status, JSON.stringify(superPublish.body)).toBe(200);
    expect(superPublish.body.data.status).toBe(CONTENT_STATUS.PUBLISHED);
  });

  it('keeps the feed of one district out of reach of the other', async () => {
    const read = await request(app).get(`/api/content/${postId}`).set(bearer(districtAdminBToken));
    expect(read.status).toBe(404);

    const edit = await request(app)
      .patch(`/api/content/${postId}`)
      .set(bearer(districtAdminBToken))
      .send({ content: 'Not my district' });
    expect(edit.status).toBe(404);

    const remove = await request(app)
      .delete(`/api/content/${postId}`)
      .set(bearer(districtAdminBToken));
    expect(remove.status).toBe(404);

    const list = await request(app).get('/api/content').set(bearer(districtAdminBToken));
    expect(list.status).toBe(200);
    expect(
      (list.body.data as Array<{ _id: string }>).some((row) => row._id === postId),
    ).toBe(false);
  });

  it('deletes a post of its own district', async () => {
    const removed = await request(app)
      .delete(`/api/content/${postId}`)
      .set(bearer(districtAdminAToken));
    expect(removed.status, JSON.stringify(removed.body)).toBe(200);

    const gone = await request(app).get(`/api/content/${postId}`).set(bearer(districtAdminAToken));
    expect(gone.status).toBe(404);
  });
});