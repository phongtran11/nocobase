const { IFCExtractorHelper } = require('../helpers/ifc_extractor.helper');
const { IFCTilerHelper } = require('../helpers/ifc_tiler.helper');

const {BimModelRepository} = require('./../repositories/bim_model.repository');
const {BIM_MODEL_STATUS} = require('./../constants/common');

class HookService {
  /**
   *
   * @param {*} ifcModelData {id, file_model: {url}}
   * @returns true if success
   */
  static async hookIFCModelUploaded(ifcModelData, source) {
    const fileData = {
      name: `${source}-${ifcModelData?.id}`,
      path: ifcModelData?.file_model[0].url,
      modelId: ifcModelData.id,
    };
    // Update status
    await BimModelRepository.updateModelStatus(source, ifcModelData.id, BIM_MODEL_STATUS.STEP_1_ANALYSIS);
    // Execute tiling
    const ifcTilerHelper = new IFCTilerHelper(fileData, source);
    const ifcExtractor = new IFCExtractorHelper(fileData, source);

    // Execute props extractor
    await Promise.all([ifcExtractor.extract(), ifcTilerHelper.tiling()]);

    return true;
  }
}

module.exports = { HookService };
