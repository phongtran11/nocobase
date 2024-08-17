const { IFCExtractorHelper } = require('../helpers/ifc_extractor.helper');
const { IFCTilerHelper } = require('../helpers/ifc_tiler.helper');

class HookService {
  /**
   *
   * @param {*} ifcModelData {id, file_model: {url}}
   * @returns true if success
   */
  static async hookIFCModelUploaded(ifcModelData) {
    const fileData = { name: `${ifcModelData?.id}`, path: ifcModelData?.file_model[0].url, modelId: ifcModelData.id };
    // Execute tiling
    const ifcTilerHelper = new IFCTilerHelper(fileData);
    const ifcExtractor = new IFCExtractorHelper(fileData);

    // Execute props extractor
    await Promise.all([
      // ifcExtractor.extract(),
      ifcTilerHelper.tiling(),
    ]);

    return true;
  }
}

module.exports = { HookService };
