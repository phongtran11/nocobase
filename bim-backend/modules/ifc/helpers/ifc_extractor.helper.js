'use strict';

const WebIFC = require('web-ifc');
const fs = require('fs');
const logger = require('@cores/logger');
const { BimUnitRepository } = require('./../repositories/bim_unit.repository');

class IFCExtractorHelper {
  ifcProps = [];
  ctx = {
    ifcApi: null,
    ifcDataBuffer: null,
    ifcModelId: null,
    ifcPropsManager: null,
    ifcComponents: null,
  };
  fileData = { name: 'test', path: '/storage/uploads/240626-IFC-P-FFS-WEBGIS.ifc', outputDir: '', modelId: 1 };
  source = 'BimMetro';

  constructor(fileData, source) {
    this.fileData = fileData;
    this.source = source;
  }

  async extract() {
    // Read ifc file
    try {
      const file = fs.readFileSync(this.fileData.path);
      this.ctx.ifcDataBuffer = new Uint8Array(file);
      //
      this.ctx.ifcApi = new WebIFC.IfcAPI();
      await this.ctx.ifcApi.Init();
      this.ctx.ifcModelId = this.ctx.ifcApi.OpenModel(this.ctx.ifcDataBuffer);
      this.ctx.ifcPropsManager = new WebIFC.Properties(this.ctx.ifcApi);
      //
      const ifcRoot = await this.ctx.ifcPropsManager.getSpatialStructure(this.ctx.ifcModelId, true);
      await this.readIfcUnitsAndBuildProps(ifcRoot, null);
      logger.log('Total IFC Props: ', this.ifcProps.length);
      logger.log('Insert IFC Unit');
      await BimUnitRepository.clearByModelId(this.source, this.fileData.modelId);
      await BimUnitRepository.insertBatch(this.source, this.ifcProps);
      logger.log('Complete Insert');
      return this;
    } catch (ex) {
      logger.log(ex);
      return this;
    }
  }

  closeModel() {
    this.ctx.ifcApi.CloseModel(this.ctx.ifcModelId);
    return this;
  }

  readGroupPropertySets(props, propertySets) {
    let gisCode = '';
    let mFunction = '';
    propertySets?.forEach((prop) => {
      const groupName = prop.Name.value;
      props[groupName] = props[groupName] ?? {};
      prop?.HasProperties?.forEach((single) => {
        if (single?.Name) {
          props[groupName][single.Name.value] = {
            expressID: single.expressID,
            type: single.type,
            name: single.Name?.value ?? '',
            value: single.NominalValue?.value ?? '',
            unit: single.Unit,
            description: single.Description,
          };
          if (single.Name.value == 'Code_GIS') {
            gisCode = single.NominalValue.value;
            mFunction = gisCode;
          }
          if (single.Name.value == 'M_Function') {
            mFunction = single.NominalValue.value;
          }
        }
      });
    });
    return { gisCode, mFunction };
  }

  async readIfcUnitsAndBuildProps(root, parent, deep = 0) {
    if (deep > 20) return;
    const props = {};
    const ifcPropsManager = this.ctx.ifcPropsManager;
    const modelID = this.ctx.ifcModelId;

    console.log('ifcPropsManager.getTypeProperties - Start');
    let [typeprops, propsets] = await Promise.all([
      ifcPropsManager.getTypeProperties(modelID, root.expressID, true),
      ifcPropsManager.getPropertySets(modelID, root.expressID, true),
    ]);
    console.log('ifcPropsManager.getTypeProperties - Complete');

    const { gisCode, mFunction } = this.readGroupPropertySets(props, propsets);

    console.log('readGroupPropertySets - Start');
    typeprops.forEach((typeprop) => {
      this.readGroupPropertySets(props, typeprop.HasPropertySets);
    });
    console.log('readGroupPropertySets - Completed');

    const data = {
      model_id: this.fileData.modelId,
      express_id: root.expressID,
      parent_express_id: parent?.expressID,
      name: root.Name?.value,
      ifc_type: root.type,
      description: root.Description?.value,
      object_type: root.ObjectType?.value,
      properties: props,
      class_code: gisCode,
      m_function: mFunction,
    };
    this.ifcProps.push(data);
    logger.log('Insert IFCUnit', gisCode, mFunction, data.express_id);

    if (root.children && root.children.length > 0) {
      console.log(`readIfcUnitsAndBuildProps - Child Length:${root.children.length}`);
      const handlers = [];
      for (let i = 0; i < root.children.length; i++) {
        //await this.readIfcUnitsAndBuildProps(root.children[i], root);
        handlers.push(this.readIfcUnitsAndBuildProps(root.children[i], root, deep + 1));
      }
      await Promise.all(handlers);
    }
  }
}

module.exports = { IFCExtractorHelper };

// /// extractAndInsertIfcModel(data)
// {
//     "id": 11,
//     "createdAt": "2024-06-25T16:52:30.804Z",
//     "updatedAt": "2024-06-25T16:52:30.804Z",
//     "description": "test",
//     "name": "test",
//     "configPosition": null,
//     "createdById": 1,
//     "updatedById": 1,
//     "file_model": [
//       {
//         "id": 16,
//         "createdAt": "2024-06-25T16:52:29.942Z",
//         "updatedAt": "2024-06-25T16:52:29.942Z",
//         "title": "logo update",
//         "filename": "280f0b079b4f4e52d787237d8705da70.zip",
//         "extname": ".zip",
//         "size": 575409,
//         "mimetype": "application/zip",
//         "storageId": 1,
//         "path": "",
//         "meta": {},
//         "url": "/storage/uploads/280f0b079b4f4e52d787237d8705da70.zip",
//         "createdById": 1,
//         "updatedById": 1,
//         "t_z53fmn8bpds": {
//           "createdAt": "2024-06-25T16:52:30.807Z",
//           "updatedAt": "2024-06-25T16:52:30.807Z",
//           "f_9rbpl2hre8o": 11,
//           "f_j72fs85q2vp": 16
//         }
//       }
//     ]
//   }
