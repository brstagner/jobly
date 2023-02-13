const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/** Takes a JSON object and converts to usable, parameterized SQL syntax */
function sqlForPartialUpdate (dataToUpdate, jsToSql) {
  // Get keys from JSON object
  const keys = Object.keys(dataToUpdate);
  // Length 0 indicates no data passed
  if (keys.length === 0) throw new BadRequestError("No data");

  // JSON key names should be SQL column names
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
