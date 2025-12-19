import { verificarUsuarioLogado, fazerLogout } from './firebase-config.js';
import { 
    uploadArquivo, 
    buscarArquivos, 
    excluirArquivo,
    formatarTamanho,
    validarTipoArquivo
} from './supabase-config.js';

let usuarioAtual = null;
let arquivoSelecionado = null;

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
verificarUsuarioLogado(async (resultado) => {
    if (!resultado.logado) {
        window.location.href = 'login.html';
        return;
    }
    
    // Verifica se é coordenador
    if (resultado.email !== 'coord@pascompdes.com') {
        window.location.href = 'arquivos.html'; // Redireciona para tela de membro
        return;
    }
    
    usuarioAtual = { id: resultado.userId, email: resultado.email };
    
    // Carrega arquivos
    await carregarArquivos();
});

// ===== ELEMENTOS DO DOM =====
const btnSair = document.getElementById('btnSair');
const btnPainelControle = document.getElementById('btnPainelControle');
const btnAdicionarArquivo = document.getElementById('btnAdicionarArquivo');
const arquivosGrid = document.getElementById('arquivosGrid');
const modalUpload = document.getElementById('modalUpload');
const uploadArea = document.getElementById('uploadArea');
const arquivoInput = document.getElementById('arquivoInput');
const formUpload = document.getElementById('formUpload');

// ===== NAVEGAÇÃO =====
btnSair.addEventListener('click', async () => {
    const confirma = confirm('Deseja realmente sair?');
    if (confirma) {
        await fazerLogout();
        window.location.href = 'login.html';
    }
});

btnPainelControle.addEventListener('click', () => {
    window.location.href = 'dashboardCoordenador.html';
});

btnArquivos.addEventListener('click', () => {
    window.location.href = 'arquivosCoordenador.html';
});


// ===== ABRIR MODAL DE UPLOAD =====
btnAdicionarArquivo.addEventListener('click', () => {
    modalUpload.classList.add('active');
    formUpload.reset();
    arquivoSelecionado = null;
    document.getElementById('arquivoSelecionado').style.display = 'none';
});

// ===== FECHAR MODAL =====
document.getElementById('closeModalUpload').addEventListener('click', () => {
    modalUpload.classList.remove('active');
});

modalUpload.addEventListener('click', (e) => {
    if (e.target === modalUpload) {
        modalUpload.classList.remove('active');
    }
});

// ===== ÁREA DE UPLOAD - CLIQUE =====
uploadArea.addEventListener('click', () => {
    arquivoInput.click();
});

// ===== SELEÇÃO DE ARQUIVO =====
arquivoInput.addEventListener('change', (e) => {
    const arquivo = e.target.files[0];
    if (arquivo) {
        processarArquivo(arquivo);
    }
});

// ===== DRAG AND DROP =====
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const arquivo = e.dataTransfer.files[0];
    if (arquivo) {
        processarArquivo(arquivo);
    }
});

// ===== PROCESSAR ARQUIVO =====
function processarArquivo(arquivo) {
    // Valida tipo
    if (!validarTipoArquivo(arquivo)) {
        alert('Tipo de arquivo não permitido! Use: PDF, PPTX, JPG, PNG ou GIF');
        return;
    }
    
    // Valida tamanho (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB em bytes
    if (arquivo.size > maxSize) {
        alert('Arquivo muito grande! Tamanho máximo: 50MB');
        return;
    }
    
    arquivoSelecionado = arquivo;
    
    // Mostra informações
    document.getElementById('nomeArquivoSelecionado').textContent = arquivo.name;
    document.getElementById('tamanhoArquivo').textContent = formatarTamanho(arquivo.size);
    document.getElementById('arquivoSelecionado').style.display = 'flex';
}

// ===== FAZER UPLOAD =====
formUpload.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!arquivoSelecionado) {
        alert('Selecione um arquivo primeiro!');
        return;
    }
    
    const nomeExibicao = document.getElementById('nomeExibicao').value;
    const btnSubmit = document.getElementById('btnFazerUpload');
    
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Fazendo upload...';
    
    const resultado = await uploadArquivo(arquivoSelecionado, nomeExibicao, usuarioAtual.id);
    
    if (resultado.sucesso) {
        alert('Arquivo enviado com sucesso!');
        modalUpload.classList.remove('active');
        await carregarArquivos();
    } else {
        alert('Erro ao fazer upload: ' + resultado.erro);
    }
    
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Fazer Upload';
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
            <button class="btn-excluir-arquivo" data-id="${arquivo.id}" data-nome-arquivo="${arquivo.nomeArquivo}">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        </div>
    `;
    
    // Botão Download
    card.querySelector('.btn-download').addEventListener('click', (e) => {
        const url = e.currentTarget.dataset.url;
        const nome = e.currentTarget.dataset.nome;
        baixarArquivo(url, nome);
    });
    
    // Botão Excluir
    card.querySelector('.btn-excluir-arquivo').addEventListener('click', async (e) => {
        const arquivoId = e.currentTarget.dataset.id;
        const nomeArquivo = e.currentTarget.dataset.nomeArquivo;
        
        const confirma = confirm('Deseja realmente excluir este arquivo?');
        if (confirma) {
            const resultado = await excluirArquivo(arquivoId, nomeArquivo);
            if (resultado.sucesso) {
                alert('Arquivo excluído com sucesso!');
                await carregarArquivos();
            } else {
                alert('Erro ao excluir arquivo: ' + resultado.erro);
            }
        }
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