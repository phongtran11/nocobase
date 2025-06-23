const { fastify } = require('@cores/global');

class BimUnitRepository {
  static async clearByModelId(source, modelId) {
    return await fastify.pg[source].transact(async (client) => {
      await client.query('delete from bim_units where "modelId" = $1', [modelId]);
    });
  }

  static async insertBatch(source, dataArray) {
    function findGisCodeExpressId(properties) {
      const keyValueProperties = Object.entries(properties);

      if (!keyValueProperties?.length) return null;

      const gisCodeProperty = keyValueProperties.find(([key]) => {
        return key === 'Text';
      });

      const gisCodeExpressId = gisCodeProperty?.[1]?.CODE_GIS?.expressID;

      if (!gisCodeExpressId) {
        return null;
      }

      return gisCodeExpressId;
    }

    // Define a batch size
    const batchSize = 50;

    // Split the dataArray into batches
    const batches = [];
    for (let i = 0; i < dataArray.length; i += batchSize) {
      batches.push(dataArray.slice(i, i + batchSize));
    }

    return await fastify.pg[source].transact(async (client) => {
      const handlers = [];
      let modelId = null;
      if (batches.length) {
        const batch = batches[0];
        modelId = batch?.length ? batch[0]['model_id'] : null;
      }
      try {
        if (!modelId) {
          return;
        }
        await client.query(`UPDATE bim_models set status = 2 where id = ${modelId};`)

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

            const gis_code_express_id = findGisCodeExpressId(properties);

            const startIndex = index * 10 + 1; // Adjust index for placeholders
            placeholders.push(`($${startIndex}, $${startIndex + 1}, $${startIndex + 2}, 
                              $${startIndex + 3}, $${startIndex + 4}, $${startIndex + 5}, 
                              $${startIndex + 6}, $${startIndex + 7}, $${startIndex + 8}, 
                              $${startIndex + 9})`);

            values.push(
              model_id,
              express_id ?? 'NULL',
              parent_express_id ?? 'NULL',
              name ?? 'NULL',
              ifc_type ?? 'NULL',
              description ?? 'NULL',
              object_type ?? 'NULL',
              properties ?? 'NULL',
              class_code ?? 'NULL',
              m_function ?? 'NULL',
            );
          });

          const sql = `
        INSERT INTO bim_units (
          "modelId", "expressId", parent_express_id, name, ifc_type, description,
          object_type, properties, class_code, m_function
        ) VALUES ${placeholders.join(', ')}`;

          console.log(sql);
          handlers.push(client.query(sql, values));
        }
        await Promise.all(handlers);
        await client.query(`UPDATE bim_models set status = 3 where id = ${modelId};`);
      } catch (ex) {
        console.log(ex);
        await client.query(`UPDATE bim_models set status = 4 where id = ${modelId};`);
      }
    });
  }
}

module.exports = { BimUnitRepository };
