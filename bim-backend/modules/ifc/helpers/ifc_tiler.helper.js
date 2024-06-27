const OBC = require('@thatopen/components');
const WEBIFC = require('web-ifc');
const fs = require('fs');
const path = require('path');

class IFCTilerHelper {
  components = null;
  fragmentManager = null;
  geometryTilerSettings = {
    minGeometrySize: 20,
    minAssetsSize: 1000,
  };
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
    this.fileData.outputDir = path.join('/storage/uploads/tiling', this.fileData.name);
    if (!fs.existsSync(this.fileData.outputDir)) {
      fs.mkdirSync(this.fileData.outputDir);
    }
  }

  initComponents() {
    this.components = new OBC.Components();
  }

  initGeometryTiler() {
    this.geometryTiler = this.components.get(OBC.IfcGeometryTiler);
    this.geometryTiler.settings = {
      ...this.geometryTiler.settings,
      ...this.geometryTilerSettings,
    };
    this.initGeometryTilerEvents();
  }

  initGeometryTilerEvents() {
    let files = []; // { name: string; bits: (Uint8Array | string)[] }[]
    let geometryFilesCount = 1;

    const settings = {
      assets: [],
      geometries: {},
      globalDataFileId: 'ifc-processed-global',
    };

    this.geometryTiler.onGeometryStreamed.add(async (geometry) => {
      const { buffer, data } = geometry;
      const bufferFileName = `processed-geometries-${geometryFilesCount}`;
      for (const expressID in data) {
        const value = data[expressID];
        value.geometryFile = bufferFileName;
        settings.geometries[expressID] = {
          boundingBox: data[expressID].boundingBox,
          hasHoles: data[expressID].hasHoles,
          geometryFile: bufferFileName,
        };
      }
      files.push({ name: bufferFileName, bits: [buffer] });
      geometryFilesCount++;

      // Write buffer to file
      const filePath = path.join(this.fileData.outputDir, bufferFileName);
      await fs.writeFile(filePath, Buffer.from(buffer), (err) => {
        if (err) {
          console.error(`Error writing file ${bufferFileName}:`, err);
        } else {
          console.log(`File ${bufferFileName} written successfully`);
        }
      });
    });

    this.geometryTiler.onProgress.add((progress) => {});
    this.geometryTiler.onIfcLoaded.add(async (data) => {
      const settingsFileId = 'ifc-processed.json';
      await fs.writeFile(path.join(this.fileData.outputDir, settingsFileId), JSON.stringify(settings), (err) => {});
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
