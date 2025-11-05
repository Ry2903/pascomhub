import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-messaging.js";
import { getFirestore, collection, doc, setDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Configuração do Firebase (mesma do firebase-config.js)
const firebaseConfig = {
    apiKey: "AIzaSyBifj2D6aLhocaRtge5CiipgZVRnJam4_s",
    authDomain: "pascomhub-pdes.firebaseapp.com",
    projectId: "pascomhub-pdes",
    storageBucket: "pascomhub-pdes.firebasestorage.app",
    messagingSenderId: "1025128801675",
    appId: "1:1025128801675:web:bc25e801c65bf8b9e8fb8e"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const db = getFirestore(app);

// Chave pública do servidor VAPID
const VAPID_KEY = "BBp6JhxYmPYlf5fQ7o0I8-GDqPHGWeBhETkZQGfMyxlJ9-2QzVB8bCztbH79PM7usE2kJkCb-DVvMaohkNxWkW0";

// ===== SOLICITAR PERMISSÃO PARA NOTIFICAÇÕES =====
export async function solicitarPermissaoNotificacao(userId) {
    try {
        console.log("🔔 Solicitando permissão para notificações...");
        
        // Verifica se o navegador suporta notificações
        if (!('Notification' in window)) {
            console.error("❌ Este navegador não suporta notificações");
            return { sucesso: false, erro: "Navegador não suporta notificações" };
        }
        
        // Solicita permissão
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log("✅ Permissão concedida!");
            
            // Obtém o token FCM
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });
            console.log("🔑 Token FCM:", token);
            
            // Salva o token no Firestore
            await setDoc(doc(db, "tokens", userId), {
                token: token,
                userId: userId,
                criadoEm: new Date().toISOString()
            });
            
            console.log("💾 Token salvo no Firestore!");
            
            return { sucesso: true, token: token };
        } else {
            console.log("❌ Permissão negada");
            return { sucesso: false, erro: "Permissão negada pelo usuário" };
        }
        
    } catch (error) {
        console.error("❌ Erro ao solicitar permissão:", error);
        return { sucesso: false, erro: error.message };
    }
}

// ===== RECEBER NOTIFICAÇÕES EM FOREGROUND =====
export function ouvirNotificacoes() {
    onMessage(messaging, (payload) => {
        console.log("📩 Notificação recebida:", payload);
        
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/assets/pascomWhite.png', // Adicione o ícone aqui
            badge: '/assets/pascomWhite.png',
            tag: payload.data?.eventoId || 'pascomhub-notification'
        };
        
        // Mostra a notificação
        if (Notification.permission === 'granted') {
            new Notification(notificationTitle, notificationOptions);
        }
    });
}

// ===== VERIFICAR VAGAS E ENVIAR NOTIFICAÇÕES =====
export async function verificarVagasENotificar() {
    try {
        console.log("🔍 Verificando eventos com vagas disponíveis...");
        
        // Busca todos os eventos
        const eventosSnapshot = await getDocs(collection(db, "eventos"));
        const agora = new Date();
        
        eventosSnapshot.forEach(async (eventoDoc) => {
            const evento = { id: eventoDoc.id, ...eventoDoc.data() };
            
            // Converte data do evento (formato DD/MM/YYYY)
            const [dia, mes, ano] = evento.data.split('/');
            const dataEvento = new Date(`${ano}-${mes}-${dia}T${evento.horario}:00`);
            
            // Calcula diferença em horas
            const horasAteEvento = (dataEvento - agora) / (1000 * 60 * 60);
            
            // Verifica se está entre 23-25h (24h antes) ou 11-13h (12h antes)
            const deve24h = horasAteEvento >= 23 && horasAteEvento <= 25;
            const deve12h = horasAteEvento >= 11 && horasAteEvento <= 13;
            
            if (deve24h || deve12h) {
                console.log(`⏰ Evento "${evento.titulo}" está ${deve24h ? '24h' : '12h'} antes!`);
                
                // Verifica se tem vagas disponíveis
                const funcoesVagas = [];
                
                for (const [categoria, funcoes] of Object.entries(evento.funcoes)) {
                    for (const [nomeFuncao, dadosFuncao] of Object.entries(funcoes)) {
                        const ocupadas = dadosFuncao.ocupadas?.length || 0;
                        const vagas = dadosFuncao.vagas;
                        
                        if (ocupadas < vagas) {
                            funcoesVagas.push({
                                categoria: categoria,
                                funcao: nomeFuncao,
                                vagasDisponiveis: vagas - ocupadas
                            });
                        }
                    }
                }
                
                if (funcoesVagas.length > 0) {
                    console.log(`📢 Encontradas ${funcoesVagas.length} funções com vagas!`);
                    
                    // Para cada função vaga, notifica usuários com a habilidade
                    for (const funcaoVaga of funcoesVagas) {
                        await notificarUsuariosComHabilidade(evento, funcaoVaga, deve24h ? '24h' : '12h');
                    }
                }
            }
        });
        
    } catch (error) {
        console.error("❌ Erro ao verificar vagas:", error);
    }
}

// ===== NOTIFICAR USUÁRIOS COM HABILIDADE ESPECÍFICA =====
async function notificarUsuariosComHabilidade(evento, funcaoVaga, tempo) {
    try {
        // Mapeia funções para habilidades
        const mapeamentoHabilidades = {
            'midias-sociais': {
                'postagens': 'instagram'
            },
            'transmissao': {
                'camera-central': 'camera-profissional',
                'camera-movel': 'camera-movel',
                'operador-obs': 'operador-obs',
                'interacao-publico': 'interacao-publico'
            },
            'fotografia': {
                '07h30': 'fotos-profissionais',
                '09h30': 'fotos-profissionais',
                '19h': 'fotos-profissionais'
            },
            'slides': {
                '07h30': 'slides-07h30',
                '09h30': 'slides-09h30',
                '19h': 'slides-19h'
            }
        };
        
        const habilidadeNecessaria = mapeamentoHabilidades[funcaoVaga.categoria]?.[funcaoVaga.funcao];
        
        if (!habilidadeNecessaria) {
            console.log(`⚠️ Não foi possível mapear habilidade para ${funcaoVaga.categoria}-${funcaoVaga.funcao}`);
            return;
        }
        
        console.log(`🔎 Buscando usuários com habilidade: ${habilidadeNecessaria}`);
        
        // Busca usuários com essa habilidade
        const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
        
        usuariosSnapshot.forEach(async (usuarioDoc) => {
            const usuario = usuarioDoc.data();
            
            if (usuario.habilidades?.includes(habilidadeNecessaria)) {
                console.log(`📤 Enviando notificação para: ${usuario.nome}`);
                
                // Busca o token do usuário
                const tokenDoc = await getDocs(query(collection(db, "tokens"), where("userId", "==", usuarioDoc.id)));
                
                if (!tokenDoc.empty) {
                    const token = tokenDoc.docs[0].data().token;
                    
                    // Salva notificação para ser enviada (Firebase Functions fará o envio)
                    await setDoc(doc(collection(db, "notificacoesPendentes")), {
                        token: token,
                        userId: usuarioDoc.id,
                        eventoId: evento.id,
                        eventoTitulo: evento.titulo,
                        funcao: `${funcaoVaga.categoria} - ${funcaoVaga.funcao}`,
                        tempo: tempo,
                        criadoEm: new Date().toISOString(),
                        enviado: false
                    });
                    
                    console.log(`✅ Notificação agendada para ${usuario.nome}`);
                }
            }
        });
        
    } catch (error) {
        console.error("❌ Erro ao notificar usuários:", error);
    }
}

// ===== INICIAR VERIFICAÇÃO PERIÓDICA =====
export function iniciarVerificacaoPeriodica() {
    console.log("🔄 Iniciando verificação periódica de vagas...");
    
    // Verifica imediatamente
    verificarVagasENotificar();
    
    // Verifica a cada 1 hora
    setInterval(() => {
        verificarVagasENotificar();
    }, 60 * 60 * 1000); // 1 hora em milissegundos
}