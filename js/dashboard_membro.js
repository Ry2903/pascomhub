console.log("JS carregado com sucesso");
console.log("Firebase carregado:", typeof db !== "undefined");
auth.onAuthStateChanged(async user => {
  console.log("Usuário logado:", user);
  if (!user) {
    window.location.href = "index.html";
    return;
  }
});


// Logout e perfil
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = "index.html";
});

document.getElementById('perfilBtn').addEventListener('click', () => {
    window.location.href = "perfil.html";
});

// Verifica usuário logado
auth.onAuthStateChanged(async user => {
    if(!user) window.location.href = "index.html";
    const doc = await db.collection('usuarios').doc(user.uid).get();
    if(!doc.exists) return;
    if(doc.data().tipo !== "Membro") window.location.href = "dashboard_coordenador.html";
    carregarEventos(user.uid, doc.data().habilidades);
});

// ----------------------
// CARREGAR EVENTOS
// ----------------------
async function carregarEventos(userId, userHabs) {
    const container = document.getElementById('eventosContainer');
    container.innerHTML = "";

    const eventosSnap = await db.collection('eventos').orderBy('data').get();
    const agora = new Date();
    agora.setHours(23,59,59,999);

    eventosSnap.forEach(eventoDoc => {
        const evento = eventoDoc.data();
        let eventoData = evento.data?.toDate ? evento.data.toDate() : new Date();
        eventoData.setHours(eventoData.getHours() + 3); // ajustar fuso horário
        if(eventoData < agora) return; // ignora eventos passados
        const dataStr = eventoData.toLocaleDateString();

        // Card do evento
        const card = document.createElement('div');
        card.className = 'eventoCard collapsible';
        card.innerHTML = `
            <div class="eventoHeader">
                <h4>${evento.nome} - ${dataStr}</h4>
                <p>${evento.descricao || ""}</p>
                <span class="toggleIcon">▼ Exibir mais</span>
            </div>
            <div class="eventoBody" style="display:none;"></div>
        `;
        const body = card.querySelector('.eventoBody');
        const toggleIcon = card.querySelector('.toggleIcon');

        // Funções: se não existir, cria array vazio
        const funcoesEvento = Array.isArray(evento.funcoes) ? evento.funcoes : [];

        // Ordem fixa da missa padrão
        const ordemFixa = [
            {categoria:"TRANSMISSÃO - 09h30", sub: ["Câmera Central","Câmera Móvel","OBS","Feedbacks"]},
            {categoria:"Slides", sub: ["07h30","09h30","19h"]},
            {categoria:"Fotos/Vídeos - Celular", sub: ["07h30","09h30 Fotos","09h30 Vídeos/Reels","19h Fotos e Vídeos"]},
            {categoria:"Fotos - Profissionais", sub: ["07h30","09h30","19h"]},
            {categoria:"Postagens", sub: ["Homilia e Fotos das 3 Missas"]}
        ];

        ordemFixa.forEach(grupo => {
            const catTitle = document.createElement('div');
            catTitle.className = 'categoria';
            catTitle.textContent = grupo.categoria;
            body.appendChild(catTitle);

            grupo.sub.forEach(subNome => {
                const func = funcoesEvento.find(f => f.subhabilidade === subNome) || {};
                const div = document.createElement('div');
                div.className = 'subFunc';
                const btn = document.createElement('button');

                if(func.responsavel === userId){
                    btn.textContent = "Cancelar";
                    btn.classList.add('assumido');
                } else if(func.responsavel){
                    btn.textContent = "Ocupado por: " + (func.responsavelNome || "Outro");
                    btn.disabled = true;
                    btn.classList.add('ocupado');
                } else {
                    btn.textContent = "Assumir função";
                    btn.classList.add('livre');
                }

                btn.addEventListener('click', async () => {
                    const docRef = db.collection('eventos').doc(eventoDoc.id);
                    const funcoesAtualizadas = Array.isArray(evento.funcoes) ? evento.funcoes : [];

                    const idx = funcoesAtualizadas.findIndex(f => f.subhabilidade === subNome);

                    if(idx === -1){
                        // Se função ainda não existe no evento, adiciona
                        funcoesAtualizadas.push({subhabilidade: subNome, responsavel: userId, responsavelNome: ""});
                    } else if(funcoesAtualizadas[idx].responsavel === userId){
                        funcoesAtualizadas[idx].responsavel = null;
                        funcoesAtualizadas[idx].responsavelNome = null;
                    } else {
                        funcoesAtualizadas[idx].responsavel = userId;
                        const userDoc = await db.collection('usuarios').doc(userId).get();
                        funcoesAtualizadas[idx].responsavelNome = userDoc.data().nome;
                    }

                    await docRef.update({funcoes: funcoesAtualizadas});
                    carregarEventos(userId, userHabs);
                });

                div.appendChild(document.createTextNode(subNome));
                div.appendChild(btn);
                body.appendChild(div);
            });
        });

        // Toggle collapsible
        card.querySelector('.eventoHeader').addEventListener('click', () => {
            if(body.style.display === 'none'){
                body.style.display = 'block';
                toggleIcon.textContent = "▲ Ocultar";
            } else {
                body.style.display = 'none';
                toggleIcon.textContent = "▼ Exibir mais";
            }
        });

        container.appendChild(card);
    });
}