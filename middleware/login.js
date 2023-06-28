const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.obrigatorio = (req, res, next) => {
    try{

        var token = req.headers.authorization.split(' ')[1];
        const decode = jwt.verify(token, process.env.SECRETE);
        req.usuario = decode;
        next();

    } catch (error) {

        return res.status(401).send({mensagem: 'Falha na autenticação'})

    }
}

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    
    jwt.verify(token, process.env.SECRETE, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ message: 'Token inválido' });
      }
      req.user = decodedToken;
      next();
    });
};