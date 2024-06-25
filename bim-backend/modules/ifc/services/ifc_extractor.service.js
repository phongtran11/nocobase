class IFCExtractorService {
    async extractAndInsertIfcModel(data) {
        const filePath = data?.file_model[0]?.url;
        const modelId = data?.id;
    }
}

module.exports = { IFCExtractorService }

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