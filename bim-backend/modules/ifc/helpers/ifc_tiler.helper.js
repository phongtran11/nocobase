const OBC = require('@thatopen/components');
const WEBIFC = require('web-ifc');
const fs = require('fs');
const path = require('path');
const logger = require('@cores/logger');

class IFCTilerHelper {
  components = null;
  fragmentManager = null;
  fileData = { name: 'test', path: '/storage/01-RVT-KIEN_TRUC-NOI_THAT.ifc', outputDir: '' };
  fileArrayBuffer = null;

  /**
   *
   * @param {*} fileData {name, path}
   */
  constructor(fileData) {
    this.fileData = fileData;
    this.initFileData();
    this.initComponents();
    this.initGeometryTiler();
  }

  initFileData() {
    const outputDir = '/storage/uploads/tiling';
    // const outputDir = '/Users/admin/Project/HCMGIS/bim-tiling/openbim-ifc-playground/server/storage/tiling';
    this.fileData.outputDir = path.join(outputDir);
    if (!fs.existsSync(this.fileData.outputDir)) {
      fs.mkdirSync(this.fileData.outputDir);
    }
  }

  initComponents() {
    this.components = new OBC.Components();
  }

  initGeometryTiler() {
    this.initGeometryTilerConfig();
    this.initGeometryTilerEvents();
  }

  initGeometryTilerConfig() {
    this.geometryTiler = new OBC.IfcGeometryTiler(new OBC.Components());
    this.geometryTiler.settings.excludedCategories.add(WEBIFC.IFCSPACE);
    this.geometryTiler.settings.wasm.logLevel = WEBIFC.LogLevel.LOG_LEVEL_ERROR;
    // this.geometryTiler.settings.autoSetWasm = true; // automatically resolves wasm version from package.json
    this.geometryTiler.settings.webIfc = {
      // MEMORY_LIMIT: 2147483648, // default: 2GB
      COORDINATE_TO_ORIGIN: true,
      OPTIMIZE_PROFILES: true,
    };

    this.geometryTiler.settings.minAssetsSize = 1000;
    this.geometryTiler.settings.minGeometrySize = 20;
  }

  initGeometryTilerEvents() {
    let globalDataFileId = `${this.fileData.name}-ifc-processed-global`;

    const settings = {
      assets: [],
      geometries: {},
      globalDataFileId: globalDataFileId,
    };
    let geometryFilesCount = 0;

    this.geometryTiler.onGeometryStreamed.add(async ({ buffer, data }) => {
      const bufferFileName = `${this.fileData.name}-processed-geometries-${geometryFilesCount}`;
      for (const id in data) {
        settings.geometries[id] = {
          boundingBox: data[id].boundingBox,
          hasHoles: data[id].hasHoles,
          geometryFile: bufferFileName,
        };
      }

      // Write buffer to file
      const filePath = path.join(this.fileData.outputDir, bufferFileName);
      await fs.writeFile(filePath, Buffer.from(buffer), (err) => {
        if (err) {
          logger.error(`Error writing file ${bufferFileName}:`, err);
        } else {
          logger.log(`File ${bufferFileName} written successfully`);
        }
      });
      geometryFilesCount++;
    });

    this.geometryTiler.onProgress.add((progress) => {});
    this.geometryTiler.onAssetStreamed.add(async (assets) => {
      for (const asset of assets) {
        settings.assets.push({
          id: asset.id,
          geometries: asset.geometries,
        });
      }
    });
    this.geometryTiler.onIfcLoaded.add(async (data) => {
      const settingsFileId = `${this.fileData.name}-ifc-processed.json`;
      await Promise.all([
        fs.writeFile(path.join(this.fileData.outputDir, settingsFileId), JSON.stringify(settings), (err) => {}),
        fs.writeFile(path.join(this.fileData.outputDir, settings.globalDataFileId), Buffer.from(data), (err) => {}),
      ]);
    });
    // Ensure the 'output' folder exists
  }

  async executeTiling() {
    await this.geometryTiler.streamFromBuffer(this.fileArrayBuffer);
  }

  // Read file into arraybuffer
  async readFile() {
    const data = await fs.readFileSync(this.fileData.path);
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    this.fileArrayBuffer = new Uint8Array(buffer);
  }

  async tiling() {
    await this.readFile();
    await this.executeTiling();
  }
}

module.exports = { IFCTilerHelper };
