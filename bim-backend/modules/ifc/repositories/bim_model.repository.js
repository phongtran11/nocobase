const { fastify } = require('@cores/global');

class BimModelRepository {
  /**
   *
   * @param {*} source
   * @param {*} modelId
   * @param {*} status BIM_MODEL_STATUS
   * @returns
   */
  static async updateModelStatus(source, modelId, status) {
    const query = fastify.pg[source].query;
    const sql = `UPDATE bim_models SET status = $1 WHERE id = $2`;
    await query(sql, [status, modelId]);
  }
}

module.exports = { BimModelRepository };
