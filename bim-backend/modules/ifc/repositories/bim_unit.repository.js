const { fastify } = require('@cores/global');

class BimUnitRepository {
  static async clearByModelId(modelId) {
    return await fastify.pg.transact(async (client) => {
      await client.query('delete from bim_units where modelId = $1', [modelId]);
    });
  }

  static async insertBatch(dataArray) {
    // Define a batch size
    const batchSize = 50;

    // Split the dataArray into batches
    const batches = [];
    for (let i = 0; i < dataArray.length; i += batchSize) {
      batches.push(dataArray.slice(i, i + batchSize));
    }

    return await fastify.pg.transact(async (client) => {
      const handlers = [];
      for (const batch of batches) {
        const values = [];
        const placeholders = [];

        batch.forEach((item, index) => {
          const {
            model_id,
            express_id,
            parent_express_id,
            name,
            ifc_type,
            description,
            object_type,
            properties,
            class_code,
            m_function,
          } = item;

          const startIndex = index * 10 + 1; // Adjust index for placeholders
          placeholders.push(`($${startIndex}, $${startIndex + 1}, $${startIndex + 2}, 
                              $${startIndex + 3}, $${startIndex + 4}, $${startIndex + 5}, 
                              $${startIndex + 6}, $${startIndex + 7}, $${startIndex + 8}, 
                              $${startIndex + 9})`);

          values.push(
            model_id,
            express_id,
            parent_express_id,
            name,
            ifc_type,
            description,
            object_type,
            properties,
            class_code,
            m_function,
          );
        });

        const sql = `
        INSERT INTO bim_units (
          modelId, expressId, parent_express_id, name, ifc_type, description,
          object_type, properties, class_code, m_function
        ) VALUES ${placeholders.join(', ')}`;

        handlers.push(client.query(sql, values));
      }
      await Promise.all(handlers);
    });
  }
}

module.exports = { BimUnitRepository };
