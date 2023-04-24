const dirTree = require('directory-tree'); //library for get files structure from storage directory

const fs = require('fs');

class FileService {
  getfilesTree(storagePath, userId) {
    const resuts = dirTree(
      storagePath,
      {
        attributes: ['size', 'type', 'extension'],
        normalizePath: true,
      },
      null,
      (item, path, stats) => {
        let pathSplit = path.split(`${userId}`);
        let newPath = pathSplit.pop();
        item.path = newPath;

        for (let i = 0; i < item.children.length; i++) {
          let childrenPath = item.children[i].path;
          let newChildrenPath = childrenPath.split(`${userId}`).pop();
          item.children[i].path = newChildrenPath;
        }
      },
    );
    return resuts;
  }
  checkChunk(chunkPath, chunkSize) {
    if (!fs.existsSync(chunkPath)) return false;
    const currentChunkSize = fs.statSync(chunkPath).size;
    console.log(currentChunkSize + '-' + chunkSize);
    if (chunkSize === currentChunkSize) return true;
    fs.unlinkSync(chunkPath);
    return false;
  }
}
module.exports = new FileService();
