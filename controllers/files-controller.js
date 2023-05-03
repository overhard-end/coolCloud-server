const path = require('path');
const fs = require('fs');
const busboy = require('busboy');
const filesService = require('../services/files-service');
const UPLOAD_DIR = path.join(__dirname, '../uploads/root');
const TMP_DIR = path.join(__dirname, '../tmp');
const mime = require('mime');

const getUserPath = (req) => {
  const userId = req.session.userUuid;
  const userPath = path.join(UPLOAD_DIR, userId);
  if (fs.existsSync(userPath)) return userPath;
  fs.mkdirSync(userPath);
  return userPath;
};
const getChunkDirPath = (req, fileHash) => {
  const userId = req.session.userUuid;
  const chunkDirPath = path.resolve(TMP_DIR, userId, `chunkDir_${fileHash}`);
  if (fs.existsSync(chunkDirPath)) return chunkDirPath;
  fs.mkdirSync(chunkDirPath, { recursive: true });
  return chunkDirPath;
};
class FilesController {
  async getFiles(req, res) {
    try {
      const userId = req.session.userUuid;
      const storePath = getUserPath(req);
      if (!fs.existsSync(storePath)) fs.mkdirSync(storePath);
      const filesTree = filesService.getfilesTree(storePath, userId);
      filesTree.maxSize = process.env.USER_DEFAULT_STORAGE_SIZE;
      res.status(200).json(filesTree);
    } catch (error) {
      console.error(error);
      res.status(500);
    }
  }
  async checkFile(req, res) {
    try {
      const { fileName, fileHash } = req.body;
      const userPath = getUserPath(req);
      const chunkDirPath = getChunkDirPath(req, fileHash);
      const checkingFilePath = path.resolve(userPath, fileName);
      if (fs.existsSync(checkingFilePath)) return res.json({ exist: true });
      if (!fs.existsSync(chunkDirPath)) return res.json({ exist: false });
      const uploadedChunks = fs.readdirSync(chunkDirPath);
      const chunksIndex = uploadedChunks.map((chunk) => parseInt(chunk.split('-').pop()));
      if (chunksIndex.length > 0) return res.json({ exist: false, lastIndex: chunksIndex });
      res.json({ exist: false });
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  }
  async createDir(req, res) {
    try {
      const dirPath = req.body.dirPath;
      const newDirPath = path.join(getUserPath(req), dirPath);
      if (fs.existsSync(newDirPath))
        return res.status(409).json({ success: false, message: 'Directory already exist' });
      fs.mkdirSync(newDirPath);
      res.json({ success: true, message: 'Directory was created' });
    } catch (error) {
      console.error(error);
      res.status(500);
    }
  }
  async downloadFile(req, res) {
    const filePath = req.query.filePath;
    const fileName = path.basename(filePath);
    const downloadPath = path.join(getUserPath(req), filePath);
    const contentType = mime.getType(downloadPath);
    const file = fs.readFileSync(downloadPath);
    res.setHeader('Content-Length', file.length);
    res.write(file, 'binary');
    res.end();
    // const stream = fs.createReadStream(downloadPath);
    // res.setHeader('Content-Type', `${contentType}`);
    // res.setHeader('Content-Disposition', contentDisposition(fileName));
    // stream.pipe(res)
  }
  async mergeFile(req, res) {
    try {
      const { fileName, fileHash, size, relativePath } = req.body;
      const userDirPath = getUserPath(req);
      const chunkDirPath = getChunkDirPath(req, fileHash);
      const mergePath = path.join(userDirPath, relativePath, fileName);
      console.log(mergePath);
      const allChunksPath = fs.readdirSync(chunkDirPath);
      allChunksPath.sort((a, b) => a.split('-')[2] - b.split('-')[2]);

      const pipeStream = (chunkPath, writeStream) => {
        return new Promise((resolve) => {
          const readStream = fs.createReadStream(chunkPath);
          readStream.on('end', () => {
            fs.unlink(chunkPath, () => resolve(true));
          });
          readStream.pipe(writeStream);
        });
      };
      await Promise.all(
        allChunksPath.map((chunkPath, index) =>
          pipeStream(
            path.resolve(chunkDirPath, chunkPath),
            fs.createWriteStream(mergePath, { start: index * size }),
          ),
        ),
      ).then(() => {
        if (fs.existsSync(chunkDirPath)) fs.rmdirSync(chunkDirPath);
        res.json({ status: 'success', fileName: fileName });
      });
    } catch (error) {
      console.error(error);
      res.status(500);
    }
  }
  async saveChunks(req, res) {
    try {
      const bb = busboy({ headers: req.headers });
      bb.on('file', (chunkName, chunk) => {
        const fileHash = chunkName.split('-')[0];
        const chunkSize = parseInt(chunkName.split('-')[1]);
        const chunkDir = getChunkDirPath(req, fileHash);
        if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir);
        const chunkPath = path.resolve(chunkDir, chunkName);
        chunk.on('close', () => res.json());
        chunk.pipe(fs.createWriteStream(chunkPath));
      });
      req.pipe(bb);
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  }

  async removeFile(req, res) {
    try {
      const filePath = req.body.filePath;
      const userPath = getUserPath(req);
      const deletePath = path.join(userPath, filePath);
      const isFileExist = fs.existsSync(deletePath);
      if (!isFileExist) return res.json({ statusSuccesse: false, message: 'File not found !' });
      if (!fs.statSync(deletePath).isDirectory()) {
        fs.unlinkSync(deletePath);
        return res.json({ statusSuccesse: true, message: 'File was deleted' });
      }
      const deleteDir = (deletePath) => {
        fs.readdirSync(deletePath).forEach((filePath) => {
          let curPath = path.join(deletePath, filePath);
          if (fs.statSync(curPath).isDirectory()) return deleteDir(curPath);
          fs.unlinkSync(curPath);
        });
        fs.rmdirSync(deletePath);
      };
      deleteDir(deletePath);
      return res.json({ statusSuccesse: true, message: 'Directory was deleted ' });
    } catch (error) {
      console.error(error);
      res.status(500);
    }
  }
}

module.exports = new FilesController();
