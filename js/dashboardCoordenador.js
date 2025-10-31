import { 
    verificarUsuarioLogado,
    fazerLogout,
    buscarEventos,
    criarEvento,
    buscarTodosUsuarios,
    cadastrarUsuario,
    atualizarHabilidades,
    excluirUsuario
} from './firebase-config.js';

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
verificarUsuarioLogado(async (resultado) => {
    if (!resultado.logado) {
        window.location.href = 'login.html';
        return;
    }
    
    // Verifica se é coordenador
    if (resultado.email !== 'coord@pascompdes.com') {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Carrega os eventos
    await carregarEventos();
});

// ===== ELEMENTOS DO DOM =====
const btnSair = document.getElementById('btnSair');
const btnPainelControle = document.getElementById('btnPainelControle');
const btnAdicionarEvento = document.getElementById('btnAdicionarEvento');
const eventosGrid = document.getElementById('eventosGrid');

// Modals
const modalTipoEvento = document.getElementById('modalTipoEvento');
const modalCriarEvento = document.getElementById('modalCriarEvento');
const modalCriarMissa = document.getElementById('modalCriarMissa');
const modalPainelControle = document.getElementById('modalPainelControle');
const modalVerMembro = document.getElementById('modalVerMembro');
const modalAdicionarMembro = document.getElementById('modalAdicionarMembro');

// ===== EVENTOS DE LOGOUT =====
btnSair.addEventListener('click', async () => {
    const confirma = confirm('Deseja realmente sair?');
    if (confirma) {
        await fazerLogout();
        window.location.href = 'login.html';
    }
});

// ===== ABRIR MODAL TIPO EVENTO =====
btnAdicionarEvento.addEventListener('click', () => {
    modalTipoEvento.classList.add('active');
});

// ===== FECHAR MODALS =====
document.getElementById('closeModalTipo').addEventListener('click', () => {
    modalTipoEvento.classList.remove('active');
});

document.getElementById('closeModalEvento').addEventListener('click', () => {
    modalCriarEvento.classList.remove('active');
});

document.getElementById('closeModalMissa').addEventListener('click', () => {
    modalCriarMissa.classList.remove('active');
});

document.getElementById('closeModalPainel').addEventListener('click', () => {
    modalPainelControle.classList.remove('active');
});

document.getElementById('closeModalVerMembro').addEventListener('click', () => {
    modalVerMembro.classList.remove('active');
});

document.getElementById('closeModalAddMembro').addEventListener('click', () => {
    modalAdicionarMembro.classList.remove('active');
});

// Fechar modal clicando fora
[modalTipoEvento, modalCriarEvento, modalCriarMissa, modalPainelControle, modalVerMembro, modalAdicionarMembro].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// ===== SELECIONAR TIPO DE EVENTO =====
document.getElementById('btnMissaDominical').addEventListener('click', () => {
    modalTipoEvento.classList.remove('active');
    modalCriarMissa.classList.add('active');
});

document.getElementById('btnEventoPersonalizado').addEventListener('click', () => {
    modalTipoEvento.classList.remove('active');
    modalCriarEvento.classList.add('active');
});

// ===== CRIAR EVENTO PERSONALIZADO =====
document.getElementById('formCriarEvento').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nomeEvento').value;
    const descricao = document.getElementById('descricaoEvento').value;
    const data = document.getElementById('dataEvento').value;
    const horario = document.getElementById('horarioEvento').value;
    
    // Pega as funções selecionadas
    const funcoesSelecionadas = {};
    const checkboxes = document.querySelectorAll('#formCriarEvento input[name="funcao"]:checked');
    
    checkboxes.forEach(checkbox => {
        const funcaoValue = checkbox.value;
        const vagasInput = document.querySelector(`input[data-funcao="${funcaoValue}"]`);
        const vagas = parseInt(vagasInput.value) || 1;
        
        // Separa categoria e nome da função
        const partes = funcaoValue.split('-');
        const categoria = partes[0];
        const nomeFuncao = partes.slice(1).join('-');
        
        if (!funcoesSelecionadas[categoria]) {
            funcoesSelecionadas[categoria] = {};
        }
        
        funcoesSelecionadas[categoria][nomeFuncao] = {
            vagas: vagas,
            ocupadas: []
        };
    });
    
    if (Object.keys(funcoesSelecionadas).length === 0) {
        alert('Selecione pelo menos uma função!');
        return;
    }
    
    const dadosEvento = {
        tipo: 'personalizado',
        titulo: nome,
        descricao: descricao,
        data: formatarData(data),
        horario: horario,
        funcoes: funcoesSelecionadas
    };
    
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Criando evento...';
    
    const resultado = await criarEvento(dadosEvento);
    
    if (resultado.sucesso) {
        alert('Evento criado com sucesso!');
        modalCriarEvento.classList.remove('active');
        e.target.reset();
        await carregarEventos();
    } else {
        alert(resultado.erro);
    }
    
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Tudo Certo! Quero criar o Evento.';
});

// ===== CRIAR MISSA DOMINICAL =====
document.getElementById('formCriarMissa').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = document.getElementById('dataMissa').value;
    const horario = document.getElementById('horarioMissa').value;
    
    // Funções padrão da missa
    const funcoesPadrao = {
        'midias-sociais': {
            'postagens': { vagas: 1, ocupadas: [] }
        },
        'transmissao': {
            'camera-central': { vagas: 1, ocupadas: [] },
            'camera-movel': { vagas: 1, ocupadas: [] },
            'operador-obs': { vagas: 1, ocupadas: [] },
            'interacao-publico': { vagas: 1, ocupadas: [] }
        },
        'fotografia': {
            '07h30': { vagas: 1, ocupadas: [] },
            '09h30': { vagas: 1, ocupadas: [] },
            '19h': { vagas: 1, ocupadas: [] }
        },
        'slides': {
            '07h30': { vagas: 1, ocupadas: [] },
            '09h30': { vagas: 1, ocupadas: [] },
            '19h': { vagas: 1, ocupadas: [] }
        }
    };
    
    const dadosEvento = {
        tipo: 'missa',
        titulo: 'Missa Dominical',
        descricao: 'Missa como habitualmente',
        data: formatarData(data),
        horario: horario,
        funcoes: funcoesPadrao
    };
    
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Criando missa...';
    
    const resultado = await criarEvento(dadosEvento);
    
    if (resultado.sucesso) {
        alert('Missa criada com sucesso!');
        modalCriarMissa.classList.remove('active');
        e.target.reset();
        await carregarEventos();
    } else {
        alert(resultado.erro);
    }
    
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Tudo Certo! Quero criar a Missa.';
});

// ===== CARREGAR EVENTOS =====
async function carregarEventos() {
    const resultado = await buscarEventos();
    
    if (resultado.sucesso) {
        eventosGrid.innerHTML = '';
        
        if (resultado.eventos.length === 0) {
            eventosGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Nenhum evento criado ainda.</p>';
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
        <button class="btn-editar" data-evento-id="${evento.id}">Editar</button>
    `;
    
    // TODO: Implementar edição de eventos
    card.querySelector('.btn-editar').addEventListener('click', () => {
        alert('Funcionalidade de edição em desenvolvimento!');
    });
    
    return card;
}

// ===== PAINEL DE CONTROLE (MEMBROS) =====
btnPainelControle.addEventListener('click', async () => {
    modalPainelControle.classList.add('active');
    await carregarMembros();
});

document.getElementById('btnAdicionarMembro').addEventListener('click', () => {
    modalAdicionarMembro.classList.add('active');
});

// ===== CARREGAR MEMBROS =====
async function carregarMembros() {
    const membrosGrid = document.getElementById('membrosGrid');
    const resultado = await buscarTodosUsuarios();
    
    if (resultado.sucesso) {
        membrosGrid.innerHTML = '';
        
        resultado.usuarios.forEach(usuario => {
            const card = criarCardMembro(usuario);
            membrosGrid.appendChild(card);
        });
    } else {
        alert(resultado.erro);
    }
}

// ===== CRIAR CARD DE MEMBRO =====
function criarCardMembro(usuario) {
    const card = document.createElement('div');
    card.className = 'membro-card';
    
    const habilidadesTexto = usuario.habilidades && usuario.habilidades.length > 0 
        ? usuario.habilidades.slice(0, 3).join(', ') + (usuario.habilidades.length > 3 ? '...' : '')
        : 'Nenhuma habilidade';
    
    card.innerHTML = `
        <h3>${usuario.nome}</h3>
        <p class="membro-info">${usuario.email}</p>
        <p class="membro-info" style="font-size: 0.75rem;">${habilidadesTexto}</p>
        <div class="membro-buttons">
            <button class="btn-atualizar" data-user-id="${usuario.id}">Atualizar</button>
            <button class="btn-excluir" data-user-id="${usuario.id}">Excluir</button>
        </div>
    `;
    
    // Botão Atualizar
    card.querySelector('.btn-atualizar').addEventListener('click', () => {
        abrirModalVerMembro(usuario);
    });
    
    // Botão Excluir
    card.querySelector('.btn-excluir').addEventListener('click', async () => {
        const confirma = confirm(`Deseja realmente excluir ${usuario.nome}?`);
        if (confirma) {
            const resultado = await excluirUsuario(usuario.id);
            if (resultado.sucesso) {
                alert('Membro excluído com sucesso!');
                await carregarMembros();
            } else {
                alert(resultado.erro);
            }
        }
    });
    
    return card;
}

// ===== ABRIR MODAL VER/EDITAR MEMBRO =====
function abrirModalVerMembro(usuario) {
    document.getElementById('tituloModalMembro').textContent = usuario.nome;
    
    const detalhes = document.getElementById('membroDetalhes');
    detalhes.innerHTML = `
        <h4>Suas habilidades</h4>
        <ul>
            ${usuario.habilidades && usuario.habilidades.length > 0 
                ? usuario.habilidades.map(h => `<li>${traduzirHabilidade(h)}</li>`).join('')
                : '<li>Nenhuma habilidade cadastrada</li>'
            }
        </ul>
    `;
    
    modalVerMembro.classList.add('active');
    
    // TODO: Implementar edição de habilidades
    document.getElementById('btnSalvarAlteracoes').onclick = () => {
        alert('Funcionalidade de edição em desenvolvimento!');
    };
}

// ===== ADICIONAR NOVO MEMBRO =====
document.getElementById('formAdicionarMembro').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('novoMembroNome').value;
    const email = document.getElementById('novoMembroEmail').value;
    const senha = document.getElementById('novoMembroSenha').value;
    
    const habilidades = [];
    const checkboxes = document.querySelectorAll('input[name="novoMembroHabilidade"]:checked');
    checkboxes.forEach(cb => habilidades.push(cb.value));
    
    if (habilidades.length === 0) {
        alert('Selecione pelo menos uma habilidade!');
        return;
    }
    
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Adicionando...';
    
    const resultado = await cadastrarUsuario(email, senha, nome, habilidades);
    
    if (resultado.sucesso) {
        alert('Membro adicionado com sucesso!');
        modalAdicionarMembro.classList.remove('active');
        e.target.reset();
        await carregarMembros();
    } else {
        alert(resultado.erro);
    }
    
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Adicionar Membro';
});

// ===== FUNÇÕES AUXILIARES =====
function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function traduzirHabilidade(habilidade) {
    const traducoes = {
        'instagram': 'Instagram',
        'camera-profissional': 'Câmera Profissional',
        'camera-movel': 'Câmera Móvel',
        'operador-obs': 'Operador OBS',
        'interacao-publico': 'Interação com o público',
        'fotos-profissionais': 'Fotografias Profissionais',
        'fotos-celular': 'Fotografias com Celular',
        'slides-07h30': 'Slides 07h30',
        'slides-10h': 'Slides 10h',
        'slides-19h': 'Slides 19h'
    };
    return traducoes[habilidade] || habilidade;
}