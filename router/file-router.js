const express = require('express');
const router = express.Router();
const filesController = require('../controllers/files-controller');
const accessTokenCheck = require('../middlewares/access-token-check');

router.get('/files', accessTokenCheck, filesController.getFiles);
router.post('/chunk', accessTokenCheck, filesController.saveChunks);
router.post('/fileMerge', accessTokenCheck, filesController.mergeFile);
router.post('/fileCheck', accessTokenCheck, filesController.checkFile);
router.post('/fileRemove', accessTokenCheck, filesController.removeFile);
router.get('/fileDownload', accessTokenCheck, filesController.downloadFile);
router.post('/createDir', accessTokenCheck, filesController.createDir);

module.exports = router;
