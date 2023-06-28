const express = require('express');
const router = express.Router();
const mysql = require('../connect/mysql').pool;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const login = require('../middleware/login')
require('dotenv').config();

router.get('/protected', login.verifyToken, (req, res) => {
    const email = req.body.email;
    res.json({ message: 'Rota protegida', email: email });
  });

router.post('/cadastro', (req, res, next) => {
    mysql.getConnection((error, conn) => {

        if (error) { return res.status(500).send({ erro: error }) }

        /* VERIFICA SE O USUARIO JÁ EXISTE */
        conn.query(`SELECT * FROM usuarios WHERE email = ?`,
            [req.body.email], (error, results) => {

                if (error) { return res.status(500).send({ error: error }) }
                if (results.length > 0) {
                    /* SE SIM CAI NA CONDIÇÃO */
                    res.status(409).send({ mensagem: 'Usuario já cadastrado' })

                } else {

                    bcrypt.hash(req.body.senha, 10, (errBcrypt, hash) => {

                        if (errBcrypt) { return res.status(500).send(console.log(errBcrypt)) }
                        conn.query(
                            `INSERT INTO usuarios (email,senha) VALUES (?,?)`,
                            [req.body.email, hash],

                            (error, results) => {
                                conn.release();
                                if (error) { return res.status(500).send({ error: error }) }

                                response = {
                                    mensagem: 'usuario criado com sucesso',
                                    usuarioCriado: {
                                        id_usuario: results.insertId,
                                        email: req.body.email
                                    }
                                }
                                return res.status(201).send(response)
                            }
                        )
                    });
                }
            })
    });
})

router.post('/login', (req, res, next) => {
    mysql.getConnection((error, conn) => {

        if (error) { return res.status(500).send({ erro: error }) }

        const query = `SELECT * FROM usuarios WHERE email = ?`;
        conn.query(query, [req.body.email], (error, results, filds) => {
            conn.release();
            if (error) { return res.status(500).send({ erro: error }) }
            if (results.length < 1) {
                return res.status(401).send({ mensagem: 'Falha na autenticação' })
            }
            bcrypt.compare(req.body.senha, results[0].senha, (err, result) => {
                if (err) {
                    return res.status(401).send({ mensagem: 'Falha na autenticação' })
                }
                if (result) {

                    const token = jwt.sign({
                        id_usuario: results[0].id_usuario,
                        email: results[0].email,
                    }, 'segredo',
                        {
                            expiresIn: '1h'
                        });

                    console.log(token);

                    return res.status(200).send({
                        mensagem: 'Autenticado com sucesso',
                        token: token,
                        email: req.body.email
                    })

                }
                return res.status(401).send({ mensagem: 'Falha na autenticação' })
            });
        });
    })
})

module.exports = router;