import { getDocs, collection, doc, setDoc, getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { db } from './firebase-config.js';

// ===== VERIFICAR VAGAS E REGISTRAR NOTIFICAÇÕES =====
export async function verificarVagasENotificar() {
    try {
        console.log("🔍 Verificando eventos com vagas disponíveis...");
        
        const eventosSnapshot = await getDocs(collection(db, "eventos"));
        const agora = new Date();
        let notificacoesGeradas = 0;
        
        for (const eventoDoc of eventosSnapshot.docs) {
            const evento = { id: eventoDoc.id, ...eventoDoc.data() };
            
            // Converte data do evento (formato DD/MM/YYYY)
            const [dia, mes, ano] = evento.data.split('/');
            const dataEvento = new Date(`${ano}-${mes}-${dia}T${evento.horario || '00:00'}:00`);
            
            // Calcula diferença em horas
            const horasAteEvento = (dataEvento - agora) / (1000 * 60 * 60);
            
            // Verifica se está entre 23-25h (24h antes) ou 11-13h (12h antes)
            const deve24h = horasAteEvento >= 23 && horasAteEvento <= 25;
            const deve12h = horasAteEvento >= 11 && horasAteEvento <= 13;
            
            if (deve24h || deve12h) {
                console.log(`⏰ Evento "${evento.titulo}" está ${deve24h ? '24h' : '12h'} antes!`);
                
                // Verifica funções com vagas
                for (const [categoria, funcoes] of Object.entries(evento.funcoes || {})) {
                    for (const [nomeFuncao, dadosFuncao] of Object.entries(funcoes)) {
                        const ocupadas = dadosFuncao.ocupadas?.length || 0;
                        const vagas = dadosFuncao.vagas;
                        
                        if (ocupadas < vagas) {
                            // TEM VAGA! Registra notificação
                            const habilidadeNecessaria = mapearHabilidade(categoria, nomeFuncao);
                            
                            if (habilidadeNecessaria) {
                                await registrarNotificacao(evento, categoria, nomeFuncao, habilidadeNecessaria, deve24h ? '24h' : '12h');
                                notificacoesGeradas++;
                            }
                        }
                    }
                }
            }
        }
        
        if (notificacoesGeradas > 0) {
            console.log(`✅ ${notificacoesGeradas} notificações registradas!`);
        } else {
            console.log("ℹ️ Nenhuma notificação necessária no momento");
        }
        
    } catch (error) {
        console.error("❌ Erro ao verificar vagas:", error);
    }
}

// ===== MAPEAR HABILIDADE =====
function mapearHabilidade(categoria, funcao) {
    const mapeamento = {
        'midias-sociais': { 'postagens': 'instagram' },
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
    
    return mapeamento[categoria]?.[funcao];
}

// ===== REGISTRAR NOTIFICAÇÃO =====
async function registrarNotificacao(evento, categoria, funcao, habilidade, tempo) {
    try {
        // Busca usuários com essa habilidade
        const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
        
        for (const usuarioDoc of usuariosSnapshot.docs) {
            const usuario = usuarioDoc.data();
            
            if (usuario.habilidades?.includes(habilidade)) {
                // Cria ID único para evitar duplicatas
                const notifId = `${evento.id}_${usuarioDoc.id}_${categoria}_${funcao}_${tempo}`;
                
                await setDoc(doc(db, "notificacoesPendentes", notifId), {
                    eventoId: evento.id,
                    eventoTitulo: evento.titulo,
                    eventoData: evento.data,
                    eventoHorario: evento.horario,
                    userId: usuarioDoc.id,
                    userName: usuario.nome,
                    userEmail: usuario.email,
                    categoria: categoria,
                    funcao: funcao,
                    habilidade: habilidade,
                    tempo: tempo,
                    criadoEm: new Date().toISOString(),
                    enviado: false
                });
                
                console.log(`📩 Notificação registrada: ${usuario.nome} - ${evento.titulo} (${categoria}/${funcao})`);
            }
        }
        
    } catch (error) {
        console.error("❌ Erro ao registrar notificação:", error);
    }
}

// ===== INICIAR VERIFICAÇÃO PERIÓDICA =====
export function iniciarVerificacaoPeriodica() {
    console.log("🔄 Sistema de verificação de vagas iniciado");
    
    // Verifica imediatamente
    verificarVagasENotificar();
    
    // Verifica a cada 1 hora
    setInterval(() => {
        verificarVagasENotificar();
    }, 60 * 60 * 1000);
}