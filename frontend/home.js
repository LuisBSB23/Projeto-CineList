// home.js

document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES E VARIÁVEIS GLOBAIS ---
    // Seleciona os elementos do HTML (botões, formulários, contêineres) para que possam ser manipulados pelo JavaScript.
    const mensagemBoasVindas = document.getElementById('mensagem-boas-vindas');
    const btnLogout = document.getElementById('btn-logout');
    const formBusca = document.getElementById('form-busca');
    const inputBusca = document.getElementById('input-busca');
    const containerResultadosBusca = document.getElementById('resultados-busca');
    
    const btnLimparBusca = document.getElementById('btn-limpar-busca');
    const tituloResultadosBusca = document.getElementById('titulo-resultados-busca');

    // Agrupa os contêineres das três listas de filmes para fácil acesso.
    const listas = {
        assistir: document.getElementById('lista-assistir'),
        assistidos: document.getElementById('lista-assistidos'),
        favoritos: document.getElementById('lista-favoritos')
    };
    
    // Recupera os dados do usuário logado do armazenamento local do navegador (localStorage).
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    // Define a URL base do servidor backend para fazer as requisições da API.
    const backendUrl = 'http://localhost:3000';
    // URL base para carregar as imagens dos pôsteres dos filmes da API do TMDb.
    const tmdbImageUrl = 'https://image.tmdb.org/t/p/w500';

    // --- VERIFICAÇÃO DE LOGIN ---
    // Se não houver um usuário logado, redireciona o usuário para a página de login.
    if (!usuarioLogado) {
        window.location.href = 'login.html';
        return; // Interrompe a execução do script se o usuário não estiver logado.
    }
    // Exibe uma mensagem de boas-vindas personalizada com o nome do usuário.
    mensagemBoasVindas.textContent = `Bem-vindo(a), ${usuarioLogado.nome}!`;

    // --- FUNÇÕES PRINCIPAIS ---

    /**
     * Busca filmes na API do backend com base em uma consulta (query).
     * @param {string} query - O termo que o usuário deseja buscar.
     */
    async function buscarFilmes(query) {
        if (!query) return; // Não faz nada se a busca estiver vazia.
        
        // Monta a URL para a requisição de busca no backend.
        const url = `${backendUrl}/api/search?query=${encodeURIComponent(query)}`;
        
        try {
            // Faz a chamada para a API (fetch) e aguarda a resposta.
            const response = await fetch(url);
            const data = await response.json(); // Converte a resposta para JSON.
            // Chama a função para exibir os resultados da busca na tela.
            exibirFilmes(data.results, containerResultadosBusca);
        } catch (error) {
            // Em caso de erro na busca, exibe uma mensagem de erro no console e na tela.
            console.error('Erro ao buscar filmes:', error);
            containerResultadosBusca.innerHTML = '<p class="mensagem-lista-vazia">Erro ao buscar resultados. Tente novamente.</p>';
        }
    }

    /**
     * Renderiza uma lista de filmes em um contêiner específico na página.
     * @param {Array} filmes - O array de objetos de filmes a ser exibido.
     * @param {HTMLElement} container - O elemento HTML onde os filmes serão inseridos.
     * @param {string|null} nomeLista - O nome da lista ('assistir', 'assistidos', 'favoritos') para gerar os botões corretos.
     */
    function exibirFilmes(filmes, container, nomeLista = null) {
        container.innerHTML = ''; // Limpa o contêiner antes de adicionar os novos filmes.
        
        // Controla a visibilidade do botão "Limpar Busca" e do título dos resultados.
        if (container === containerResultadosBusca) {
            const temResultados = filmes && filmes.length > 0;
            btnLimparBusca.classList.toggle('oculto', !temResultados);
            tituloResultadosBusca.classList.toggle('oculto', !temResultados);
        }
        
        // Se a lista de filmes estiver vazia, exibe uma mensagem apropriada.
        if (!filmes || filmes.length === 0) {
            if (nomeLista) {
                container.innerHTML = `<p class="mensagem-lista-vazia">Sua lista está vazia.</p>`;
            }
            return;
        }

        // Itera sobre cada filme e cria um card para ele.
        filmes.forEach(filme => {
            // Normaliza os dados do filme, já que podem vir da busca (TMDb) ou do banco de dados.
            const filmeId = filme.id_filme || filme.id;
            const filmeTitulo = filme.titulo_filme || filme.title;
            const posterPath = filme.poster_path;
            const imageUrl = posterPath ? `${tmdbImageUrl}${posterPath}` : 'https://via.placeholder.com/500x750?text=Sem+Imagem';

            // Cria o elemento HTML para o card do filme.
            const cardFilme = document.createElement('div');
            cardFilme.className = 'card-filme';
            // Armazena os dados do filme nos atributos 'data-' para fácil acesso posterior.
            cardFilme.dataset.movieId = filmeId;
            cardFilme.dataset.movieTitle = filmeTitulo;
            cardFilme.dataset.posterPath = posterPath;

            // Define a estrutura interna do card com a imagem, título e botões de ação.
            cardFilme.innerHTML = `
                <img src="${imageUrl}" alt="Pôster de ${filmeTitulo}">
                <div class="info-filme">
                    <h3>${filmeTitulo}</h3>
                    <div class="acoes-filme">
                        ${getBotoesHTML(nomeLista, filmeId)}
                    </div>
                </div>
            `;
            // Adiciona o card criado ao contêiner na página.
            container.appendChild(cardFilme);
        });
    }

    /**
     * Gera o HTML dos botões de ação para um card de filme.
     * @param {string|null} nomeLista - Se o filme já está em uma lista, gera botões de "Mover" e "Remover".
     * @returns {string} - O HTML dos botões.
     */
    function getBotoesHTML(nomeLista) {
        // Se o filme já pertence a uma lista...
        if (nomeLista) { 
            const todasAsListas = { assistir: 'Quero Assistir', assistidos: 'Já Assisti', favoritos: 'Favoritos' };
            let botoesHTML = '';
            
            // Cria botões para mover o filme para as outras listas.
            for (const key in todasAsListas) {
                if (key !== nomeLista) {
                    botoesHTML += `<button class="btn-adicionar-lista btn-mover" data-list-type="${key}"><i class="fa-solid fa-arrow-right-arrow-left"></i> Mover para ${todasAsListas[key]}</button>`;
                }
            }
            
            // Adiciona o botão de remover da lista atual.
            botoesHTML += `<button class="btn-adicionar-lista btn-remover" data-list-type="${nomeLista}"><i class="fa-solid fa-trash"></i> Remover</button>`;
            return botoesHTML;

        } else { // Se for um filme da busca (não está em nenhuma lista)...
            // Retorna os botões padrão para adicionar a qualquer uma das três listas.
            return `
                <button class="btn-adicionar-lista" data-list-type="assistir"><i class="fa-solid fa-list-ul"></i> Quero Assistir</button>
                <button class="btn-adicionar-lista" data-list-type="assistidos"><i class="fa-solid fa-check"></i> Já Assisti</button>
                <button class="btn-adicionar-lista" data-list-type="favoritos"><i class="fa-solid fa-star"></i> Favoritos</button>
            `;
        }
    }

    /**
     * Carrega e exibe todas as listas de filmes associadas ao usuário logado.
     */
    async function carregarListasUsuario() {
        try {
            // Busca no backend todas as listas do usuário.
            const response = await fetch(`${backendUrl}/api/listas/${usuarioLogado.id}`);
            const filmesUsuario = await response.json();
            
            // Limpa as listas na tela antes de recarregá-las.
            Object.values(listas).forEach(lista => lista.innerHTML = '');

            // Separa os filmes por tipo de lista ('assistir', 'assistidos', 'favoritos').
            const filmesPorLista = { assistir: [], assistidos: [], favoritos: [] };
            filmesUsuario.forEach(filme => {
                if (filmesPorLista[filme.tipo_lista]) {
                    filmesPorLista[filme.tipo_lista].push(filme);
                }
            });

            // Exibe cada grupo de filmes em seu respectivo contêiner.
            for (const nomeLista in filmesPorLista) {
                exibirFilmes(filmesPorLista[nomeLista], listas[nomeLista], nomeLista);
            }
        } catch (error) {
            console.error('Erro ao carregar listas:', error);
        }
    }

    /**
     * Envia uma requisição ao backend para adicionar, mover ou remover um filme de uma lista.
     * @param {object} dadosFilme - Contém id, título e poster do filme.
     * @param {string} tipoLista - A lista de destino ('assistir', 'assistidos', 'favoritos').
     * @param {string} acao - A operação a ser realizada ('add', 'move', 'remove').
     * @param {HTMLElement|null} cardElement - O elemento do card do filme a ser manipulado na UI.
     */
    async function atualizarLista(dadosFilme, tipoLista, acao, cardElement = null) {
        const url = `${backendUrl}/api/listas`;
        let method = 'POST'; // Método padrão é POST (adicionar).

        if (acao === 'move') {
            method = 'PUT'; // Mover um filme entre listas.
        } else if (acao === 'remove') {
            method = 'DELETE'; // Remover um filme.
        }

        try {
            // Envia a requisição para o backend com os dados necessários.
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_usuario: usuarioLogado.id,
                    id_filme: dadosFilme.movieId,
                    titulo_filme: dadosFilme.movieTitle,
                    poster_path: dadosFilme.posterPath,
                    tipo_lista: tipoLista
                })
            });

            if (response.ok) {
                // Se a operação foi bem-sucedida, recarrega as listas para refletir a mudança.
                carregarListasUsuario(); 
                // Se a ação for 'add' e o card veio da busca, remova-o da tela.
                if (acao === 'add' && cardElement && containerResultadosBusca.contains(cardElement)) {
                    cardElement.remove();
                }
            } else {
                // Se houve erro na resposta do servidor, exibe um alerta.
                const erroData = await response.json();
                console.error('Erro ao atualizar lista:', erroData.message);
                alert(`Erro: ${erroData.message}`);
            }
        } catch (error) {
            console.error('Erro de conexão ao atualizar lista:', error);
        }
    }

    // --- EVENT LISTENERS (OUVINTES DE EVENTOS) ---

    // Evento de clique no botão de Logout.
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('usuarioLogado'); // Remove o usuário do localStorage.
        window.location.href = 'login.html'; // Redireciona para a página de login.
    });

    // Evento de submissão do formulário de busca.
    formBusca.addEventListener('submit', (e) => {
        e.preventDefault(); // Previne o recarregamento da página.
        const termoBusca = inputBusca.value.trim(); // Pega o valor do input e remove espaços extras.
        buscarFilmes(termoBusca); // Chama a função de busca.
    });

    // Evento de clique no botão para limpar os resultados da busca.
    btnLimparBusca.addEventListener('click', () => {
        containerResultadosBusca.innerHTML = ''; // Limpa os resultados.
        inputBusca.value = ''; // Limpa o campo de busca.
        btnLimparBusca.classList.add('oculto'); // Esconde o botão.
        tituloResultadosBusca.classList.add('oculto'); // Esconde o título.
        inputBusca.focus(); // Coloca o foco de volta no campo de busca.
    });

    // Usa a delegação de eventos para capturar cliques nos botões de ação dos filmes.
    document.body.addEventListener('click', (e) => {
        // Verifica se o clique foi em um botão de adicionar/mover/remover.
        const target = e.target.closest('.btn-adicionar-lista');
        if (!target) return; // Se não foi, ignora o clique.

        // Pega os dados do filme do card pai do botão.
        const card = target.closest('.card-filme');
        const tipoLista = target.dataset.listType;
        const dadosFilme = {
            movieId: card.dataset.movieId,
            movieTitle: card.dataset.movieTitle,
            posterPath: card.dataset.posterPath
        };
        
        // Determina a ação com base nas classes do botão clicado.
        let acao = 'add';
        if (target.classList.contains('btn-mover')) {
            acao = 'move';
        } else if (target.classList.contains('btn-remover')) {
            acao = 'remove';
        }
        
        // Chama a função para atualizar a lista no backend, passando o elemento do card.
        atualizarLista(dadosFilme, tipoLista, acao, card);
    });

    // --- INICIALIZAÇÃO ---
    // Carrega as listas do usuário assim que a página é totalmente carregada.
    carregarListasUsuario();
});