const pool = require("./config.cjs");

async function getDescription(id) {
    const connection = await pool.getConnection();
    try {

        const sql = `SELECT * FROM menu_option WHERE id = ?`;
        const [result, fields] = await connection.query(sql, [id]);

        const sql2 = `SELECT * FROM menuImage WHERE idoption = ?`;
        const [result2, fields2] = await connection.query(sql2, [result[0].id]);


        const data = {
            'option': result[0],
            'images': result2,
            
        }


        return data;
    } catch (err) {
        console.log(err);
    } finally {
        connection.release();
    }
}

  module.exports = { getDescription };