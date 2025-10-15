// Toggle senha cadastro
const toggleSenhaCadastro = document.getElementById('toggleSenhaCadastro');
if(toggleSenhaCadastro){
    toggleSenhaCadastro.addEventListener('click', () => {
        const senhaInput = document.getElementById('senha');
        senhaInput.type = senhaInput.type === "password" ? "text" : "password";
    });
}

// Toggle senha login
const toggleSenhaLogin = document.getElementById('toggleSenhaLogin');
if(toggleSenhaLogin){
    toggleSenhaLogin.addEventListener('click', () => {
        const senhaInput = document.getElementById('senhaLogin');
        senhaInput.type = senhaInput.type === "password" ? "text" : "password";
    });
}

// Cadastro Firebase
const cadastroForm = document.getElementById('cadastroForm');
if(cadastroForm){
    cadastroForm.addEventListener('submit', async function(e){
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        const habilidades = Array.from(document.querySelectorAll('.subhabilidades input:checked'))
            .map(input => input.value);

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
            const user = userCredential.user;

            // Salva dados no Firestore
            await db.collection('usuarios').doc(user.uid).set({
                nome,
                email,
                tipo: "Membro",
                habilidades
            });

            alert("Cadastro realizado com sucesso!");
            window.location.href = "index.html";
        } catch (error) {
            alert(error.message);
        }
    });
}

// Login Firebase
const loginForm = document.getElementById('loginForm');
if(loginForm){
    loginForm.addEventListener('submit', async function(e){
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senhaLogin').value;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, senha);
            const user = userCredential.user;

            // Verifica tipo de usuário
            const userData = await db.collection('usuarios').doc(user.uid).get();
            const tipo = userData.data().tipo;

            if(tipo === "Coordenador"){
                window.location.href = "dashboard_coordenador.html";
            } else {
                window.location.href = "dashboard_membro.html";
            }
        } catch (error) {
            alert(error.message);
        }
    });
}