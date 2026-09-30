import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { ACCOUNT_STATUS } from '../src/constants/enums';
import { ROLE_NAMES } from '../src/constants/roles';
import {
  PASSWORD,
  SUPER_ADMIN_EMAIL,
  app,
  bearer,
  createUser,
  login,
  seedFoundation,
} from './helpers';

const signIn = (email: string, password: string) =>
  request(app).post('/api/auth/login').send({ email, password });

const MISMATCH_EMAIL = 'mismatch.password@hps.test';
const SUSPENDED_EMAIL = 'suspended.account@hps.test';
const ROTATION_EMAIL = 'rotation.account@hps.test';
const PASSWORD_CHANGE_EMAIL = 'password.change@hps.test';

describe('Authentication', () => {
  beforeAll(async () => {
    await seedFoundation();
    await createUser({
      email: SUPER_ADMIN_EMAIL,
      role: ROLE_NAMES.SUPER_ADMIN,
      firstName: 'Super',
      lastName: 'Admin',
    });
    await createUser({ email: MISMATCH_EMAIL, role: ROLE_NAMES.DISTRICT_ADMIN });
    await createUser({
      email: SUSPENDED_EMAIL,
      role: ROLE_NAMES.DISTRICT_ADMIN,
      status: ACCOUNT_STATUS.SUSPENDED,
    });
    await createUser({ email: ROTATION_EMAIL, role: ROLE_NAMES.UNIT_ADMIN });
    await createUser({ email: PASSWORD_CHANGE_EMAIL, role: ROLE_NAMES.MEMBER });
  });

  it('signs in a valid account without exposing credentials', async () => {
    const response = await signIn(SUPER_ADMIN_EMAIL, PASSWORD);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data.accessToken).toBe('string');
    expect(typeof response.body.data.refreshToken).toBe('string');
    expect(response.body.data.user.role).toBe(ROLE_NAMES.SUPER_ADMIN);
    expect(response.body.data.user.permissions).toContain('member.view');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('refreshTokens');

    const cookies = response.headers['set-cookie'] ?? [];
    expect(cookies.join(';')).toContain('hps_refresh_token');
  });

  it('rejects a wrong password and an unknown email with 401', async () => {
    const wrongPassword = await signIn(MISMATCH_EMAIL, 'WrongPass@2026');
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.message).toBe('Invalid email or password');

    const unknown = await signIn('nobody@hps.test', PASSWORD);
    expect(unknown.status).toBe(401);
    expect(unknown.body.success).toBe(false);
  });

  it('blocks sign in for a suspended account', async () => {
    const response = await signIn(SUSPENDED_EMAIL, PASSWORD);
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('suspended');
  });

  it('exposes no public registration endpoint', async () => {
    for (const path of ['/api/auth/register', '/api/auth/signup']) {
      const response = await request(app).post(path).send({ email: 'self@hps.test' });
      expect(response.status).toBe(404);
    }
  });

  it('requires a token for protected endpoints and returns the profile with one', async () => {
    const anonymous = await request(app).get('/api/auth/me');
    expect(anonymous.status).toBe(401);

    const token = await login(SUPER_ADMIN_EMAIL);
    const response = await request(app).get('/api/auth/me').set(bearer(token));
    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe(SUPER_ADMIN_EMAIL);
  });

  it('rotates the refresh token and invalidates the previous one', async () => {
    const first = await signIn(ROTATION_EMAIL, PASSWORD);
    const originalRefreshToken = first.body.data.refreshToken as string;

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: originalRefreshToken });
    expect(refreshed.status).toBe(200);
    expect(typeof refreshed.body.data.accessToken).toBe('string');
    expect(refreshed.body.data.refreshToken).not.toBe(originalRefreshToken);

    const replay = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: originalRefreshToken });
    expect(replay.status).toBe(401);
  });

  it('changes the password only when the current one matches', async () => {
    const token = await login(PASSWORD_CHANGE_EMAIL);

    const wrongCurrent = await request(app)
      .post('/api/auth/change-password')
      .set(bearer(token))
      .send({ currentPassword: 'NotMyPassword@1', newPassword: 'Changed@2026' });
    expect(wrongCurrent.status).toBe(400);

    const weak = await request(app)
      .post('/api/auth/change-password')
      .set(bearer(token))
      .send({ currentPassword: PASSWORD, newPassword: 'weakpass' });
    expect(weak.status).toBe(422);

    const changed = await request(app)
      .post('/api/auth/change-password')
      .set(bearer(token))
      .send({ currentPassword: PASSWORD, newPassword: 'Changed@2026' });
    expect(changed.status).toBe(200);

    const relogin = await signIn(PASSWORD_CHANGE_EMAIL, 'Changed@2026');
    expect(relogin.status).toBe(200);
  });

  it('completes a password reset through the recovery flow', async () => {
    const requested = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: MISMATCH_EMAIL });
    expect(requested.status).toBe(200);
    const resetToken = requested.body.data.token as string | undefined;
    expect(resetToken).toBeTruthy();

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword: 'Recovered@2026' });
    expect(reset.status, JSON.stringify(reset.body)).toBe(200);

    const relogin = await signIn(MISMATCH_EMAIL, 'Recovered@2026');
    expect(relogin.status).toBe(200);
  });

  it('keeps the member portal closed to accounts without a member profile', async () => {
    const token = await login(SUPER_ADMIN_EMAIL);
    const response = await request(app).get('/api/members/me').set(bearer(token));
    expect(response.status).toBe(403);
  });
});
