"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

// override parser to return numeric types as floats
const types = require('pg').types;
types.setTypeParser(1700, function(val) {
    return parseFloat(val);
});

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(
          `SELECT title
           FROM jobs
           WHERE title = $1`,
        [title]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate title: ${title}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
        [
          title, salary, equity, company_handle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Given a parameter object containing any combination of
   * {title, minSalary, hasEquity}
   * 
   * Returns [{ title, salary, equity, company_handle }, ...]
   * for jobs whose title contains title value,
   * and/or meets minSalary and/or hasEquity 
   * */

  static async findAll (params) {
    // define initially empty sections for SQL query
    let whereClause = '';
    let parameters = [];
    // cycle through all possible combinations of parameters
    // get relevant text/data for SQL query
      if (params.title != "%undefined%") {
          whereClause += `title ILIKE $1 `;
          parameters.push(params.title);
          if (params.minSalary) {
              whereClause += `AND salary >= $2 `;
              parameters.push(params.minSalary);
              if (params.hasEquity) {
                  if (params.hasEquity === 'true') {
                      whereClause += `AND equity > 0 `;
                  }
                  if (params.hasEquity === 'false') {
                      whereClause += `AND equity = 0 `;
                  }
              }
          }
          else {
              if (params.hasEquity) {
                  if (params.hasEquity === 'true') {
                      whereClause += `AND equity > 0 `;
                  };
                  if (params.hasEquity === 'false') {
                      whereClause += `AND equity = 0 `;
                  };
              }
          }
      }
    else {
      if (params.minSalary) {
        whereClause += `salary >= $1 `;
        parameters.push(params.minSalary);
        if (params.hasEquity) {
                  if (params.hasEquity === 'true') {
                      whereClause += `AND equity > 0 `;
                  };
                  if (params.hasEquity === 'false') {
                      whereClause += `AND equity = 0 `;
                  };
              }
      }
      else {
        if (params.hasEquity) {
                  if (params.hasEquity === 'true') {
                      whereClause += `equity > 0.0 `;
                  };
                  if (params.hasEquity === 'false') {
                      whereClause += `equity = 0.0 `;
                  };
              }
        else {
          // if no parameters passed
          const jobsRes = await db.query(
            `SELECT
                id,
                title,
                salary,
                equity,
                company_handle
            FROM jobs`
          );
          return jobsRes.rows;
        }
      }
    }
    // query on only passed parameters
    const jobsRes = await db.query(
        `SELECT
            id,
            title,
            salary,
            equity,
            company_handle
            FROM jobs
        WHERE
            ${whereClause}
        ORDER BY id`, parameters
    );
    return jobsRes.rows;
  };

  /** Given a job title, return data about job.
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
        `SELECT
            id,
            title,
            salary,
            equity,
            company_handle
        FROM jobs
        WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job ID: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
            title: "title",
            salary: "salary",
            equity: "equity"
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job ID: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job ID: ${id}`);
  }
}


module.exports = Job;