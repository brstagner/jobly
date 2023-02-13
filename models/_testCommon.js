const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

async function commonBeforeAll () {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM applications CASCADE");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM jobs CASCADE");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies CASCADE");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");

// Add test companies
  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

// Add test jobs
  await db.query(`
    INSERT INTO jobs(id, title, salary, equity, company_handle)
    VALUES (1, 'Alchemist', 10, 0, 'c1'),
           (2, 'Baker', 100, 0.5, 'c2'),
           (3, 'Chemist', 1000, 0, 'c3')`);

// Add test users
  await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
      [
        await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
        await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
    ]);

// Add test job applications
  await db.query(`
    INSERT INTO applications(username, job_id)
    VALUES ('u1', 1),
           ('u1', 2),
           ('u2', 1)`);
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
};