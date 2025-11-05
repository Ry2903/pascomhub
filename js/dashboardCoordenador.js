import { 
    verificarUsuarioLogado,
    fazerLogout,
    buscarEventos,
    buscarEvento,
    criarEvento,
    atualizarEvento,
    deletarEvento,
    buscarTodosUsuarios,
    buscarDadosUsuario,
    cadastrarUsuario,
    atualizarHabilidades,
    excluirUsuario
} from './firebase-config.js';

import { iniciarVerificacaoPeriodica } from './notificacoes.js';

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
const modalEditarEvento = document.getElementById('modalEditarEvento');
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

document.getElementById('closeModalEditarEvento').addEventListener('click', () => {
    modalEditarEvento.classList.remove('active');
});

// Fechar modal clicando fora
[modalTipoEvento, modalCriarEvento, modalCriarMissa, modalEditarEvento, modalPainelControle, modalVerMembro, modalAdicionarMembro].forEach(modal => {
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
    
    // Botão Editar
    card.querySelector('.btn-editar').addEventListener('click', async () => {
        await abrirModalEditarEvento(evento.id);
    });
    
    return card;
}

// ===== ABRIR MODAL EDITAR EVENTO =====
async function abrirModalEditarEvento(eventoId) {
    const resultado = await buscarEvento(eventoId);
    
    if (!resultado.sucesso) {
        alert(resultado.erro);
        return;
    }
    
    const evento = resultado.evento;
    
    // Preenche os campos básicos
    document.getElementById('editarEventoId').value = evento.id;
    document.getElementById('editarNomeEvento').value = evento.titulo;
    document.getElementById('editarDescricaoEvento').value = evento.descricao;
    
    // Converte data de DD/MM/YYYY para YYYY-MM-DD
    const [dia, mes, ano] = evento.data.split('/');
    document.getElementById('editarDataEvento').value = `${ano}-${mes}-${dia}`;
    document.getElementById('editarHorarioEvento').value = evento.horario;
    
    // Preenche as funções
    const container = document.getElementById('funcoesEditarContainer');
    container.innerHTML = '';
    
    for (const [categoria, funcoes] of Object.entries(evento.funcoes)) {
        const grupoDiv = document.createElement('div');
        grupoDiv.className = 'funcao-edit-group';
        
        const titulo = document.createElement('h4');
        titulo.className = 'funcao-edit-title';
        titulo.textContent = traduzirCategoria(categoria);
        grupoDiv.appendChild(titulo);
        
        for (const [nomeFuncao, dadosFuncao] of Object.entries(funcoes)) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'funcao-edit-item';
            
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.dataset.categoria = categoria;
            checkbox.dataset.funcao = nomeFuncao;
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${traduzirFuncao(nomeFuncao)}`));
            
            const vagasDiv = document.createElement('div');
            vagasDiv.className = 'funcao-edit-vagas';
            
            const vagasLabel = document.createElement('span');
            vagasLabel.textContent = 'Vagas:';
            
            const vagasInput = document.createElement('input');
            vagasInput.type = 'number';
            vagasInput.min = '1';
            vagasInput.max = '10';
            vagasInput.value = dadosFuncao.vagas;
            vagasInput.className = 'vagas-input';
            vagasInput.dataset.categoria = categoria;
            vagasInput.dataset.funcao = nomeFuncao;
            
            vagasDiv.appendChild(vagasLabel);
            vagasDiv.appendChild(vagasInput);
            
            itemDiv.appendChild(label);
            itemDiv.appendChild(vagasDiv);
            
            // Mostra ocupantes
            if (dadosFuncao.ocupadas && dadosFuncao.ocupadas.length > 0) {
                const ocupantesDiv = document.createElement('div');
                ocupantesDiv.className = 'funcao-ocupantes';
                ocupantesDiv.innerHTML = `<strong>Ocupada por:</strong>`;
                
                for (const userId of dadosFuncao.ocupadas) {
                    const userResult = await buscarDadosUsuario(userId);
                    if (userResult.sucesso) {
                        const ocupanteItem = document.createElement('div');
                        ocupanteItem.className = 'ocupante-item';
                        ocupanteItem.innerHTML = `
                            <span>${userResult.dados.nome}</span>
                            <button class="btn-remover-ocupante" data-user-id="${userId}" data-categoria="${categoria}" data-funcao="${nomeFuncao}">Remover</button>
                        `;
                        ocupantesDiv.appendChild(ocupanteItem);
                    }
                }
                
                itemDiv.appendChild(ocupantesDiv);
            }
            
            grupoDiv.appendChild(itemDiv);
        }
        
        container.appendChild(grupoDiv);
    }
    
    modalEditarEvento.classList.add('active');
}

// ===== SALVAR EDIÇÃO DE EVENTO =====
document.getElementById('formEditarEvento').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const eventoId = document.getElementById('editarEventoId').value;
    const titulo = document.getElementById('editarNomeEvento').value;
    const descricao = document.getElementById('editarDescricaoEvento').value;
    const data = document.getElementById('editarDataEvento').value;
    const horario = document.getElementById('editarHorarioEvento').value;
    
    // Busca evento atual para preservar ocupadas
    const eventoAtual = await buscarEvento(eventoId);
    
    // Reconstroi objeto de funções
    const novasFuncoes = {};
    const checkboxes = document.querySelectorAll('#funcoesEditarContainer input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        const categoria = checkbox.dataset.categoria;
        const funcao = checkbox.dataset.funcao;
        const vagasInput = document.querySelector(`input[data-categoria="${categoria}"][data-funcao="${funcao}"].vagas-input`);
        const vagas = parseInt(vagasInput.value) || 1;
        
        if (!novasFuncoes[categoria]) {
            novasFuncoes[categoria] = {};
        }
        
        // Preserva os ocupantes atuais
        const ocupadasAtuais = eventoAtual.sucesso && 
                               eventoAtual.evento.funcoes[categoria] && 
                               eventoAtual.evento.funcoes[categoria][funcao] 
                               ? eventoAtual.evento.funcoes[categoria][funcao].ocupadas 
                               : [];
        
        novasFuncoes[categoria][funcao] = {
            vagas: vagas,
            ocupadas: ocupadasAtuais
        };
    });
    
    const dadosAtualizados = {
        titulo: titulo,
        descricao: descricao,
        data: formatarData(data),
        horario: horario,
        funcoes: novasFuncoes
    };
    
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Salvando...';
    
    const resultado = await atualizarEvento(eventoId, dadosAtualizados);
    
    if (resultado.sucesso) {
        alert('Evento atualizado com sucesso!');
        modalEditarEvento.classList.remove('active');
        await carregarEventos();
    } else {
        alert(resultado.erro);
    }
    
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Salvar Alterações';
});

// ===== EXCLUIR EVENTO =====
document.getElementById('btnExcluirEvento').addEventListener('click', async () => {
    const eventoId = document.getElementById('editarEventoId').value;
    const confirma = confirm('Deseja realmente excluir este evento? Esta ação não pode ser desfeita.');
    
    if (confirma) {
        const resultado = await deletarEvento(eventoId);
        
        if (resultado.sucesso) {
            alert('Evento excluído com sucesso!');
            modalEditarEvento.classList.remove('active');
            await carregarEventos();
        } else {
            alert(resultado.erro);
        }
    }
});

// ===== REMOVER OCUPANTE DE FUNÇÃO =====
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-remover-ocupante')) {
        const userId = e.target.dataset.userId;
        const categoria = e.target.dataset.categoria;
        const funcao = e.target.dataset.funcao;
        const eventoId = document.getElementById('editarEventoId').value;
        
        const confirma = confirm('Deseja realmente remover este membro desta função?');
        
        if (confirma) {
            const eventoResult = await buscarEvento(eventoId);
            if (eventoResult.sucesso) {
                const evento = eventoResult.evento;
                const ocupadas = evento.funcoes[categoria][funcao].ocupadas;
                const novasOcupadas = ocupadas.filter(id => id !== userId);
                
                evento.funcoes[categoria][funcao].ocupadas = novasOcupadas;
                
                const resultado = await atualizarEvento(eventoId, { funcoes: evento.funcoes });
                
                if (resultado.sucesso) {
                    alert('Membro removido com sucesso!');
                    await abrirModalEditarEvento(eventoId);
                } else {
                    alert(resultado.erro);
                }
            }
        }
    }
});

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
    
    console.log('📊 Resultado buscar todos usuários:', resultado);
    
    if (resultado.sucesso) {
        membrosGrid.innerHTML = '';
        
        if (resultado.usuarios.length === 0) {
            membrosGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Nenhum membro cadastrado ainda.</p>';
            return;
        }
        
        console.log('✅ Membros encontrados:', resultado.usuarios.length);
        
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
    
    // Cria checkboxes editáveis para habilidades
    const habilidadesPossiveis = [
        { value: 'instagram', label: 'Instagram', categoria: 'Mídias Sociais' },
        { value: 'camera-profissional', label: 'Câmera Profissional', categoria: 'Transmissão Ao-vivo' },
        { value: 'camera-movel', label: 'Câmera Móvel', categoria: 'Transmissão Ao-vivo' },
        { value: 'operador-obs', label: 'Operador OBS', categoria: 'Transmissão Ao-vivo' },
        { value: 'interacao-publico', label: 'Interação com o público', categoria: 'Transmissão Ao-vivo' },
        { value: 'fotos-profissionais', label: 'Fotografias Profissionais', categoria: 'Fotografia' },
        { value: 'fotos-celular', label: 'Fotografias com Celular', categoria: 'Fotografia' },
        { value: 'slides-07h30', label: 'Slides 07h30', categoria: 'Slides' },
        { value: 'slides-10h', label: 'Slides 10h', categoria: 'Slides' },
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
    
    let html = '<div class="habilidades-container">';
    
    for (const [categoria, habilidades] of Object.entries(categorias)) {
        html += `
            <div class="habilidade-group">
                <h4 class="habilidade-title">${categoria}</h4>
        `;
        
        habilidades.forEach(hab => {
            const checked = usuario.habilidades && usuario.habilidades.includes(hab.value) ? 'checked' : '';
            html += `
                <label class="checkbox-label">
                    <input type="checkbox" name="editarHabilidade" value="${hab.value}" ${checked}>
                    <span>${hab.label}</span>
                </label>
            `;
        });
        
        html += '</div>';
    }
    
    html += '</div>';
    
    detalhes.innerHTML = html;
    
    modalVerMembro.classList.add('active');
    
    // Salvar alterações
    document.getElementById('btnSalvarAlteracoes').onclick = async () => {
        const novasHabilidades = [];
        const checkboxes = document.querySelectorAll('input[name="editarHabilidade"]:checked');
        checkboxes.forEach(cb => novasHabilidades.push(cb.value));
        
        if (novasHabilidades.length === 0) {
            alert('Selecione pelo menos uma habilidade!');
            return;
        }
        
        const btnSalvar = document.getElementById('btnSalvarAlteracoes');
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';
        
        const resultado = await atualizarHabilidades(usuario.id, novasHabilidades);
        
        if (resultado.sucesso) {
            alert('Habilidades atualizadas com sucesso!');
            modalVerMembro.classList.remove('active');
            await carregarMembros();
        } else {
            alert(resultado.erro);
        }
        
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar Alterações';
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
    
    console.log('🚀 Criando membro:', { nome, email, habilidades });
    
    const resultado = await cadastrarUsuario(email, senha, nome, habilidades);
    
    console.log('📊 Resultado cadastro:', resultado);
    
    if (resultado.sucesso) {
        alert('Membro adicionado com sucesso!');
        // Aguarda um pouco para garantir que salvou no Firestore
        await new Promise(resolve => setTimeout(resolve, 1000));
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