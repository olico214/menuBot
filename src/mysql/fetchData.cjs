const pool = require("./config.cjs");
const id = 1
async function getMenu() {
    const connection = await pool.getConnection();
    try {
        const sql = `SELECT * FROM menubot WHERE id_user = ?`;
        const [result, fields] = await connection.query(sql, [id]);
        
        const sql2 = `SELECT * FROM menu_option WHERE idMenu = ?`;
        const [result2, fields2] = await connection.query(sql2, [result[0].id]);

        const data = {
            'mensaje_init': result[0],
            'menu': result2,
            
        }


        return data;
    } catch (err) {
        console.log(err);
    } finally {
        connection.release();
    }
}

  module.exports = { getMenu };