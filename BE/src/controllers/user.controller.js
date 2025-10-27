const { poolPromise, sql } = require('../db');

const getProfile = async (req, res) => {
  try {
    const pool = await poolPromise;

    const userId = 1; 

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          UserID AS userId,
          FullName AS name,
          AboutMe AS aboutMe,
          PhoneNumber AS phoneNumber,
          Email AS email,
          Address AS address,
          MaSV AS maSV,
          GithubLink AS githubLink,
          FigmaLink AS figmaLink,
          PostmanLink AS postmanLink,
          PdfLink AS pdfLink
        FROM Users 
        WHERE UserID = @userId
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('SQL Server get profile error:', err);
    res.status(500).send(err.message);
  }
};

module.exports = { getProfile };