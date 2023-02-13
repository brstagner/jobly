"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// /************************************** GET /jobs */

describe("GET /jobs", function () {
// Allows non-users/admins to get info on all jobs
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
      {
        id: 1,
        title: "Alchemist",
        salary: 10,
        equity: 0,
        company_handle: "c1"
      },
      {
        id: 2,
        title: "Baker",
        salary: 100,
        equity: 0.5,
        company_handle: "c2"
      },
      {
        id: 3,
        title: "Chemist",
        salary: 1000,
        equity: 0,
        company_handle: "c2"
      },
    ]
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

// /************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
// Allows non-users/admins to get info on a job
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "Alchemist",
        salary: 10,
        equity: 0,
        company_handle: "c1"
      },
    });
  });
// Throws error if passed nonexistent job id
  test("no such job found", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
        title: "New Job",
        salary: 100,
        equity: 0.2,
        company_handle: "c3"
    };
// Allows admin to post a new job
  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    let job = await db.query(
        `SELECT id
        FROM jobs WHERE title = 'New Job'`);
    let id = job.rows[0].id;
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
        job: {
            id: id,
            title: "New Job",
            salary: 100,
            equity: 0.2,
            company_handle: "c3"
          }
      });
  });
// Throws error if new job post is missing non nullable data
  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "Despot"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
// Throws error if new job post is passed invalid data
  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: 404,
            salary: 'five dollars',
            equity: 'point oh five',
            company_handle: 404
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
// Allows admin to patch a job
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/3`)
        .send({
            title: "Corsair",
            salary: 2000,
            equity: 0
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
        job: {
            id: 3,
            title: "Corsair",
            salary: 2000,
            equity: 0,
            company_handle: "c2"
          },
    });
  });
// Throws error on patch attempt without admin authorization
  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/3`)
        .send({
            title: "Corsair",
            salary: 2000,
            equity: 0
        });
    expect(resp.statusCode).toEqual(401);
  });
// Throws error on attempt to patch nonexistent job
  test("no such job found", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
            title: "Zookeeper",
            salary: 2000,
            equity: 0
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
// Throws error on attempt to change job id
  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/3`)
        .send({
          id: 999,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
// Throws error if passed invalid job data
  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/3`)
        .send({
            title: 404,
            salary: 'five dollars',
            equity: 'point oh five',
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
// Allows admin to delete a job
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/3`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: '3' });
  });
// Throws error on attempt to delete a job wihout admin authorization
  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/3`);
    expect(resp.statusCode).toEqual(401);
  });
// Throws error on attempt to delete a nonexistent job
  test("no such job found", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
