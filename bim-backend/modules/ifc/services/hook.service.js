const { IFCTilerHelper } = require("../helpers/ifc_tiler.helper");

class HookService {
    /**
     * 
     * @param {*} ifcModelData 
     * @returns true if success
     */
    static async hookIFCModelUploaded(ifcModelData) {
        const fileData = {name: ifcModelData?.name, path: ifcModelData?.file_model?.url}
        const ifcTilerHelper = new IFCTilerHelper(fileData);
        await ifcTilerHelper.tiling();
        return true;
    }
}

module.exports = { HookService }