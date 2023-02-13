"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** findAll */

describe("findAll", function () {

// Verify all jobs returned when no parameters are passed
  test("works: no filter", async function () {
    let jobs = await Job.findAll({title:"%undefined%"});
    expect(jobs).toEqual([
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
        company_handle: "c3"
      },
    ]);
  });

// Verify relevant jobs returned when title parameter is passed
  test("works: title filter", async function () {
    let jobs = await Job.findAll({title:"%ist%"});
      expect(jobs).toEqual([
      {
        id: 1,
        title: "Alchemist",
        salary: 10,
        equity: 0,
        company_handle: "c1"
      },
      {
        id: 3,
        title: "Chemist",
        salary: 1000,
        equity: 0,
        company_handle: "c3"
      }])
  });

// Verify relevant jobs returned when minSalary parameter is passed
  test("works: minSalary filter", async function () {
    let jobs = await Job.findAll({title:"%undefined%",minSalary:101});
      expect(jobs).toEqual([
      {
        id: 3,
        title: "Chemist",
        salary: 1000,
        equity: 0,
        company_handle: "c3"
      }])
  });

// Verify relevant jobs returned when hasEquity=true parameter is passed
  test("works: hasEquity(true) filter", async function () {
    let jobs = await Job.findAll({title:"%undefined%",hasEquity:"true"});
      expect(jobs).toEqual([
      {
        id: 2,
        title: "Baker",
        salary: 100,
        equity: 0.5,
        company_handle: "c2"
      }])
  });


// Verify relevant jobs returned when hasEquity=false parameter is passed
  test("works: hasEquity(false) filter", async function () {
    let jobs = await Job.findAll({title:"%undefined%",hasEquity:"false"});
      expect(jobs).toEqual([
      {
        id: 1,
        title: "Alchemist",
        salary: 10,
        equity: 0,
        company_handle: "c1"
      },
      {
        id: 3,
        title: "Chemist",
        salary: 1000,
        equity: 0,
        company_handle: "c3"
      }])
  });
});


// /************************************** get */

describe("get", function () {

// Gets correct job for job id
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
        id: 1,
        title: "Alchemist",
        salary: 10,
        equity: 0,
        company_handle: "c1"
      });
  });

// Throws error when passed nonexistent job id
  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "New Job",
        salary: 100,
        equity: 0.2,
        company_handle: "c3"
    };

// Adds a job when passed valid data
    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            id: job.id,
            title: "New Job",
            salary: 100,
            equity: 0.2,
            company_handle: "c3"
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle
            FROM jobs WHERE title = 'New Job'`);
        expect(result.rows).toEqual([
            {
                title: "New Job",
                salary: 100,
                equity: 0.2,
                company_handle: "c3"
            },
            ]);
          });

// Throws error when duplicate job posted  
    test("bad request with dupe", async function () {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
        });
    });

// /************************************** update */

describe("update", function () {
    const updateData = {
        title: "Corsair",
        salary: 2000,
        equity: 0,
    };

// Updates existing job when passed valid data  
  test("works", async function () {
    let job = await Job.update(3, updateData);
    expect(job).toEqual({
      id: 3,
        ...updateData,
      company_handle: 'c3'
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [3]);
      expect(result.rows).toEqual([
          {id: 3,
            title: "Corsair",
            salary: 2000,
            equity: 0,
            company_handle: "c3"
          }
      ]);
  });

// Updates existing job when passed nullable data
  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "Cobbler",
      salary: null,
      equity: null,
    };

    let job = await Job.update(3, updateDataSetNulls);
    expect(job).toEqual({
      id: 3,
        ...updateDataSetNulls,
      company_handle: 'c3'
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [3]);
    expect(result.rows).toEqual([{id: 3,
            title: "Cobbler",
            salary: null,
            equity: null,
            company_handle: "c3"
          }]);
  });

// Throws error when attempting to update nonexistent job
  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

// Throws error when attempting to update existing job with no data
  test("bad request with no data", async function () {
    try {
      await Job.update(3, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {

// Deletes existing job
    test("works", async function () {
        await Job.remove(3);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=$1", [3]);
        expect(res.rows.length).toEqual(0);
    });

// Throws error when attempting to delete nonexistent job
    test("not found if no such job", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
})

