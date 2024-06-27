const OBC = require('@thatopen/components');
const WEBIFC = require('web-ifc');
const fs = require('fs');
const path = require('path');

const BINARY_FILES_REGEX = /(ifc-processed-geometries-[0-9]+|ifc-processed-global)/;
const STORAGE_DIR = path.join(__dirname, "./output");

const CONFIG = {
  TilingDir: './output',
};

class IFCTilerHelper {
  components = null;
  fragmentManager = null;
  fileData = { name: 'test', path: './data/01-RVT-KIEN_TRUC-NOI_THAT.ifc', id: 1};
  fileArrayBuffer = null;

  /**
   *
   * @param {*} fileData {name, path}
   */
  constructor(fileData) {
    //this.fileData = fileData;
    this.initComponents();
    this.initGeometryTiler();
  }

  initComponents() {
    this.components = new OBC.Components();
    this.components.init();
  }

  initGeometryTiler() {
    this.geometryTiler = this.components.get(OBC.IfcGeometryTiler);
    this.initGeometryTilerSettings();
    this.initGeometryTilerEvents();
  }

  initGeometryTilerSettings() {
    this.geometryTiler.settings.excludedCategories.add(WEBIFC.IFCSPACE);
    this.geometryTiler.settings.wasm.logLevel = WEBIFC.LogLevel.LOG_LEVEL_ERROR;
    this.geometryTiler.settings.webIfc = {
      // MEMORY_LIMIT: 2147483648, // default: 2GB
      COORDINATE_TO_ORIGIN: true,
      OPTIMIZE_PROFILES: true,
    };
    this.geometryTiler.settings.minAssetsSize = 1000;
    this.geometryTiler.settings.minGeometrySize = 20;
  }

  initGeometryTilerEvents() {
    const settings = {
      assets: [],
      geometries: {},
      globalDataFileId: 'ifc-processed-global',
    };
    let fileIndex = 0;
    let files = []; // { name: string; bits: (Uint8Array | string)[] }[]
    let geometriesData = {}; // OBC.StreamedGeometries
    let geometryFilesCount = 1;

    this.geometryTiler.onGeometryStreamed.add(async ({ buffer, data }) => {
      const tileFileId = `ifc-processed-geometries-${fileIndex}`;

      for (const id in data) {
        settings.geometries[id] = {
          boundingBox: data[id].boundingBox,
          hasHoles: data[id].hasHoles,
          geometryFile: tileFileId,
        };
      }

      // we write to disk with .bin extension so the mime-type in the response is correct
      const sanitizedTileFileId = tileFileId.replace(BINARY_FILES_REGEX, '$1.bin');

      fs.writeFile(path.join(CONFIG.TilingDir, sanitizedTileFileId), Buffer.from(buffer))
        .then(() => console.log(`Wrote file ${tileFileId}`))
        .catch(() => console.log(`Error writing file ${tileFileId}`));

      fileIndex++;
    });
    this.geometryTiler.onAssetStreamed.add(async (assets) => {
      for (const asset of assets) {
        settings.assets.push({
          id: asset.id,
          geometries: asset.geometries,
        });
      }
    });
    this.geometryTiler.onIfcLoaded.add(async (data) => {
      const settingsFileId = 'ifc-processed.json';
      const writeSettingsFile = fs.writeFile(path.join(CONFIG.TilingDir, settingsFileId), JSON.stringify(settings));

      // we write to disk with .bin extension so the mime-type in the response is correct
      const globalFileId = settings.globalDataFileId.replace(BINARY_FILES_REGEX, '$1.bin');
      const writeGlobalFile = fs.writeFile(path.join(CONFIG.TilingDir, globalFileId), Buffer.from(data));

      await Promise.all([writeSettingsFile, writeGlobalFile]).catch(() => console.log('Error writing file'));
    });
    this.geometryTiler.onProgress.add(async (v) => {
    //   await prisma.iFCModel.update({
    //     where: {
    //       id: config.id,
    //     },
    //     data: {
    //       geometries_progress: v,
    //     },
    //   });
    });
    // Ensure the 'output' folder exists
    const outputFolder = path.join(__dirname, 'output');
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }
  }

  // Read file into arraybuffer
  readFile() {
    const data = fs.readFileSync(this.fileData.name);
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    this.fileArrayBuffer = new Uint8Array(buffer);
  }

  async executeTiling() {
    CONFIG.TilingDir = path.join(STORAGE_DIR, this.fileData.id);
    console.log('config', CONFIG.TilingDir);
    console.log('buffer', this.fileArrayBuffer);
    //await this.geometryTiler.streamFromBuffer(this.fileArrayBuffer);
  }

  async tiling() {
    this.readFile();
    await this.executeTiling();
  }
}

module.exports = { IFCTilerHelper };
