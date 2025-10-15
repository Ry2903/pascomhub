document.getElementById('voltarBtn').addEventListener('click', () => {
    window.location.href = "dashboard_membro.html";
});

auth.onAuthStateChanged(async user => {
    if(!user) window.location.href = "index.html";

    const doc = await db.collection('usuarios').doc(user.uid).get();
    const nome = doc.data().nome;
    const habilidades = doc.data().habilidades || [];

    document.getElementById('saudacao').textContent = `Olá ${nome}! Suas habilidades atuais são:`;

    carregarPerfil(user.uid, habilidades);
});

function carregarPerfil(userId, habilidades) {
    const perfilContainer = document.getElementById('perfilContainer');
    perfilContainer.innerHTML = "";
    
    db.collection('subhabilidades').get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.className = "perfilHabilidade";

            const checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.value = data.nome;
            checkbox.checked = habilidades.includes(data.nome);

            div.appendChild(checkbox);
            div.appendChild(document.createTextNode(data.nome));
            perfilContainer.appendChild(div);
        });
    });
}

document.getElementById('salvarPerfilBtn').addEventListener('click', async () => {
    const user = auth.currentUser;
    if(!user) return;

    const selecionadas = Array.from(document.querySelectorAll('#perfilContainer input[type="checkbox"]:checked'))
        .map(input => input.value);

    await db.collection('usuarios').doc(user.uid).update({
        habilidades: selecionadas
    });

    alert("Habilidades atualizadas com sucesso!");
});