const express = require('express');
const router = express.Router();
const mysql = require('../connect/mysql').pool;
const login = require('../middleware/login')

/* Get TODOS OS DADOS ENCONTRADOS SEM FILTRO POR PARAMETRO */
router.get('/', (req, res, next) => {

    mysql.getConnection((error, conn) => {

        if (error) { return res.status(500).send({ error: error }) }

        conn.query(
            'SELECT * FROM contatos;',
            (error, result, fields) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error }) }

                const response = {
                    quantidade: result.length,
                    registros: result.map(prod => {

                        return {
                            id: prod.id,
                            nomeCompleto: prod.nomeCompleto,
                            telefone: prod.telefone,
                            email: prod.email,
                            setor: prod.setor,
                            info: prod.info,
                            image: prod.image,
                        }

                    })
                }
                return res.status(200).json(response)
            }
        )
    })
});

/* Get SOMENTE DE UM DADO RETORNADO PELO SEU ID */
router.get('/:id', (req, res, next) => {
    mysql.getConnection((error, conn) => {

        if (error) { return res.status(500).send({ error: error }) }

        conn.query(
            'SELECT * FROM contatos WHERE id = ?;',
            [req.params.id],
            (error, result, fields) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error }) }

                if (result.length == 0) {
                    return res.status(404).send({
                        mensagem: 'Não foi encontrado nenhum registro com esse id'
                    })
                }

                const response = {
                    pregistro: {
                        id: result[0].id,
                        nomeCompleto: result[0].nomeCompleto,
                        telefone: result[0].telefone,
                        email: result[0].email,
                        setor: result[0].setor,
                        info: result[0].info,
                        image: result[0].image,
                    }
                }
                return res.status(200).json(response)
            }
        )
    })
});

/* ROTA DE PESQUISA */
router.get('/pesquisar/pesquisar', (req, res, next) => {

    const { nomeCompleto, telefone, email, setor, info, image } = req.query;

    let query = 'SELECT * FROM contatos';
  
    if (nomeCompleto || telefone || email || setor || info || image ) {
      query += ' WHERE';
  
      if (nomeCompleto) {
        query += ` nomeCompleto LIKE '%${nomeCompleto}%' AND`;
      }
  
      if (telefone) {
        query += ` telefone LIKE '%${telefone}%' AND`;
      }
  
      if (email) {
        query += ` email LIKE '%${email}%' AND`;
      }
  
      if (setor) {
        query += ` setor LIKE '%${setor}%' AND`;
      }

      if (info) {
        query += ` info LIKE '%${info}%' AND`;
      }

      if (image) {
        query += ` image LIKE '%${image}%' AND`;
      }
      
      // remove o último operador AND adicionado
      query = query.slice(0, -4);
    }

    // executar a query no banco de dados
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }

        conn.query(query, (error, result, fields) => {
            conn.release();
            if (error) { return res.status(500).send({ error: error }) }

            const response = {
                quantidade: result.length,
                Contatos: result.map(prod => {
                    return {
                        id: prod.id,
                        nomeCompleto: prod.nomeCompleto,
                        telefone: prod.telefone,
                        email: prod.email,
                        setor: prod.setor,
                        info: prod.info,
                        image: prod.image,
                    }
                })
            }

            return res.status(200).json(response);
        })
    });
});

// Rota POST para adicionar um novo contato
router.post('/', (req, res, next) => {
  const { nomeCompleto, telefone, email, setor, info, image } = req.body;

  // Realizar a lógica para adicionar os dados do contato ao banco de dados
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }

    const query = 'INSERT INTO contatos (nomeCompleto, telefone, email, setor, info, image) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [nomeCompleto, telefone, email, setor, info, image];

    conn.query(query, values, (error, result, fields) => {
      conn.release();
      if (error) {
        return res.status(500).send({ error: error });
      }

      // Retornar uma resposta de sucesso
      return res.status(201).send({ message: 'Contatos adicionado com sucesso' });
    });
  });
});

/* PATCH ALTERAR O CONTATO POR PARAMETRO DA URL */
router.patch('/:id', (req, res, next) => {
    mysql.getConnection((error, conn) => {

        if (error) { return res.status(500).send({ error: error }) }

        conn.query(
            `UPDATE contatos SET 
                nomeCompleto = ?, telefone = ?, email = ?, setor = ?, info = ?, image = ?  WHERE id = ?`,
            [
                req.body.nomeCompleto,
                req.body.telefone,
                req.body.email,
                req.body.setor,
                req.body.info,
                req.body.image,
                req.params.id
            ],

            (error, result, fields) => {
                conn.release();

                if (error) { return res.status(500).send({ error: error }) }

                const response = {
                    mensagem: 'Contato atualizado com sucesso',
                    produtoAtualizado: {
                        id_registro: req.body.id,
                    }
                }
                return res.status(202).send({ response });
            }
        )
    })
});

/* DELETA PRODUTO POR PARAMETRO DA URL */
router.delete('/deletar', (req, res, next) => {
    const ids = req.query.ids.split(','); // transforma a string em um array de ids
    
    mysql.getConnection((error, conn) => {
      if (error) {
        return res.status(500).send({ error: error });
      }
  
      // itera sobre o array de ids, executando a query de delete para cada um
      ids.forEach(id => {
        conn.query(
          'DELETE FROM contatos WHERE id = ?',
          [id],
          (error, result, fields) => {
            if (error) {
              console.log(error);
            }
          }
        )
      })
  
      conn.release();
  
      const response = {
        mensagem: 'Registros removidos com sucesso!',
      }
      return res.status(202).send({ response });
    })
});

module.exports = router;