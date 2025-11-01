// Importa as funções necessárias do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBifj2D6aLhocaRtge5CiipgZVRnJam4_s",
    authDomain: "pascomhub-pdes.firebaseapp.com",
    projectId: "pascomhub-pdes",
    storageBucket: "pascomhub-pdes.firebasestorage.app",
    messagingSenderId: "1025128801675",
    appId: "1:1025128801675:web:bc25e801c65bf8b9e8fb8e"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ========================================
// FUNÇÕES DE AUTENTICAÇÃO
// ========================================

// Função para criar novo usuário   
export async function cadastrarUsuario(email, senha, nome, habilidades) {
    try {
        console.log("🚀 Iniciando cadastro...");
        console.log("Email:", email);
        console.log("Nome:", nome);
        console.log("Habilidades:", habilidades);
        
        // Cria o usuário no Firebase Auth
        console.log("📝 Criando usuário no Authentication...");
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;
        console.log("✅ Usuário criado no Auth:", user.uid);
        
        // Salva os dados complementares no Firestore
        console.log("💾 Salvando dados no Firestore...");
        const dadosUsuario = {
            nome: nome,
            email: email,
            habilidades: habilidades,
            isCoordenador: false,
            criadoEm: new Date().toISOString()
        };
        console.log("Dados a salvar:", dadosUsuario);
        
        await setDoc(doc(db, "usuarios", user.uid), dadosUsuario);
        console.log("✅ Dados salvos no Firestore!");
        
        return { sucesso: true, userId: user.uid };
        
    } catch (error) {
        console.error("❌ Erro ao cadastrar:", error);
        console.error("Código do erro:", error.code);
        console.error("Mensagem:", error.message);
        
        // Mensagens de erro em português
        let mensagem = "Erro ao cadastrar usuário.";
        if (error.code === 'auth/email-already-in-use') {
            mensagem = "Este e-mail já está cadastrado.";
        } else if (error.code === 'auth/weak-password') {
            mensagem = "A senha deve ter pelo menos 6 caracteres.";
        } else if (error.code === 'auth/invalid-email') {
            mensagem = "E-mail inválido.";
        }
        
        return { sucesso: false, erro: mensagem };
    }
}

// Função para fazer login
export async function fazerLogin(email, senha) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;
        
        console.log("Login realizado com sucesso:", user.uid);
        return { sucesso: true, userId: user.uid };
        
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        
        let mensagem = "Erro ao fazer login.";
        if (error.code === 'auth/user-not-found') {
            mensagem = "Usuário não encontrado.";
        } else if (error.code === 'auth/wrong-password') {
            mensagem = "Senha incorreta.";
        } else if (error.code === 'auth/invalid-email') {
            mensagem = "E-mail inválido.";
        }
        
        return { sucesso: false, erro: mensagem };
    }
}

// Função para fazer logout
export async function fazerLogout() {
    try {
        await signOut(auth);
        console.log("Logout realizado com sucesso");
        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        return { sucesso: false, erro: "Erro ao fazer logout." };
    }
}

// Função para verificar se usuário está logado
export function verificarUsuarioLogado(callback) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuário está logado
            callback({ logado: true, userId: user.uid, email: user.email });
        } else {
            // Usuário não está logado
            callback({ logado: false });
        }
    });
}

// ========================================
// FUNÇÕES DO FIRESTORE (BANCO DE DADOS)
// ========================================

// Buscar dados do usuário
export async function buscarDadosUsuario(userId) {
    try {
        const docRef = doc(db, "usuarios", userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { sucesso: true, dados: docSnap.data() };
        } else {
            return { sucesso: false, erro: "Usuário não encontrado." };
        }
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        return { sucesso: false, erro: "Erro ao buscar dados do usuário." };
    }
}

// Atualizar habilidades do usuário
export async function atualizarHabilidades(userId, novasHabilidades) {
    try {
        const docRef = doc(db, "usuarios", userId);
        await updateDoc(docRef, {
            habilidades: novasHabilidades,
            atualizadoEm: new Date().toISOString()
        });
        
        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao atualizar habilidades:", error);
        return { sucesso: false, erro: "Erro ao atualizar habilidades." };
    }
}

// Criar evento
export async function criarEvento(dadosEvento) {
    try {
        const docRef = doc(collection(db, "eventos"));
        await setDoc(docRef, {
            ...dadosEvento,
            criadoEm: new Date().toISOString()
        });
        
        return { sucesso: true, eventoId: docRef.id };
    } catch (error) {
        console.error("Erro ao criar evento:", error);
        return { sucesso: false, erro: "Erro ao criar evento." };
    }
}

// Buscar todos os eventos
export async function buscarEventos() {
    try {
        const querySnapshot = await getDocs(collection(db, "eventos"));
        const eventos = [];
        
        querySnapshot.forEach((doc) => {
            eventos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return { sucesso: true, eventos: eventos };
    } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        return { sucesso: false, erro: "Erro ao buscar eventos." };
    }
}

// Buscar todos os usuários (apenas para coordenador)
export async function buscarTodosUsuarios() {
    try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        const usuarios = [];
        
        querySnapshot.forEach((doc) => {
            usuarios.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return { sucesso: true, usuarios: usuarios };
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return { sucesso: false, erro: "Erro ao buscar usuários." };
    }
}

// Excluir usuário
export async function excluirUsuario(userId) {
    try {
        await deleteDoc(doc(db, "usuarios", userId));
        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        return { sucesso: false, erro: "Erro ao excluir usuário." };
    }
}

// Exporta auth e db caso precise usar diretamente
export { auth, db };