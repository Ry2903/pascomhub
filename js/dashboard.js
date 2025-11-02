import { 
    verificarUsuarioLogado,
    fazerLogout,
    buscarEventos,
    buscarEvento,
    atualizarEvento,
    buscarDadosUsuario,
    atualizarHabilidades
} from './firebase-config.js';

let usuarioAtual = null;

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
verificarUsuarioLogado(async (resultado) => {
    if (!resultado.logado) {
        window.location.href = 'login.html';
        return;
    }
    
    // Verifica se é coordenador (não deve estar aqui)
    if (resultado.email === 'coord@pascompdes.com') {
        window.location.href = 'dashboardCoordenador.html';
        return;
    }
    
    // Busca dados do usuário
    const dadosResult = await buscarDadosUsuario(resultado.userId);
    console.log("📊 Resultado busca usuário:", dadosResult);
    
    if (dadosResult.sucesso) {
        usuarioAtual = {
            id: resultado.userId,
            ...dadosResult.dados
        };
        console.log("✅ Usuário carregado:", usuarioAtual);
        document.getElementById('nomeUsuario').textContent = usuarioAtual.nome;
    } else {
        console.error("❌ Erro ao carregar usuário:", dadosResult.erro);
        alert('Erro ao carregar dados do usuário: ' + dadosResult.erro);
    }
    
    // Carrega os eventos
    await carregarEventos();
});

// ===== ELEMENTOS DO DOM =====
const btnSair = document.getElementById('btnSair');
const btnAtualizarHabilidades = document.getElementById('btnAtualizarHabilidades');
const eventosGrid = document.getElementById('eventosGrid');
const modalEvento = document.getElementById('modalEvento');
const modalAtualizarHabilidades = document.getElementById('modalAtualizarHabilidades');

// ===== EVENTOS DE LOGOUT =====
btnSair.addEventListener('click', async () => {
    const confirma = confirm('Deseja realmente sair?');
    if (confirma) {
        await fazerLogout();
        window.location.href = 'login.html';
    }
});

// ===== FECHAR MODALS =====
document.getElementById('closeModalEvento').addEventListener('click', () => {
    modalEvento.classList.remove('active');
});

document.getElementById('closeModalHabilidades').addEventListener('click', () => {
    modalAtualizarHabilidades.classList.remove('active');
});

// Fechar modal clicando fora
[modalEvento, modalAtualizarHabilidades].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// ===== CARREGAR EVENTOS =====
async function carregarEventos() {
    const resultado = await buscarEventos();
    
    if (resultado.sucesso) {
        eventosGrid.innerHTML = '';
        
        if (resultado.eventos.length === 0) {
            eventosGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Nenhum evento disponível no momento.</p>';
            return;
        }
        
        resultado.eventos.forEach(evento => {
            const card = criarCardEvento(evento);
            eventosGrid.appendChild(card);
        });
    } else {
        alert(resultado.erro);
    }
}

// ===== CRIAR CARD DE EVENTO =====
function criarCardEvento(evento) {
    const card = document.createElement('div');
    card.className = 'evento-card';
    
    card.innerHTML = `
        <h3>${evento.titulo}</h3>
        <p class="evento-info"><strong>Descrição:</strong> ${evento.descricao}</p>
        <p class="evento-info"><strong>Data:</strong> ${evento.data}</p>
        <p class="evento-info"><strong>Horário:</strong> ${evento.horario}</p>
        <button class="btn-voluntariar">Voluntariar-se</button>
    `;
    
    card.querySelector('.btn-voluntariar').addEventListener('click', (e) => {
        e.stopPropagation();
        abrirModalEvento(evento);
    });
    
    card.addEventListener('click', () => {
        abrirModalEvento(evento);
    });
    
    return card;
}

// ===== ABRIR MODAL DO EVENTO =====
async function abrirModalEvento(evento) {
    // Verifica se o usuário está carregado
    if (!usuarioAtual) {
        alert('Carregando dados do usuário... Tente novamente em instantes.');
        return;
    }
    
    document.getElementById('eventoTitulo').textContent = evento.titulo;
    document.getElementById('eventoDescricao').textContent = evento.descricao;
    document.getElementById('eventoData').textContent = evento.data;
    document.getElementById('eventoHorario').textContent = evento.horario;
    
    const container = document.getElementById('funcoesContainer');
    container.innerHTML = '';
    
    for (const [categoria, funcoes] of Object.entries(evento.funcoes)) {
        const grupoDiv = document.createElement('div');
        grupoDiv.className = 'funcao-group';
        
        const titulo = document.createElement('h3');
        titulo.className = 'funcao-title';
        titulo.textContent = traduzirCategoria(categoria);
        grupoDiv.appendChild(titulo);
        
        for (const [nomeFuncao, dadosFuncao] of Object.entries(funcoes)) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'funcao-item';
            
            const nomeSpan = document.createElement('span');
            nomeSpan.className = 'funcao-nome';
            nomeSpan.textContent = traduzirFuncao(nomeFuncao);
            
            // Verifica se tem vagas disponíveis
            const vagasOcupadas = dadosFuncao.ocupadas ? dadosFuncao.ocupadas.length : 0;
            const vagasDisponiveis = dadosFuncao.vagas - vagasOcupadas;
            
            // Verifica se o usuário atual já ocupou essa função
            const usuarioJaOcupou = dadosFuncao.ocupadas && usuarioAtual && dadosFuncao.ocupadas.includes(usuarioAtual.id);
            
            const botaoDiv = document.createElement('div');
            
            if (usuarioJaOcupou) {
                // Usuário já está nessa função
                const btnOcupado = document.createElement('button');
                btnOcupado.className = 'btn-ocupado';
                btnOcupado.textContent = 'Você';
                btnOcupado.disabled = true;
                botaoDiv.appendChild(btnOcupado);
            } else if (vagasDisponiveis > 0) {
                // Tem vagas disponíveis
                const btnOcupar = document.createElement('button');
                btnOcupar.className = 'btn-ocupar';
                btnOcupar.textContent = 'Ocupar';
                btnOcupar.addEventListener('click', async () => {
                    await ocuparFuncao(evento.id, categoria, nomeFuncao);
                });
                botaoDiv.appendChild(btnOcupar);
            } else {
                // Não tem vagas disponíveis - mostra quem ocupou
                if (dadosFuncao.ocupadas && dadosFuncao.ocupadas.length > 0) {
                    for (const userId of dadosFuncao.ocupadas) {
                        const userResult = await buscarDadosUsuario(userId);
                        if (userResult.sucesso) {
                            const btnOcupado = document.createElement('button');
                            btnOcupado.className = 'btn-ocupado';
                            btnOcupado.textContent = userResult.dados.nome;
                            btnOcupado.disabled = true;
                            botaoDiv.appendChild(btnOcupado);
                        }
                    }
                }
            }
            
            itemDiv.appendChild(nomeSpan);
            itemDiv.appendChild(botaoDiv);
            grupoDiv.appendChild(itemDiv);
        }
        
        container.appendChild(grupoDiv);
    }
    
    modalEvento.classList.add('active');
}

// ===== OCUPAR FUNÇÃO =====
async function ocuparFuncao(eventoId, categoria, funcao) {
    // Verifica se o usuário está carregado
    if (!usuarioAtual) {
        alert('Erro: dados do usuário não carregados. Recarregue a página.');
        return;
    }
    
    const confirma = confirm('Deseja realmente ocupar esta função?');
    
    if (!confirma) return;
    
    const eventoResult = await buscarEvento(eventoId);
    
    if (!eventoResult.sucesso) {
        alert(eventoResult.erro);
        return;
    }
    
    const evento = eventoResult.evento;
    
    // Verifica se ainda tem vaga
    const ocupadas = evento.funcoes[categoria][funcao].ocupadas || [];
    const vagas = evento.funcoes[categoria][funcao].vagas;
    
    if (ocupadas.length >= vagas) {
        alert('Esta função já está completamente ocupada!');
        return;
    }
    
    // Verifica se o usuário já ocupou essa função
    if (ocupadas.includes(usuarioAtual.id)) {
        alert('Você já ocupou esta função!');
        return;
    }
    
    // Adiciona o usuário
    ocupadas.push(usuarioAtual.id);
    evento.funcoes[categoria][funcao].ocupadas = ocupadas;
    
    // Atualiza no Firebase
    const resultado = await atualizarEvento(eventoId, { funcoes: evento.funcoes });
    
    if (resultado.sucesso) {
        alert('Função ocupada com sucesso!');
        modalEvento.classList.remove('active');
        await carregarEventos();
    } else {
        alert(resultado.erro);
    }
}

// ===== ATUALIZAR HABILIDADES =====
btnAtualizarHabilidades.addEventListener('click', async () => {
    // Verifica se o usuário está carregado
    if (!usuarioAtual) {
        alert('Carregando dados do usuário... Tente novamente em instantes.');
        return;
    }
    
    const habilidadesPossiveis = [
        { value: 'instagram', label: 'Instagram', categoria: 'Mídias Sociais' },
        { value: 'camera-profissional', label: 'Câmera Profissional', categoria: 'Transmissão Ao-vivo' },
        { value: 'camera-movel', label: 'Câmera Móvel', categoria: 'Transmissão Ao-vivo' },
        { value: 'operador-obs', label: 'Operador OBS', categoria: 'Transmissão Ao-vivo' },
        { value: 'interacao-publico', label: 'Interação com o público', categoria: 'Transmissão Ao-vivo' },
        { value: 'fotos-profissionais', label: 'Fotografias Profissionais', categoria: 'Fotografia' },
        { value: 'fotos-celular', label: 'Fotografias com Celular', categoria: 'Fotografia' },
        { value: 'slides-07h30', label: 'Slides 07h30', categoria: 'Slides' },
        { value: 'slides-09h30', label: 'Slides 09h30', categoria: 'Slides' },
        { value: 'slides-19h', label: 'Slides 19h', categoria: 'Slides' }
    ];
    
    // Agrupa por categoria
    const categorias = {};
    habilidadesPossiveis.forEach(hab => {
        if (!categorias[hab.categoria]) {
            categorias[hab.categoria] = [];
        }
        categorias[hab.categoria].push(hab);
    });
    
    const container = document.getElementById('habilidadesContainer');
    container.innerHTML = '';
    
    for (const [categoria, habilidades] of Object.entries(categorias)) {
        const grupoDiv = document.createElement('div');
        grupoDiv.className = 'habilidade-group';
        
        const titulo = document.createElement('h4');
        titulo.className = 'habilidade-title';
        titulo.textContent = categoria;
        grupoDiv.appendChild(titulo);
        
        habilidades.forEach(hab => {
            const checked = usuarioAtual.habilidades && usuarioAtual.habilidades.includes(hab.value) ? 'checked' : '';
            
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.innerHTML = `
                <input type="checkbox" name="habilidade" value="${hab.value}" ${checked}>
                <span>${hab.label}</span>
            `;
            
            grupoDiv.appendChild(label);
        });
        
        container.appendChild(grupoDiv);
    }
    
    modalAtualizarHabilidades.classList.add('active');
});

// ===== SALVAR HABILIDADES =====
document.getElementById('formAtualizarHabilidades').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const novasHabilidades = [];
    const checkboxes = document.querySelectorAll('input[name="habilidade"]:checked');
    checkboxes.forEach(cb => novasHabilidades.push(cb.value));
    
    if (novasHabilidades.length === 0) {
        alert('Selecione pelo menos uma habilidade!');
        return;
    }
    
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Salvando...';
    
    const resultado = await atualizarHabilidades(usuarioAtual.id, novasHabilidades);
    
    if (resultado.sucesso) {
        alert('Habilidades atualizadas com sucesso!');
        usuarioAtual.habilidades = novasHabilidades;
        modalAtualizarHabilidades.classList.remove('active');
    } else {
        alert(resultado.erro);
    }
    
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Salvar Alterações';
});

// ===== FUNÇÕES AUXILIARES =====
function traduzirCategoria(categoria) {
    const traducoes = {
        'midias-sociais': 'Mídias Sociais',
        'transmissao': 'Transmissão Ao-vivo',
        'fotografia': 'Fotografia',
        'slides': 'Slides'
    };
    return traducoes[categoria] || categoria;
}

function traduzirFuncao(funcao) {
    const traducoes = {
        'postagens': 'Postagens',
        'camera-central': 'Câmera Central',
        'camera-movel': 'Câmera Móvel',
        'operador-obs': 'Operador OBS',
        'interacao-publico': 'Interação com o público',
        '07h30': '07h30',
        '09h30': '09h30',
        '19h': '19h'
    };
    return traducoes[funcao] || funcao;
}