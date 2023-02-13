const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
    test("works with data", function () {
        const dataToUpdate = {firstName: 'A', age: 30};
        const jsToSql = {firstName: 'B', age: 32};
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(result).toEqual(
            {
                setCols: "\"B\"=$1, \"32\"=$2",
                values: ["A", 30,],
            }
        );
    });

    test("fails without data", async function () {
        const dataToUpdate = {};
        const jsToSql = {};
    try {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

});