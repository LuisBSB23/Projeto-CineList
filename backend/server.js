// backend/server.js

const path = require('path');
// Carrega as variáveis de ambiente (como senhas e chaves de API) do arquivo .env.
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Importa as bibliotecas necessárias.
const express = require('express'); // Framework para criar o servidor e as rotas.
const cors = require('cors'); // Middleware para permitir requisições de origens diferentes (frontend -> backend).
const bodyParser = require('body-parser'); // Middleware para interpretar o corpo das requisições (JSON).
const axios = require('axios'); // Cliente HTTP para fazer requisições para a API do TMDb.
const knex = require('knex'); // Construtor de consultas SQL para interagir com o banco de dados.

// Configura a conexão com o banco de dados MySQL usando as credenciais do arquivo .env.
const db = knex({
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT
    }
});

// Inicializa a aplicação Express.
const app = express();
const port = 3000;

// --- MIDDLEWARES ---
// Habilita o CORS para todas as rotas.
app.use(cors());
// Habilita o parsing de corpos de requisição em formato JSON.
app.use(bodyParser.json());
// Habilita o parsing de corpos de requisição de formulários HTML.
app.use(bodyParser.urlencoded({ extended: true }));
// Serve os arquivos estáticos (HTML, CSS, JS do frontend) da pasta 'frontend'.
app.use(express.static(path.join(__dirname, '../frontend')));

// --- ROTAS DA API ---

// Rota principal que serve a página de login quando alguém acessa a raiz do site.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Rota de Cadastro de Usuário (POST /registrar)
app.post('/registrar', async (req, res) => {
    const { nome, email, senha } = req.body;
    const emailRegex = /^.{4,}@gmail\.com$/;

    // Validações dos dados recebidos.
    if (!nome || !email || !senha) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Formato de e-mail inválido.' });
    }
    if (senha.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    try {
        // Insere o novo usuário no banco de dados.
        const [userId] = await db('usuarios').insert({ nome, email, senha });
        console.log('Usuário registrado com ID:', userId);
        res.status(201).json({ message: 'Usuário registrado com sucesso!', userId });
    } catch (err) {
        // Trata erro de e-mail duplicado.
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este email já está cadastrado.' });
        }
        console.error('Erro ao registrar usuário:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota de Login (POST /logar)
app.post('/logar', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'Por favor, preencha email e senha.' });
    }

    try {
        // Procura no banco de dados um usuário com o email e senha fornecidos.
        const usuario = await db('usuarios').where({ email, senha }).first();
        if (usuario) {
            console.log('Login bem-sucedido para:', usuario.email);
            // Retorna os dados do usuário (sem a senha) para o frontend.
            res.status(200).json({ message: 'Login bem-sucedido!', usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
        } else {
            res.status(401).json({ message: 'Email ou senha inválidos.' });
        }
    } catch (err) {
        console.error('Erro ao tentar logar:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para Verificar E-mail (POST /verificar-email)
app.post('/verificar-email', async (req, res) => {
    const { email } = req.body;
    // Validações...
    try {
        // Verifica se existe algum usuário com o e-mail fornecido.
        const usuario = await db('usuarios').where({ email }).first();
        if (usuario) {
            res.status(200).json({ message: 'E-mail válido.' });
        } else {
            res.status(404).json({ message: 'E-mail não cadastrado.' });
        }
    } catch (err) {
        console.error('Erro ao verificar email:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para Redefinir Senha (POST /redefinir-senha)
app.post('/redefinir-senha', async (req, res) => {
    const { email, novaSenha } = req.body;
    // Validações...
    try {
        // Atualiza a senha do usuário correspondente ao e-mail.
        const count = await db('usuarios').where({ email }).update({ senha: novaSenha });
        if (count > 0) {
            res.status(200).json({ message: 'Senha redefinida com sucesso!' });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado.' });
        }
    } catch (err) {
        console.error('Erro ao redefinir senha:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- ROTAS PARA GERENCIAR LISTAS DE FILMES ---

// Rota de Busca de Filmes (GET /api/search)
app.get('/api/search', async (req, res) => {
    const { query } = req.query; // Pega o termo de busca da URL.
    if (!query) {
        return res.status(400).json({ message: 'O termo de busca é obrigatório.' });
    }
    // Monta a URL para a API do TMDb, usando a chave de API do arquivo .env.
    const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`;
    try {
        // Faz a requisição para a API externa.
        const response = await axios.get(tmdbUrl);
        // Retorna os dados recebidos do TMDb para o frontend.
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Erro ao buscar filmes no TMDb:', error.message);
        res.status(500).json({ message: 'Erro ao se comunicar com a API de filmes.' });
    }
});

// Rota para Obter as Listas de um Usuário (GET /api/listas/:userId)
app.get('/api/listas/:userId', async (req, res) => {
    const { userId } = req.params; // Pega o ID do usuário da URL.
    try {
        // Busca no banco de dados todos os filmes associados a esse ID de usuário.
        const results = await db('listas_de_filmes')
            .select('id_filme', 'titulo_filme', 'poster_path', 'tipo_lista')
            .where('id_usuario', userId);
        res.status(200).json(results);
    } catch (err) {
        console.error('Erro ao buscar listas:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para ADICIONAR um filme a uma lista (POST /api/listas)
app.post('/api/listas', async (req, res) => {
    const { id_usuario, id_filme, titulo_filme, poster_path, tipo_lista } = req.body;
    // Validações...
    try {
        // Insere o novo filme na tabela 'listas_de_filmes'.
        await db('listas_de_filmes').insert({ id_usuario, id_filme, titulo_filme, poster_path, tipo_lista });
        res.status(201).json({ message: 'Filme adicionado com sucesso!' });
    } catch (err) {
        // Trata o caso em que o filme já existe na lista (evita duplicatas).
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(200).json({ message: 'Filme já está nesta lista.' });
        }
        console.error('Erro ao adicionar na lista:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para MOVER um filme de uma lista para outra (PUT /api/listas)
app.put('/api/listas', async (req, res) => {
    const { id_usuario, id_filme, tipo_lista } = req.body;
    // Validações...
    try {
        // Atualiza o 'tipo_lista' de um filme específico de um usuário.
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

// Rota para REMOVER um filme de uma lista (DELETE /api/listas)
app.delete('/api/listas', async (req, res) => {
    const { id_usuario, id_filme, tipo_lista } = req.body;
    // Validações...
    try {
        // Deleta o registro do filme da lista especificada.
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

// --- INICIALIZAÇÃO DO SERVIDOR ---
// O servidor começa a "ouvir" por requisições na porta definida.
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
});