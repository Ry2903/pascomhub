import { verificarUsuarioLogado, fazerLogout } from './firebase-config.js';
import { buscarArquivos, formatarTamanho } from './supabase-config.js';

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
verificarUsuarioLogado(async (resultado) => {
    if (!resultado.logado) {
        window.location.href = 'login.html';
        return;
    }
    
    // Verifica se é coordenador (redireciona para tela correta)
    if (resultado.email === 'coord@pascompdes.com') {
        window.location.href = 'arquivosCoordenador.html';
        return;
    }
    
    // Carrega arquivos
    await carregarArquivos();
});

// ===== ELEMENTOS DO DOM =====
const btnSair = document.getElementById('btnSair');
const btnAtualizarHabilidades = document.getElementById('btnAtualizarHabilidades');
const arquivosGrid = document.getElementById('arquivosGrid');

// ===== NAVEGAÇÃO =====
btnSair.addEventListener('click', async () => {
    const confirma = confirm('Deseja realmente sair?');
    if (confirma) {
        await fazerLogout();
        window.location.href = 'login.html';
    }
});

btnAtualizarHabilidades.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
});

btnArquivos.addEventListener('click', () => {
    window.location.href = 'arquivos.html';
});

// ===== CARREGAR ARQUIVOS =====
async function carregarArquivos() {
    const resultado = await buscarArquivos();
    
    if (resultado.sucesso) {
        arquivosGrid.innerHTML = '';
        
        if (resultado.arquivos.length === 0) {
            arquivosGrid.innerHTML = '<div class="mensagem-vazia">Nenhum arquivo disponível ainda.</div>';
            return;
        }
        
        resultado.arquivos.forEach(arquivo => {
            const card = criarCardArquivo(arquivo);
            arquivosGrid.appendChild(card);
        });
    } else {
        alert('Erro ao carregar arquivos: ' + resultado.erro);
    }
}

// ===== CRIAR CARD DE ARQUIVO =====
function criarCardArquivo(arquivo) {
    const card = document.createElement('div');
    card.className = 'arquivo-card';
    
    const dataFormatada = new Date(arquivo.criadoEm).toLocaleDateString('pt-BR');
    
    card.innerHTML = `
        <div class="arquivo-header">
            <h3 class="arquivo-nome">${arquivo.nomeExibicao}</h3>
        </div>
        <p class="arquivo-info"><strong>Arquivo:</strong> ${arquivo.nomeOriginal}</p>
        <p class="arquivo-info"><strong>Data:</strong> ${dataFormatada}</p>
        <p class="arquivo-info"><strong>Tamanho:</strong> ${formatarTamanho(arquivo.tamanho)}</p>
        <span class="arquivo-tipo">${arquivo.extensao}</span>
        <div class="arquivo-buttons">
            <button class="btn-download" data-url="${arquivo.url}" data-nome="${arquivo.nomeOriginal}">
                <i class="fa-solid fa-floppy-disk"></i>
                Fazer Download
            </button>
        </div>
    `;
    
    // Botão Download
    card.querySelector('.btn-download').addEventListener('click', (e) => {
        const url = e.currentTarget.dataset.url;
        const nome = e.currentTarget.dataset.nome;
        baixarArquivo(url, nome);
    });
    
    return card;
}

// ===== BAIXAR ARQUIVO =====
function baixarArquivo(url, nome) {
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}