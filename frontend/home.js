// home.js

document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES E VARIÁVEIS GLOBAIS ---
    const mensagemBoasVindas = document.getElementById('mensagem-boas-vindas');
    const btnLogout = document.getElementById('btn-logout');
    const formBusca = document.getElementById('form-busca');
    const inputBusca = document.getElementById('input-busca');
    const containerResultadosBusca = document.getElementById('resultados-busca');
    
    const btnLimparBusca = document.getElementById('btn-limpar-busca');
    const tituloResultadosBusca = document.getElementById('titulo-resultados-busca');

    const listas = {
        assistir: document.getElementById('lista-assistir'),
        assistidos: document.getElementById('lista-assistidos'),
        favoritos: document.getElementById('lista-favoritos')
    };
    
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const backendUrl = 'http://localhost:3000';
    
    const tmdbImageUrl = 'https://image.tmdb.org/t/p/w500';

    // --- VERIFICAÇÃO DE LOGIN ---
    if (!usuarioLogado) {
        window.location.href = 'login.html';
        return;
    }
    mensagemBoasVindas.textContent = `Bem-vindo(a), ${usuarioLogado.nome}!`;

    // --- FUNÇÕES PRINCIPAIS ---
    async function buscarFilmes(query) {
        if (!query) return;
        
        const url = `${backendUrl}/api/search?query=${encodeURIComponent(query)}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            exibirFilmes(data.results, containerResultadosBusca);
        } catch (error) {
            console.error('Erro ao buscar filmes:', error);
            containerResultadosBusca.innerHTML = '<p class="mensagem-lista-vazia">Erro ao buscar resultados. Tente novamente.</p>';
        }
    }

    function exibirFilmes(filmes, container, nomeLista = null) {
        container.innerHTML = '';
        
        if (container === containerResultadosBusca) {
            const temResultados = filmes && filmes.length > 0;
            btnLimparBusca.classList.toggle('oculto', !temResultados);
            tituloResultadosBusca.classList.toggle('oculto', !temResultados);
        }
        
        if (!filmes || filmes.length === 0) {
            if (nomeLista) {
                container.innerHTML = `<p class="mensagem-lista-vazia">Sua lista está vazia.</p>`;
            }
            return;
        }

        filmes.forEach(filme => {
            const filmeId = filme.id_filme || filme.id;
            const filmeTitulo = filme.titulo_filme || filme.title;
            const posterPath = filme.poster_path;
            const imageUrl = posterPath ? `${tmdbImageUrl}${posterPath}` : 'https://via.placeholder.com/500x750?text=Sem+Imagem';

            const cardFilme = document.createElement('div');
            cardFilme.className = 'card-filme';
            cardFilme.dataset.movieId = filmeId;
            cardFilme.dataset.movieTitle = filmeTitulo;
            cardFilme.dataset.posterPath = posterPath;

            cardFilme.innerHTML = `
                <img src="${imageUrl}" alt="Pôster de ${filmeTitulo}">
                <div class="info-filme">
                    <h3>${filmeTitulo}</h3>
                    <div class="acoes-filme">
                        ${getBotoesHTML(nomeLista, filmeId)}
                    </div>
                </div>
            `;
            container.appendChild(cardFilme);
        });
    }

    function getBotoesHTML(nomeLista, filmeId) {
        if (nomeLista) { 
            const todasAsListas = {
                assistir: 'Quero Assistir',
                assistidos: 'Já Assisti',
                favoritos: 'Favoritos'
            };
            let botoesHTML = '';

            for (const key in todasAsListas) {
                if (key !== nomeLista) {
                    botoesHTML += `<button class="btn-adicionar-lista btn-mover" data-list-type="${key}"><i class="fa-solid fa-arrow-right-arrow-left"></i> Mover para ${todasAsListas[key]}</button>`;
                }
            }

            botoesHTML += `<button class="btn-adicionar-lista btn-remover" data-list-type="${nomeLista}"><i class="fa-solid fa-trash"></i> Remover</button>`;
            return botoesHTML;

        } else { 
            return `
                <button class="btn-adicionar-lista" data-list-type="assistir"><i class="fa-solid fa-list-ul"></i> Quero Assistir</button>
                <button class="btn-adicionar-lista" data-list-type="assistidos"><i class="fa-solid fa-check"></i> Já Assisti</button>
                <button class="btn-adicionar-lista" data-list-type="favoritos"><i class="fa-solid fa-star"></i> Favoritos</button>
            `;
        }
    }

    async function carregarListasUsuario() {
        try {
            const response = await fetch(`${backendUrl}/api/listas/${usuarioLogado.id}`);
            const filmesUsuario = await response.json();
            
            Object.values(listas).forEach(lista => lista.innerHTML = '');

            const filmesPorLista = { assistir: [], assistidos: [], favoritos: [] };
            filmesUsuario.forEach(filme => {
                if (filmesPorLista[filme.tipo_lista]) {
                    filmesPorLista[filme.tipo_lista].push(filme);
                }
            });

            for (const nomeLista in filmesPorLista) {
                exibirFilmes(filmesPorLista[nomeLista], listas[nomeLista], nomeLista);
            }
        } catch (error) {
            console.error('Erro ao carregar listas:', error);
        }
    }

    async function atualizarLista(dadosFilme, tipoLista, acao) {
        const url = `${backendUrl}/api/listas`;
        let method = 'POST'; 

        if (acao === 'move') {
            method = 'PUT';
        } else if (acao === 'remove') {
            method = 'DELETE';
        }

        try {
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
                carregarListasUsuario(); 
            } else {
                const erroData = await response.json();
                console.error('Erro ao atualizar lista:', erroData.message);
                alert(`Erro: ${erroData.message}`);
            }
        } catch (error) {
            console.error('Erro de conexão ao atualizar lista:', error);
        }
    }

    // --- EVENT LISTENERS ---

    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('usuarioLogado');
        window.location.href = 'login.html';
    });

    formBusca.addEventListener('submit', (e) => {
        e.preventDefault();
        const termoBusca = inputBusca.value.trim();
        buscarFilmes(termoBusca);
    });

    btnLimparBusca.addEventListener('click', () => {
        containerResultadosBusca.innerHTML = '';
        inputBusca.value = '';
        btnLimparBusca.classList.add('oculto');
        tituloResultadosBusca.classList.add('oculto');
        inputBusca.focus();
    });

    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('.btn-adicionar-lista');
        if (!target) return;

        const card = target.closest('.card-filme');
        const tipoLista = target.dataset.listType;
        const dadosFilme = {
            movieId: card.dataset.movieId,
            movieTitle: card.dataset.movieTitle,
            posterPath: card.dataset.posterPath
        };
        
        let acao = 'add';
        if (target.classList.contains('btn-mover')) {
            acao = 'move';
        } else if (target.classList.contains('btn-remover')) {
            acao = 'remove';
        }
        
        atualizarLista(dadosFilme, tipoLista, acao);

        if (acao === 'add') {
            target.textContent = 'Adicionado!';
            target.classList.add('na-lista');
            setTimeout(() => { target.disabled = true; }, 300);
        }
    });

    // --- INICIALIZAÇÃO ---
    carregarListasUsuario();
});