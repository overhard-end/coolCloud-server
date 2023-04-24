const jwt = require('jsonwebtoken');
const accessKey = process.env.JWT_ACCESS_TOKEN_KEY;
const refreshKey = process.env.JWT_RESRESH_TOKEN_KEY;
class Token {
  checkToken(token, tokenSecret, options) {
    try {
      const decoded = jwt.verify(token, tokenSecret, options);
      return {
        valid: true,
        decoded: decoded,
      };
    } catch (err) {
      return {
        valid: false,
        message: err.message,
      };
    }
  }
}

module.exports = new Token();
