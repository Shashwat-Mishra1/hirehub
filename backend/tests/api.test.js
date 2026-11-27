process.env.NODE_ENV = 'test';
require('dotenv').config();

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Application = require('../src/models/Application');
const { removeFile } = require('../src/middlewares/upload');

jest.setTimeout(30000);

const PASSWORD = 'Password123';
const api = () => request(app);
const auth = (token) => ({ Authorization: `Bearer ${token}` });
const register = (extra = {}) =>
  api().post('/api/v1/auth/register').send({ name: 'Test', email: 'x@test.com', password: PASSWORD, ...extra });
const loginToken = async (email) =>
  (await api().post('/api/v1/auth/login').send({ email, password: PASSWORD })).body.data.token;
const pdf = () => Buffer.from('%PDF-1.4 fake resume');

const jobBody = {
  title: 'MERN Developer',
  description: 'Build full-stack features.',
  company: 'TechNova',
  location: 'Pune',
  skills: ['react', 'node.js'],
};

let candT, recT, rec2T, adminT, jobId, appId;

beforeAll(async () => {
  const uri = process.env.MONGO_URI_TEST;
  const dbName = uri ? uri.split('?')[0].split('/').pop() : '';
  // safety: never run against the real database
  if (!dbName.toLowerCase().includes('test')) {
    throw new Error('Set MONGO_URI_TEST in .env to a database whose name contains "test"');
  }
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();

  await register({ email: 'cand@test.com' });
  await register({ email: 'rec@test.com', role: 'recruiter' });
  await register({ email: 'rec2@test.com', role: 'recruiter' });
  await User.create({ name: 'Admin', email: 'admin@test.com', password: PASSWORD, role: 'admin' });

  candT = await loginToken('cand@test.com');
  recT = await loginToken('rec@test.com');
  rec2T = await loginToken('rec2@test.com');
  adminT = await loginToken('admin@test.com');
});

afterAll(async () => {
  const files = await Application.find().distinct('resume');   // delete uploaded test files
  files.forEach(removeFile);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Auth', () => {
  test('duplicate email gives 409', async () => {
    expect((await register({ email: 'cand@test.com' })).status).toBe(409);
  });
  test('cannot register as admin', async () => {
    expect((await register({ email: 'h@test.com', role: 'admin' })).status).toBe(400);
  });
  test('weak password gives 400', async () => {
    expect((await register({ email: 'w@test.com', password: 'abc' })).status).toBe(400);
  });
  test('wrong password gives 401', async () => {
    const res = await api().post('/api/v1/auth/login').send({ email: 'cand@test.com', password: 'Wrong123' });
    expect(res.status).toBe(401);
  });
  test('/me without token gives 401, with token gives 200', async () => {
    expect((await api().get('/api/v1/auth/me')).status).toBe(401);
    const res = await api().get('/api/v1/auth/me').set(auth(candT));
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('cand@test.com');
  });
  test('NoSQL injection in login is blocked', async () => {
    const res = await api().post('/api/v1/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });
  test('password is stored hashed', async () => {
    const user = await User.findOne({ email: 'cand@test.com' }).select('+password');
    expect(user.password).not.toBe(PASSWORD);
    expect(user.password.startsWith('$2')).toBe(true);
  });
});

describe('Jobs, roles and ownership', () => {
  test('candidate cannot create a job (403)', async () => {
    expect((await api().post('/api/v1/jobs').set(auth(candT)).send(jobBody)).status).toBe(403);
  });
  test('recruiter creates a job (201)', async () => {
    const res = await api().post('/api/v1/jobs').set(auth(recT)).send(jobBody);
    expect(res.status).toBe(201);
    jobId = res.body.data._id;
  });
  test('empty job form gives 400', async () => {
    expect((await api().post('/api/v1/jobs').set(auth(recT)).send({})).status).toBe(400);
  });
  test('public list works with search and pagination info', async () => {
    const all = await api().get('/api/v1/jobs');
    expect(all.status).toBe(200);
    expect(all.body.pagination.total).toBe(1);
    expect((await api().get('/api/v1/jobs?search=mern')).body.data).toHaveLength(1);
    expect((await api().get('/api/v1/jobs?search=zzzzz')).body.data).toHaveLength(0);
  });
  test('invalid job id gives 400', async () => {
    expect((await api().get('/api/v1/jobs/abc')).status).toBe(400);
  });
  test('another recruiter cannot edit (403), owner and admin can (200)', async () => {
    const url = `/api/v1/jobs/${jobId}`;
    expect((await api().put(url).set(auth(rec2T)).send({ title: 'Hacked' })).status).toBe(403);
    expect((await api().put(url).set(auth(recT)).send({ title: 'MERN Developer II' })).status).toBe(200);
    expect((await api().put(url).set(auth(adminT)).send({ location: 'Delhi' })).status).toBe(200);
  });
});

describe('Applications', () => {
  test('apply without a file gives 400', async () => {
    const res = await api().post(`/api/v1/jobs/${jobId}/apply`).set(auth(candT)).field('coverLetter', 'Hi');
    expect(res.status).toBe(400);
  });
  test('wrong file type gives 400', async () => {
    const res = await api().post(`/api/v1/jobs/${jobId}/apply`).set(auth(candT))
      .attach('resume', Buffer.from('hello'), 'notes.txt');
    expect(res.status).toBe(400);
  });
  test('recruiter cannot apply (403)', async () => {
    const res = await api().post(`/api/v1/jobs/${jobId}/apply`).set(auth(recT))
      .attach('resume', pdf(), 'resume.pdf');
    expect(res.status).toBe(403);
  });
  test('candidate applies with a PDF (201)', async () => {
    const res = await api().post(`/api/v1/jobs/${jobId}/apply`).set(auth(candT))
      .field('coverLetter', 'I am interested').attach('resume', pdf(), 'resume.pdf');
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('applied');
    appId = res.body.data._id;
  });
  test('applying twice gives 409', async () => {
    const res = await api().post(`/api/v1/jobs/${jobId}/apply`).set(auth(candT))
      .attach('resume', pdf(), 'resume.pdf');
    expect(res.status).toBe(409);
  });
  test('candidate sees own applications', async () => {
    const res = await api().get('/api/v1/applications/mine').set(auth(candT));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
  test('only the job owner sees applicants', async () => {
    const url = `/api/v1/jobs/${jobId}/applications`;
    expect((await api().get(url).set(auth(rec2T))).status).toBe(403);
    const res = await api().get(url).set(auth(recT));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
  test('status change: invalid 400, other recruiter 403, owner 200', async () => {
    const url = `/api/v1/applications/${appId}/status`;
    expect((await api().patch(url).set(auth(recT)).send({ status: 'hired' })).status).toBe(400);
    expect((await api().patch(url).set(auth(rec2T)).send({ status: 'shortlisted' })).status).toBe(403);
    const res = await api().patch(url).set(auth(recT)).send({ status: 'shortlisted' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('shortlisted');
  });
  test('resume download: owner and candidate 200, other recruiter 403', async () => {
    const url = `/api/v1/applications/${appId}/resume`;
    expect((await api().get(url).set(auth(recT))).status).toBe(200);
    expect((await api().get(url).set(auth(candT))).status).toBe(200);
    expect((await api().get(url).set(auth(rec2T))).status).toBe(403);
  });
});

describe('Dashboard', () => {
  test('requires login', async () => {
    expect((await api().get('/api/v1/dashboard/stats')).status).toBe(401);
  });
  test('candidate, recruiter and admin each get their own numbers', async () => {
    const c = await api().get('/api/v1/dashboard/stats').set(auth(candT));
    expect(c.body.data.totalApplications).toBe(1);
    const r = await api().get('/api/v1/dashboard/stats').set(auth(recT));
    expect(r.body.data.totalJobs).toBe(1);
    expect(r.body.data.totalApplications).toBe(1);
    const a = await api().get('/api/v1/dashboard/stats').set(auth(adminT));
    expect(a.body.data.totalUsers).toBe(4);
  });
});

describe('Withdraw and delete', () => {
  test('candidate withdraws, then the recruiter cannot change it', async () => {
    const del = await api().delete(`/api/v1/applications/${appId}`).set(auth(candT));
    expect(del.status).toBe(200);
    expect(del.body.data.status).toBe('withdrawn');
    const res = await api().patch(`/api/v1/applications/${appId}/status`).set(auth(recT)).send({ status: 'offered' });
    expect(res.status).toBe(400);
  });
  test('only the owner can delete a job', async () => {
    const url = `/api/v1/jobs/${jobId}`;
    expect((await api().delete(url).set(auth(rec2T))).status).toBe(403);
    expect((await api().delete(url).set(auth(recT))).status).toBe(200);
    expect((await api().get(url)).status).toBe(404);
  });
});