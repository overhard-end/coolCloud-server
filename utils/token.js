const jwt = require('jsonwebtoken');
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
