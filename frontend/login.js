// frontend/login.js
document.addEventListener('DOMContentLoaded', () => {
    // Seletores para as telas
    const telaLogin = document.getElementById('tela-login');
    const telaCadastro = document.getElementById('tela-cadastro');
    const telaEsqueceuSenha = document.getElementById('tela-esqueceu-senha');

    // Seletores para links de navegação
    const mostrarCadastroLink = document.getElementById('mostrar-cadastro');
    const mostrarLoginLink = document.getElementById('mostrar-login');
    const mostrarEsqueceuSenhaLink = document.getElementById('mostrar-esqueceu-senha');
    const voltarParaLoginLink = document.getElementById('voltar-para-login');

    // Elementos do formulário de Login
    const loginEmailInput = telaLogin.querySelector('input[type="email"]');
    const loginSenhaInput = document.getElementById('senha-login');
    const alternaSenhaLogin = document.getElementById('alterna-senha-login');
    const loginBotao = telaLogin.querySelector('.btn-primario');
    const loginSubTexto = telaLogin.querySelector('.sub-texto');

    // Elementos do formulário de Cadastro
    const cadastroNomeInput = telaCadastro.querySelector('input[type="text"]');
    const cadastroEmailInput = telaCadastro.querySelector('input[type="email"]');
    const cadastroSenhaInput = document.getElementById('senha-cadastro');
    const alternaSenhaCadastro = document.getElementById('alterna-senha-cadastro');
    const cadastroBotao = telaCadastro.querySelector('.btn-primario');
    const cadastroSubTexto = telaCadastro.querySelector('.sub-texto');
    
    // Elementos da tela de Redefinição de Senha
    const etapaEmail = document.getElementById('etapa-email');
    const etapaSenha = document.getElementById('etapa-senha');
    const esqueceuEmailInput = document.getElementById('email-esquecido');
    const verificarEmailBtn = document.getElementById('btn-verificar-email');
    const novaSenhaInput = document.getElementById('nova-senha');
    const confirmarNovaSenhaInput = document.getElementById('confirmar-nova-senha');
    const redefinirSenhaBtn = document.getElementById('btn-redefinir-senha');
    const esqueceuSubTexto = telaEsqueceuSenha.querySelector('.sub-texto');
    const alternaNovaSenha = document.getElementById('alterna-nova-senha');
    const alternaConfirmarSenha = document.getElementById('alterna-confirmar-senha');

    let emailValidado = '';
    const backendUrl = 'http://localhost:3000';

    // FUNÇÕES AUXILIARES
    function definirTelaAtiva(telaAtiva) {
        document.querySelectorAll('.tela').forEach(screen => screen.classList.remove('ativo'));
        if (telaAtiva) telaAtiva.classList.add('ativo');
        
        etapaEmail.style.display = 'flex';
        etapaSenha.style.display = 'none';
        esqueceuSubTexto.textContent = 'Insira seu e-mail para validação.';
        esqueceuSubTexto.style.color = '#E0E0E0';
        novaSenhaInput.value = '';
        confirmarNovaSenhaInput.value = '';
        esqueceuEmailInput.value = '';
    }

    function mostrarMensagem(elemento, mensagem, isErro = false) {
        if (elemento) {
            elemento.textContent = mensagem;
            elemento.style.color = isErro ? '#FFCDD2' : '#A5D6A7';
        }
    }

    function alternarVisibilidadeSenha(input, icone) {
        const tipo = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', tipo);
        icone.classList.toggle('fa-eye');
        icone.classList.toggle('fa-eye-slash');
    }

    function adicionarOuvinteEnter(inputs, botao) {
        const inputArray = Array.isArray(inputs) ? inputs : [inputs];
        inputArray.forEach(input => {
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    botao.click();
                }
            });
        });
    }

    // --- EVENT LISTENERS (OUVINTES DE EVENTOS) ---

    if (telaLogin) definirTelaAtiva(telaLogin);
    mostrarCadastroLink.addEventListener('click', (e) => { e.preventDefault(); definirTelaAtiva(telaCadastro); });
    mostrarLoginLink.addEventListener('click', (e) => { e.preventDefault(); definirTelaAtiva(telaLogin); });
    voltarParaLoginLink.addEventListener('click', (e) => { e.preventDefault(); definirTelaAtiva(telaLogin); });
    mostrarEsqueceuSenhaLink.addEventListener('click', (e) => { e.preventDefault(); definirTelaAtiva(telaEsqueceuSenha); });
    
    alternaSenhaLogin.addEventListener('click', () => alternarVisibilidadeSenha(loginSenhaInput, alternaSenhaLogin));
    alternaSenhaCadastro.addEventListener('click', () => alternarVisibilidadeSenha(cadastroSenhaInput, alternaSenhaCadastro));
    alternaNovaSenha.addEventListener('click', () => alternarVisibilidadeSenha(novaSenhaInput, alternaNovaSenha));
    alternaConfirmarSenha.addEventListener('click', () => alternarVisibilidadeSenha(confirmarNovaSenhaInput, alternaConfirmarSenha));

    loginBotao.addEventListener('click', async () => {
        const email = loginEmailInput.value.trim();
        const senha = loginSenhaInput.value.trim();

        if (!email || !senha) {
            return mostrarMensagem(loginSubTexto, 'Por favor, preencha email e senha.', true);
        }

        try {
             const response = await fetch(`${backendUrl}/logar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario)); 
                mostrarMensagem(loginSubTexto, `Login bem-sucedido! Redirecionando...`);
                loginEmailInput.value = ''; 
                loginSenhaInput.value = '';
                setTimeout(() => { window.location.href = 'home.html'; }, 500);
            } else {
                mostrarMensagem(loginSubTexto, data.message || 'Credenciais inválidas.', true);
                loginEmailInput.value = '';
                loginSenhaInput.value = '';
            }
        } catch (error) {
            mostrarMensagem(loginSubTexto, 'Não foi possível conectar ao servidor.', true);
        }
    });

    cadastroBotao.addEventListener('click', async () => {
        const nome = cadastroNomeInput.value.trim();
        const email = cadastroEmailInput.value.trim();
        const senha = cadastroSenhaInput.value.trim();
        const emailRegex = /^.{4,}@gmail\.com$/;

        if (!nome || !email || !senha) {
            return mostrarMensagem(cadastroSubTexto, 'Por favor, preencha todos os campos.', true);
        }
        
        if (!emailRegex.test(email)) {
            return mostrarMensagem(cadastroSubTexto, 'Formato de e-mail inválido. Use o formato xxxx@gmail.com (pelo menos 4 caracteres).', true);
        }

        try {
            const response = await fetch(`${backendUrl}/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha }),
            });
            const data = await response.json();

            if (response.status === 201) {
                mostrarMensagem(cadastroSubTexto, data.message || 'Cadastro realizado com sucesso!');
                cadastroNomeInput.value = '';
                cadastroEmailInput.value = '';
                cadastroSenhaInput.value = '';
                setTimeout(() => definirTelaAtiva(telaLogin), 500); 
            } else {
                mostrarMensagem(cadastroSubTexto, data.message || 'Erro ao tentar cadastrar.', true);
            }
        } catch (error) {
            mostrarMensagem(cadastroSubTexto, 'Não foi possível conectar ao servidor.', true);
        }
    });

    verificarEmailBtn.addEventListener('click', async () => {
        const email = esqueceuEmailInput.value.trim();
        const emailRegex = /^.{4,}@gmail\.com$/;

        if (!email) {
            return mostrarMensagem(esqueceuSubTexto, 'Por favor, insira um e-mail.', true);
        }

        if (!emailRegex.test(email)) {
            return mostrarMensagem(esqueceuSubTexto, 'Formato de e-mail inválido. Use o formato xxxx@gmail.com (pelo menos 4 caracteres).', true);
        }

        try {
            const response = await fetch(`${backendUrl}/verificar-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();

            if (response.ok) {
                emailValidado = email;
                mostrarMensagem(esqueceuSubTexto, 'E-mail validado! Por favor, insira sua nova senha.');
                etapaEmail.style.display = 'none';
                etapaSenha.style.display = 'flex';
            } else {
                mostrarMensagem(esqueceuSubTexto, data.message || 'E-mail não encontrado.', true);
            }
        } catch (error) {
            mostrarMensagem(esqueceuSubTexto, 'Não foi possível conectar ao servidor.', true);
        }
    });

    redefinirSenhaBtn.addEventListener('click', async () => {
        const novaSenha = novaSenhaInput.value;
        const confirmaSenha = confirmarNovaSenhaInput.value;

        const lidarComErro = (mensagem) => {
            mostrarMensagem(esqueceuSubTexto, mensagem, true);
            novaSenhaInput.value = '';
            confirmarNovaSenhaInput.value = '';
        };

        if (!novaSenha || !confirmaSenha) {
            return lidarComErro('Por favor, preencha ambos os campos de senha.');
        }
        if (novaSenha.length < 6) {
            return lidarComErro('A nova senha deve ter pelo menos 6 caracteres.');
        }
        if (novaSenha !== confirmaSenha) {
            return lidarComErro('As senhas não coincidem.');
        }

        try {
            const response = await fetch(`${backendUrl}/redefinir-senha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailValidado, novaSenha }),
            });
            const data = await response.json();

            if (response.ok) {
                mostrarMensagem(esqueceuSubTexto, data.message || 'Senha redefinida com sucesso!');
                setTimeout(() => definirTelaAtiva(telaLogin), 500);
            } else {
                lidarComErro(data.message || 'Ocorreu um erro ao redefinir a senha.');
            }
        } catch (error) {
            lidarComErro('Não foi possível conectar ao servidor.');
        }
    });

    adicionarOuvinteEnter([loginEmailInput, loginSenhaInput], loginBotao);
    adicionarOuvinteEnter([cadastroNomeInput, cadastroEmailInput, cadastroSenhaInput], cadastroBotao);
    adicionarOuvinteEnter(esqueceuEmailInput, verificarEmailBtn);
    adicionarOuvinteEnter([novaSenhaInput, confirmarNovaSenhaInput], redefinirSenhaBtn);
});