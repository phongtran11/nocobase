const OBC = require('@thatopen/components');
const fs = require('fs');

class IFCTilerHelper {
    components = null;
    fragmentManager = null;
    geometryTilerSettings = {
        wasm: {
            path: "https://unpkg.com/web-ifc@0.0.53/",
            absolute: true,
        },
        minGeometrySize: 20,
        minAssetsSize: 1000
    }
    fileData = {name: 'test', path: './data/01-RVT-KIEN_TRUC-NOI_THAT.ifc'}
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
        this.geometryTiler.settings = {
            ...this.geometryTiler.settings,
            ...this.geometryTilerSettings
        }
        this.initGeometryTilerEvents();
    }

    initGeometryTilerEvents() {
        let files = []; // { name: string; bits: (Uint8Array | string)[] }[]
        let geometriesData = {}; // OBC.StreamedGeometries
        let geometryFilesCount = 1;

        this.geometryTiler.onGeometryStreamed.add((geometry) => {
            const { buffer, data } = geometry;
            const bufferFileName = `${this.fileData.name}-processed-geometries-${geometryFilesCount}`;
            for (const expressID in data) {
                const value = data[expressID];
                value.geometryFile = bufferFileName;
                geometriesData[expressID] = value;
            }
            files.push({ name: bufferFileName, bits: [buffer] });
            geometryFilesCount++;

            // Write buffer to file
            const filePath = path.join(__dirname, 'output', bufferFileName);
            fs.writeFile(filePath, Buffer.from(buffer), (err) => {
                if (err) {
                    console.error(`Error writing file ${bufferFileName}:`, err);
                } else {
                    console.log(`File ${bufferFileName} written successfully`);
                }
            });
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
        await this.geometryTiler.streamFromBuffer(this.fileArrayBuffer);
    }

    async tiling() {
        this.readFile();
        await this.executeTiling();
    }
}

module.exports = { IFCTilerHelper }