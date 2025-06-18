// home.js

document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES E VARIÁVEIS GLOBAIS ---
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutBtn = document.getElementById('logout-btn');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const searchResultsTitle = document.getElementById('search-results-title');

    const lists = {
        assistir: document.getElementById('list-assistir'),
        assistidos: document.getElementById('list-assistidos'),
        favoritos: document.getElementById('list-favoritos')
    };
    
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const backendUrl = 'http://localhost:3000';
    
    // const tmdbApiKey = 'adf31f5a689f9d3c8c0e9ac55fc8e70a'; // REMOVIDO: Chave agora está no backend
    const tmdbImageUrl = 'https://image.tmdb.org/t/p/w500';

    // --- VERIFICAÇÃO DE LOGIN ---
    if (!usuarioLogado) {
        window.location.href = 'login.html';
        return;
    }
    welcomeMessage.textContent = `Bem-vindo(a), ${usuarioLogado.nome}!`;

    // --- FUNÇÕES PRINCIPAIS ---

    // ALTERADO: Busca filmes através do nosso backend
    async function searchMovies(query) {
        if (!query) return;
        
        const url = `${backendUrl}/api/search?query=${encodeURIComponent(query)}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            // A API do TMDb aninha os resultados em uma propriedade 'results'
            displayMovies(data.results, searchResultsContainer);
        } catch (error) {
            console.error('Erro ao buscar filmes:', error);
            searchResultsContainer.innerHTML = '<p class="empty-list-message">Erro ao buscar resultados. Tente novamente.</p>';
        }
    }

    function displayMovies(movies, container, listName = null) {
        container.innerHTML = '';
        
        if (container === searchResultsContainer) {
            const hasResults = movies && movies.length > 0;
            clearSearchBtn.classList.toggle('hidden', !hasResults);
            searchResultsTitle.classList.toggle('hidden', !hasResults);
        }
        
        if (!movies || movies.length === 0) {
            if (listName) {
                container.innerHTML = `<p class="empty-list-message">Sua lista está vazia.</p>`;
            }
            return;
        }

        movies.forEach(movie => {
            const movieId = movie.id_filme || movie.id;
            const movieTitle = movie.titulo_filme || movie.title;
            const posterPath = movie.poster_path;
            const imageUrl = posterPath ? `${tmdbImageUrl}${posterPath}` : 'https://via.placeholder.com/500x750?text=Sem+Imagem';

            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.dataset.movieId = movieId;
            movieCard.dataset.movieTitle = movieTitle;
            movieCard.dataset.posterPath = posterPath;

            movieCard.innerHTML = `
                <img src="${imageUrl}" alt="Pôster de ${movieTitle}">
                <div class="movie-info">
                    <h3>${movieTitle}</h3>
                    <div class="movie-actions">
                        ${getButtonsHTML(listName, movieId)}
                    </div>
                </div>
            `;
            container.appendChild(movieCard);
        });
    }

    // ALTERADO: Gera botões de "Mover" para filmes que já estão em uma lista
    function getButtonsHTML(listName, movieId) {
        if (listName) { // Se o filme já está numa lista...
            const allLists = {
                assistir: 'Quero Assistir',
                assistidos: 'Já Assisti',
                favoritos: 'Favoritos'
            };
            let buttonsHTML = '';

            // Adiciona botões para mover para as outras listas
            for (const key in allLists) {
                if (key !== listName) {
                    buttonsHTML += `<button class="btn-add-list btn-move" data-list-type="${key}"><i class="fa-solid fa-arrow-right-arrow-left"></i> Mover para ${allLists[key]}</button>`;
                }
            }

            // Adiciona o botão de remover
            buttonsHTML += `<button class="btn-add-list btn-remove" data-list-type="${listName}"><i class="fa-solid fa-trash"></i> Remover</button>`;
            return buttonsHTML;

        } else { // Se for um filme da busca, mostra os botões de adicionar
            return `
                <button class="btn-add-list" data-list-type="assistir"><i class="fa-solid fa-list-ul"></i> Quero Assistir</button>
                <button class="btn-add-list" data-list-type="assistidos"><i class="fa-solid fa-check"></i> Já Assisti</button>
                <button class="btn-add-list" data-list-type="favoritos"><i class="fa-solid fa-star"></i> Favoritos</button>
            `;
        }
    }

    async function loadUserLists() {
        try {
            const response = await fetch(`${backendUrl}/api/listas/${usuarioLogado.id}`);
            const userMovies = await response.json();
            
            Object.values(lists).forEach(list => list.innerHTML = '');

            const moviesByList = { assistir: [], assistidos: [], favoritos: [] };
            userMovies.forEach(movie => {
                if (moviesByList[movie.tipo_lista]) {
                    moviesByList[movie.tipo_lista].push(movie);
                }
            });

            for (const listName in moviesByList) {
                displayMovies(moviesByList[listName], lists[listName], listName);
            }
        } catch (error) {
            console.error('Erro ao carregar listas:', error);
        }
    }

    // ALTERADO: Função unificada para adicionar, mover (update) e remover filmes
    async function updateList(movieData, listType, action) {
        const url = `${backendUrl}/api/listas`;
        let method = 'POST'; // Padrão para 'add'

        if (action === 'move') {
            method = 'PUT';
        } else if (action === 'remove') {
            method = 'DELETE';
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_usuario: usuarioLogado.id,
                    id_filme: movieData.movieId,
                    titulo_filme: movieData.movieTitle,
                    poster_path: movieData.posterPath,
                    tipo_lista: listType
                })
            });

            if (response.ok) {
                loadUserLists(); 
            } else {
                const errorData = await response.json();
                console.error('Erro ao atualizar lista:', errorData.message);
                alert(`Erro: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Erro de conexão ao atualizar lista:', error);
        }
    }

    // --- EVENT LISTENERS ---

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('usuarioLogado');
        window.location.href = 'login.html';
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchTerm = searchInput.value.trim();
        searchMovies(searchTerm);
    });

    clearSearchBtn.addEventListener('click', () => {
        searchResultsContainer.innerHTML = '';
        searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        searchResultsTitle.classList.add('hidden');
        searchInput.focus();
    });

    // ALTERADO: Listener de clique para lidar com 'add', 'move' e 'remove'
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('.btn-add-list');
        if (!target) return;

        const card = target.closest('.movie-card');
        const listType = target.dataset.listType;
        const movieData = {
            movieId: card.dataset.movieId,
            movieTitle: card.dataset.movieTitle,
            posterPath: card.dataset.posterPath
        };
        
        let action = 'add'; // Ação padrão
        if (target.classList.contains('btn-move')) {
            action = 'move';
        } else if (target.classList.contains('btn-remove')) {
            action = 'remove';
        }
        
        updateList(movieData, listType, action);

        // Feedback visual apenas para a ação de adicionar
        if (action === 'add') {
            target.textContent = 'Adicionado!';
            target.classList.add('in-list');
            setTimeout(() => { target.disabled = true; }, 300);
        }
    });

    // --- INICIALIZAÇÃO ---
    loadUserLists();
});