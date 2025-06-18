// backend/server.js

// NOVO: Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios'); // NOVO: Para fazer requisições HTTP seguras

// NOVO: Configuração e inicialização do Knex
const knexConfig = require('./knexfile').development;
const db = require('knex')(knexConfig);

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// --- ROTAS DA API ---

// Rota para servir o login.html na raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Rota de Cadastro (ALTERADA para async/await e Knex)
app.post('/registrar', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }
    if (senha.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    try {
        const [userId] = await db('usuarios').insert({ nome, email, senha });
        console.log('Usuário registrado com ID:', userId);
        res.status(201).json({ message: 'Usuário registrado com sucesso!', userId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este email já está cadastrado.' });
        }
        console.error('Erro ao registrar usuário:', err);
        return res.status(500).json({ message: 'Erro interno do servidor ao tentar registrar.' });
    }
});

// Rota de Login (ALTERADA para async/await e Knex)
app.post('/logar', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'Por favor, preencha email e senha.' });
    }

    try {
        const usuario = await db('usuarios').where({ email, senha }).first();
        if (usuario) {
            console.log('Login bem-sucedido para:', usuario.email);
            res.status(200).json({ message: 'Login bem-sucedido!', usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
        } else {
            res.status(401).json({ message: 'Email ou senha inválidos.' });
        }
    } catch (err) {
        console.error('Erro ao tentar logar:', err);
        return res.status(500).json({ message: 'Erro interno do servidor ao tentar logar.' });
    }
});

// Rota para Verificar E-mail (ALTERADA para async/await e Knex)
app.post('/verificar-email', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'O campo de email é obrigatório.' });
    }

    try {
        const usuario = await db('usuarios').where({ email }).first();
        if (usuario) {
            res.status(200).json({ message: 'E-mail válido.' });
        } else {
            res.status(404).json({ message: 'E-mail não cadastrado em nossa base de dados.' });
        }
    } catch (err) {
        console.error('Erro ao verificar email:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para Redefinir Senha (ALTERADA para async/await e Knex)
app.post('/redefinir-senha', async (req, res) => {
    const { email, novaSenha } = req.body;
    if (!email || !novaSenha || novaSenha.length < 6) {
        return res.status(400).json({ message: 'Dados inválidos ou senha muito curta.' });
    }

    try {
        const count = await db('usuarios').where({ email }).update({ senha: novaSenha });
        if (count > 0) {
            res.status(200).json({ message: 'Senha redefinida com sucesso!' });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado para redefinição.' });
        }
    } catch (err) {
        console.error('Erro ao redefinir senha:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- NOVAS ROTAS PARA GERENCIAR LISTAS DE FILMES ---

// NOVO: Rota segura para buscar filmes, usando a chave de API do backend
app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ message: 'O termo de busca é obrigatório.' });
    }

    const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`;

    try {
        const response = await axios.get(tmdbUrl);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Erro ao buscar filmes no TMDb:', error.message);
        res.status(500).json({ message: 'Erro ao se comunicar com a API de filmes.' });
    }
});


// Rota para BUSCAR as listas de um usuário (ALTERADA para Knex)
app.get('/api/listas/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const results = await db('listas_de_filmes')
            .select('id_filme', 'titulo_filme', 'poster_path', 'tipo_lista')
            .where('id_usuario', userId);
        res.status(200).json(results);
    } catch (err) {
        console.error('Erro ao buscar listas:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para ADICIONAR um filme a uma lista (ALTERADA para Knex)
app.post('/api/listas', async (req, res) => {
    const { id_usuario, id_filme, titulo_filme, poster_path, tipo_lista } = req.body;
    if (!id_usuario || !id_filme || !titulo_filme || !tipo_lista) {
        return res.status(400).json({ message: 'Dados insuficientes para adicionar à lista.' });
    }

    try {
        await db('listas_de_filmes').insert({ id_usuario, id_filme, titulo_filme, poster_path, tipo_lista });
        res.status(201).json({ message: 'Filme adicionado com sucesso!' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(200).json({ message: 'Filme já está nesta lista.' });
        }
        console.error('Erro ao adicionar na lista:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// NOVO: Rota para ALTERAR um filme de lista (UPDATE)
app.put('/api/listas', async (req, res) => {
    const { id_usuario, id_filme, tipo_lista } = req.body;
    if (!id_usuario || !id_filme || !tipo_lista) {
        return res.status(400).json({ message: 'Dados insuficientes para alterar a lista.' });
    }

    try {
        const count = await db('listas_de_filmes')
            .where({ id_usuario, id_filme })
            .update({ tipo_lista });

        if (count > 0) {
            res.status(200).json({ message: 'Filme movido para outra lista com sucesso.' });
        } else {
            res.status(404).json({ message: 'Filme não encontrado nas listas do usuário.' });
        }
    } catch (err) {
        console.error('Erro ao alterar filme de lista:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para REMOVER um filme de uma lista (ALTERADA para Knex)
app.delete('/api/listas', async (req, res) => {
    const { id_usuario, id_filme, tipo_lista } = req.body;
    if (!id_usuario || !id_filme || !tipo_lista) {
        return res.status(400).json({ message: 'Dados insuficientes para remover da lista.' });
    }

    try {
        const count = await db('listas_de_filmes').where({ id_usuario, id_filme, tipo_lista }).del();
        if (count > 0) {
            res.status(200).json({ message: 'Filme removido com sucesso.' });
        } else {
            res.status(404).json({ message: 'Filme não encontrado na lista especificada.' });
        }
    } catch (err) {
        console.error('Erro ao remover da lista:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
});