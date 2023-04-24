const Token = require('../utils/token');
const accessKey = process.env.USERFRONT_JWT_PUBLIC_KEY;

function accessTokenCheck(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    const check = Token.checkToken(token, accessKey, { algorithms: ['RS256'] });
    if (!check?.valid) return res.sendStatus(401);
    req.session = check.decoded;
    next();
  } catch (error) {
    console.log(error);
  }
}
module.exports = accessTokenCheck;
