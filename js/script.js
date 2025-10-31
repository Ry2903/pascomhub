import { 
    cadastrarUsuario, 
    fazerLogin, 
    verificarUsuarioLogado 
} from './firebase-config.js';

// Função para alternar visualização de senha
document.addEventListener('DOMContentLoaded', function() {
    const togglePassword = document.getElementById('togglePassword');
    
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const senhaInput = document.getElementById('senha');
            const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            senhaInput.setAttribute('type', type);
            
            // Alterna o ícone (olho aberto/fechado)
            const svg = this.querySelector('svg');
            if (type === 'text') {
                // Ícone de olho fechado
                svg.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                // Ícone de olho aberto
                svg.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        });
    }
    
    // Verifica se o usuário já está logado
    verificarUsuarioLogado((resultado) => {
        if (resultado.logado) {
            // Se estiver na página de login ou cadastro, redireciona para dashboard
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname.includes('cadastro.html')) {
                window.location.href = 'dashboard.html';
            }
        }
    });
});

// ========================================
// FUNÇÃO DE LOGIN
// ========================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const btnEntrar = loginForm.querySelector('button[type="submit"]');
        
        // Desabilita o botão enquanto processa
        btnEntrar.disabled = true;
        btnEntrar.textContent = 'Entrando...';
        
        try {
            const resultado = await fazerLogin(email, senha);
            
            if (resultado.sucesso) {
                alert('Login realizado com sucesso!');
                // Redireciona baseado no tipo de usuário
                if (email === 'coord@pascompdes.com') {
                    window.location.href = 'dashboardCoordenador.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                alert(resultado.erro);
                btnEntrar.disabled = false;
                btnEntrar.textContent = 'Entrar';
            }
        } catch (error) {
            console.error('Erro inesperado:', error);
            alert('Erro ao fazer login. Tente novamente.');
            btnEntrar.disabled = false;
            btnEntrar.textContent = 'Entrar';
        }
    });
}

// ========================================
// FUNÇÃO DE CADASTRO
// ========================================
const cadastroForm = document.getElementById('cadastroForm');
if (cadastroForm) {
    cadastroForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        
        // Pega todas as habilidades selecionadas
        const habilidades = [];
        const checkboxes = document.querySelectorAll('input[name="habilidade"]:checked');
        checkboxes.forEach(checkbox => {
            habilidades.push(checkbox.value);
        });
        
        // Validação básica
        if (habilidades.length === 0) {
            alert('Selecione pelo menos uma habilidade!');
            return;
        }
        
        const btnCriar = cadastroForm.querySelector('button[type="submit"]');
        
        // Desabilita o botão enquanto processa
        btnCriar.disabled = true;
        btnCriar.textContent = 'Criando conta...';
        
        try {
            const resultado = await cadastrarUsuario(email, senha, nome, habilidades);
            
            if (resultado.sucesso) {
                alert('Cadastro realizado com sucesso!');
                // Redireciona para o dashboard
                window.location.href = 'dashboard.html';
            } else {
                alert(resultado.erro);
                btnCriar.disabled = false;
                btnCriar.textContent = 'Criar Conta';
            }
        } catch (error) {
            console.error('Erro inesperado:', error);
            alert('Erro ao criar conta. Tente novamente.');
            btnCriar.disabled = false;
            btnCriar.textContent = 'Criar Conta';
        }
    });
}