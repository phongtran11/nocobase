const { IFCTilerHelper } = require("../helpers/ifc_tiler.helper");

class HookService {
    /**
     * 
     * @param {*} ifcModelData {id, file_model: {url}}
     * @returns true if success
     */
    static async hookIFCModelUploaded(ifcModelData) {
        const fileData = {name: `${ifcModelData?.id}`, path: ifcModelData?.file_model[0].url}
        const ifcTilerHelper = new IFCTilerHelper(fileData);
        await ifcTilerHelper.tiling();
        return true;
    }
}

module.exports = { HookService }