// === Abas do dashboard ===
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// === Logout ===
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = "index.html";
});

// === Verifica tipo de usuário ===
auth.onAuthStateChanged(async user => {
    if(!user) window.location.href = "index.html";
    const doc = await db.collection('usuarios').doc(user.uid).get();
    if(doc.data().tipo !== "Coordenador") window.location.href = "dashboard_membro.html";
});

// === Função para carregar habilidades e sub-habilidades do Firestore ===
async function carregarFuncoesDisponiveis() {
    const container = document.getElementById('funcoesContainer');
    container.innerHTML = '';

    // Busca todas as habilidades
    const habilidadesSnap = await db.collection('habilidades').get();
    // Busca todas as sub-habilidades
    const subSnap = await db.collection('subhabilidades').get();
    const subArray = subSnap.docs.map(doc => doc.data());

    habilidadesSnap.forEach(habDoc => {
        const hab = habDoc.data().nome;

        const divHab = document.createElement('div');
        divHab.style.marginBottom = '10px';
        divHab.innerHTML = `<strong>${hab}</strong>`;
        container.appendChild(divHab);

        // Filtra sub-habilidades da habilidade atual
        subArray.filter(sub => sub.habilidadeNome === hab)
                .forEach(subData => {
            const sub = subData.nome;

            const label = document.createElement('label');
            label.className = 'checkbox-container';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'subCheck';
            checkbox.value = sub;
            checkbox.dataset.habilidade = hab;

            const inputQtd = document.createElement('input');
            inputQtd.type = 'number';
            inputQtd.min = 1;
            inputQtd.className = 'qtdMembros';
            inputQtd.placeholder = "Nº de membros";
            inputQtd.style.display = 'none';

            // Evento para mostrar número de membros
            checkbox.addEventListener('change', e => {
                if(e.target.checked){
                    inputQtd.style.display = "inline-block";
                    inputQtd.value = 1;
                } else {
                    inputQtd.style.display = "none";
                    inputQtd.value = "";
                }
            });

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${sub}`));
            label.appendChild(inputQtd);

            container.appendChild(label);
        });
    });
}

// Carrega funções ao abrir a aba
carregarFuncoesDisponiveis();

// === Criar Evento Personalizado ===
document.getElementById('formPersonalizado').addEventListener('submit', async e => {
    e.preventDefault();
    const nome = document.getElementById('nomeEvento').value;
    const descricao = document.getElementById('descricaoEvento').value;
    const data = new Date(document.getElementById('dataEvento').value + 'T' + document.getElementById('horaEvento').value);

    const funcoes = [];
    document.querySelectorAll('#funcoesContainer .subCheck').forEach(cb => {
        if(cb.checked){
            const qtd = parseInt(cb.nextElementSibling.value) || 1;
            funcoes.push({
                habilidade: cb.dataset.habilidade,
                subhabilidade: cb.value,
                responsavel: null,
                quantidadeMembros: qtd
            });
        }
    });

    if(funcoes.length === 0){
        alert("Selecione pelo menos uma função/sub-habilidade!");
        return;
    }

    await db.collection('eventos').add({
        nome,
        descricao,
        data: firebase.firestore.Timestamp.fromDate(data),
        funcoes
    });

    alert("Evento Personalizado criado com sucesso!");
    e.target.reset();
    carregarFuncoesDisponiveis();
});

// === Criar Missa (pré-definida) ===
document.getElementById('formMissa').addEventListener('submit', async e => {
    e.preventDefault();

    const dataInput = document.getElementById('dataMissa').value;
    if(!dataInput){
        alert("Selecione a data da Missa!");
        return;
    }
    const dataMissa = new Date(dataInput);

    const funcoes = [];

    // Transmissão
    funcoes.push({habilidade: "Transmissão", subhabilidade: "Câmera Central", responsavel: null, quantidadeMembros:1});
    funcoes.push({habilidade: "Transmissão", subhabilidade: "Câmera Móvel", responsavel: null, quantidadeMembros:1});
    funcoes.push({habilidade: "Transmissão", subhabilidade: "OBS", responsavel: null, quantidadeMembros:1});
    funcoes.push({habilidade: "Transmissão", subhabilidade: "Feedbacks", responsavel: null, quantidadeMembros:1});

    // Presencial
    funcoes.push({habilidade: "Presencial", subhabilidade: "Slides", responsavel: null, quantidadeMembros:1});

    // Fotos/Vídeos - Celular
    funcoes.push({habilidade: "Fotos/Vídeos - Celular", subhabilidade: "07h30", responsavel: null, quantidadeMembros:1});
    funcoes.push({habilidade: "Fotos/Vídeos - Celular", subhabilidade: "09h30 Fotos", responsavel: null, quantidadeMembros:1});
    funcoes.push({habilidade: "Fotos/Vídeos - Celular", subhabilidade: "09h30 Vídeos/Reels", responsavel: null, quantidadeMembros:1});
    funcoes.push({habilidade: "Fotos/Vídeos - Celular", subhabilidade: "19h Fotos e Vídeos", responsavel: null, quantidadeMembros:1});

    // Fotos - Profissionais
    funcoes.push({habilidade: "Fotografia", subhabilidade: "07h30", responsavel: null, quantidadeMembros:1});
    funcoes.push({habilidade: "Fotografia", subhabilidade: "09h30", responsavel: null, quantidadeMembros:1});
    funcoes.push({habilidade: "Fotografia", subhabilidade: "19h", responsavel: null, quantidadeMembros:1});

    // Postagens
    funcoes.push({habilidade: "Mídias Sociais", subhabilidade: "Homilia e Fotos das 3 Missas", responsavel: null, quantidadeMembros:1});

    await db.collection('eventos').add({
        nome: "Missa Dominical",
        descricao: "Missa como habitual",
        data: firebase.firestore.Timestamp.fromDate(dataMissa),
        funcoes
    });

    alert("Missa criada com sucesso!");
});