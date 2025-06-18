// frontend/login.js
document.addEventListener('DOMContentLoaded', () => {
    // Seletores para as telas
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const forgotPasswordScreen = document.getElementById('forgot-password-screen');

    // Seletores para links de navegação
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const showForgotPasswordLink = document.getElementById('show-forgot-password');
    const backToLoginLink = document.getElementById('back-to-login');

    // Elementos do formulário de Login
    const loginEmailInput = loginScreen.querySelector('input[type="email"]');
    const loginPasswordInput = document.getElementById('login-password');
    const toggleLoginPassword = document.getElementById('toggle-login-password');
    const loginButton = loginScreen.querySelector('.btn-primary');
    const loginSubText = loginScreen.querySelector('.sub-text');

    // Elementos do formulário de Cadastro
    const registerNameInput = registerScreen.querySelector('input[type="text"]');
    const registerEmailInput = registerScreen.querySelector('input[type="email"]');
    const registerPasswordInput = document.getElementById('register-password');
    const toggleRegisterPassword = document.getElementById('toggle-register-password');
    const registerButton = registerScreen.querySelector('.btn-primary');
    const registerSubText = registerScreen.querySelector('.sub-text');
    
    // Elementos da tela de Redefinição de Senha
    const emailStep = document.getElementById('email-step');
    const passwordStep = document.getElementById('password-step');
    const forgotEmailInput = document.getElementById('forgot-email');
    const verifyEmailBtn = document.getElementById('verify-email-btn');
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');
    const resetPasswordBtn = document.getElementById('reset-password-btn');
    const forgotSubText = forgotPasswordScreen.querySelector('.sub-text');
    const toggleNewPassword = document.getElementById('toggle-new-password');
    const toggleConfirmPassword = document.getElementById('toggle-confirm-password');

    let validatedEmail = '';
    const backendUrl = 'http://localhost:3000';

    // FUNÇÕES AUXILIARES
    function setActiveScreen(activeScreen) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        if (activeScreen) activeScreen.classList.add('active');
        
        emailStep.style.display = 'flex';
        passwordStep.style.display = 'none';
        forgotSubText.textContent = 'Insira seu e-mail para validação.';
        forgotSubText.style.color = '#E0E0E0';
        newPasswordInput.value = '';
        confirmNewPasswordInput.value = '';
        forgotEmailInput.value = '';
    }

    function showMessage(element, message, isError = false) {
        if (element) {
            element.textContent = message;
            element.style.color = isError ? '#FFCDD2' : '#A5D6A7';
        }
    }

    function togglePasswordVisibility(input, toggleIcon) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        toggleIcon.classList.toggle('fa-eye');
        toggleIcon.classList.toggle('fa-eye-slash');
    }

    function addEnterKeyListener(inputs, button) {
        const inputArray = Array.isArray(inputs) ? inputs : [inputs];
        inputArray.forEach(input => {
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    button.click();
                }
            });
        });
    }

    // --- EVENT LISTENERS (OUVINTES DE EVENTOS) ---

    if (loginScreen) setActiveScreen(loginScreen);
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); setActiveScreen(registerScreen); });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); setActiveScreen(loginScreen); });
    backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); setActiveScreen(loginScreen); });
    showForgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); setActiveScreen(forgotPasswordScreen); });
    
    toggleLoginPassword.addEventListener('click', () => togglePasswordVisibility(loginPasswordInput, toggleLoginPassword));
    toggleRegisterPassword.addEventListener('click', () => togglePasswordVisibility(registerPasswordInput, toggleRegisterPassword));
    toggleNewPassword.addEventListener('click', () => togglePasswordVisibility(newPasswordInput, toggleNewPassword));
    toggleConfirmPassword.addEventListener('click', () => togglePasswordVisibility(confirmNewPasswordInput, toggleConfirmPassword));

    loginButton.addEventListener('click', async () => {
        const email = loginEmailInput.value.trim();
        const senha = loginPasswordInput.value.trim();

        if (!email || !senha) {
            return showMessage(loginSubText, 'Por favor, preencha email e senha.', true);
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
                showMessage(loginSubText, `Login bem-sucedido! Redirecionando...`);
                loginEmailInput.value = ''; 
                loginPasswordInput.value = '';
                setTimeout(() => { window.location.href = 'home.html'; }, 500);
            } else {
                showMessage(loginSubText, data.message || 'Credenciais inválidas.', true);
                loginEmailInput.value = '';
                loginPasswordInput.value = '';
            }
        } catch (error) {
            showMessage(loginSubText, 'Não foi possível conectar ao servidor.', true);
        }
    });

    registerButton.addEventListener('click', async () => {
        const nome = registerNameInput.value.trim();
        const email = registerEmailInput.value.trim();
        const senha = registerPasswordInput.value.trim();

        if (!nome || !email || !senha) {
            return showMessage(registerSubText, 'Por favor, preencha todos os campos.', true);
        }

        try {
            const response = await fetch(`${backendUrl}/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha }),
            });
            const data = await response.json();

            if (response.status === 201) {
                showMessage(registerSubText, data.message || 'Cadastro realizado com sucesso!');
                registerNameInput.value = '';
                registerEmailInput.value = '';
                registerPasswordInput.value = '';
                setTimeout(() => setActiveScreen(loginScreen), 500); 
            } else {
                showMessage(registerSubText, data.message || 'Erro ao tentar cadastrar.', true);
            }
        } catch (error) {
            showMessage(registerSubText, 'Não foi possível conectar ao servidor.', true);
        }
    });

    verifyEmailBtn.addEventListener('click', async () => {
        const email = forgotEmailInput.value.trim();
        if (!email) {
            return showMessage(forgotSubText, 'Por favor, insira um e-mail.', true);
        }

        try {
            const response = await fetch(`${backendUrl}/verificar-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();

            if (response.ok) {
                validatedEmail = email;
                showMessage(forgotSubText, 'E-mail validado! Por favor, insira sua nova senha.');
                emailStep.style.display = 'none';
                passwordStep.style.display = 'flex';
            } else {
                showMessage(forgotSubText, data.message || 'E-mail não encontrado.', true);
            }
        } catch (error) {
            showMessage(forgotSubText, 'Não foi possível conectar ao servidor.', true);
        }
    });

    resetPasswordBtn.addEventListener('click', async () => {
        const novaSenha = newPasswordInput.value;
        const confirmaSenha = confirmNewPasswordInput.value;

        // Função auxiliar para lidar com erros, limpar campos e mostrar mensagem
        const handleError = (message) => {
            showMessage(forgotSubText, message, true);
            newPasswordInput.value = '';
            confirmNewPasswordInput.value = '';
        };

        if (!novaSenha || !confirmaSenha) {
            return handleError('Por favor, preencha ambos os campos de senha.');
        }

        if (novaSenha.length < 6) {
            return handleError('A nova senha deve ter pelo menos 6 caracteres.');
        }

        if (novaSenha !== confirmaSenha) {
            return handleError('As senhas não coincidem.');
        }

        try {
            const response = await fetch(`${backendUrl}/redefinir-senha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: validatedEmail, novaSenha }),
            });
            const data = await response.json();

            if (response.ok) {
                showMessage(forgotSubText, data.message || 'Senha redefinida com sucesso!');
                setTimeout(() => setActiveScreen(loginScreen), 500);
            } else {
                handleError(data.message || 'Ocorreu um erro ao redefinir a senha.');
            }
        } catch (error) {
            handleError('Não foi possível conectar ao servidor.');
        }
    });

    addEnterKeyListener([loginEmailInput, loginPasswordInput], loginButton);
    addEnterKeyListener([registerNameInput, registerEmailInput, registerPasswordInput], registerButton);
    addEnterKeyListener(forgotEmailInput, verifyEmailBtn);
    addEnterKeyListener([newPasswordInput, confirmNewPasswordInput], resetPasswordBtn);
});