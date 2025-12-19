import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { db } from './firebase-config.js';
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Configuração do Supabase
const SUPABASE_URL = 'https://jntljdsyapjvaorstitw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpudGxqZHN5YXBqdmFvcnN0aXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMDg3MDAsImV4cCI6MjA4MTY4NDcwMH0.1DXIkYT8evx6oO7sRHJH_Oc9TUHOPMo53SqMxawHc-Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== FAZER UPLOAD DE ARQUIVO =====
export async function uploadArquivo(arquivo, nomeExibicao, userId) {
    try {
        console.log('📤 Iniciando upload:', arquivo.name);
        
        // Gera nome único para o arquivo
        const timestamp = Date.now();
        const extensao = arquivo.name.split('.').pop();
        const nomeArquivo = `${timestamp}_${arquivo.name}`;
        
        // Faz upload no Supabase Storage
        const { data, error } = await supabase.storage
            .from('arquivos')
            .upload(nomeArquivo, arquivo, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('❌ Erro no upload:', error);
            return { sucesso: false, erro: error.message };
        }
        
        console.log('✅ Upload concluído:', data.path);
        
        // Pega URL pública
        const { data: urlData } = supabase.storage
            .from('arquivos')
            .getPublicUrl(nomeArquivo);
        
        // Salva metadados no Firestore
        const arquivoId = `arquivo_${timestamp}`;
        await setDoc(doc(db, 'arquivos', arquivoId), {
            id: arquivoId,
            nomeOriginal: arquivo.name,
            nomeExibicao: nomeExibicao,
            nomeArquivo: nomeArquivo,
            url: urlData.publicUrl,
            tamanho: arquivo.size,
            tipo: arquivo.type,
            extensao: extensao,
            uploadPor: userId,
            criadoEm: new Date().toISOString()
        });
        
        console.log('💾 Metadados salvos no Firestore');
        
        return { 
            sucesso: true, 
            arquivo: {
                id: arquivoId,
                nomeExibicao: nomeExibicao,
                url: urlData.publicUrl
            }
        };
        
    } catch (error) {
        console.error('❌ Erro ao fazer upload:', error);
        return { sucesso: false, erro: error.message };
    }
}

// ===== BUSCAR TODOS OS ARQUIVOS =====
export async function buscarArquivos() {
    try {
        const querySnapshot = await getDocs(collection(db, 'arquivos'));
        const arquivos = [];
        
        querySnapshot.forEach((doc) => {
            arquivos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Ordena por data (mais recente primeiro)
        arquivos.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
        
        return { sucesso: true, arquivos: arquivos };
        
    } catch (error) {
        console.error('❌ Erro ao buscar arquivos:', error);
        return { sucesso: false, erro: error.message };
    }
}

// ===== EXCLUIR ARQUIVO =====
export async function excluirArquivo(arquivoId, nomeArquivo) {
    try {
        console.log('🗑️ Excluindo arquivo:', arquivoId);
        
        // Remove do Supabase Storage
        const { error } = await supabase.storage
            .from('arquivos')
            .remove([nomeArquivo]);
        
        if (error) {
            console.error('⚠️ Erro ao remover do storage:', error);
            // Continua mesmo com erro, pois pode já ter sido removido
        }
        
        // Remove metadados do Firestore
        await deleteDoc(doc(db, 'arquivos', arquivoId));
        
        console.log('✅ Arquivo excluído com sucesso');
        
        return { sucesso: true };
        
    } catch (error) {
        console.error('❌ Erro ao excluir arquivo:', error);
        return { sucesso: false, erro: error.message };
    }
}

// ===== ATUALIZAR NOME DE EXIBIÇÃO =====
export async function atualizarNomeArquivo(arquivoId, novoNome) {
    try {
        await updateDoc(doc(db, 'arquivos', arquivoId), {
            nomeExibicao: novoNome,
            atualizadoEm: new Date().toISOString()
        });
        
        return { sucesso: true };
        
    } catch (error) {
        console.error('❌ Erro ao atualizar nome:', error);
        return { sucesso: false, erro: error.message };
    }
}

// ===== FORMATAR TAMANHO DO ARQUIVO =====
export function formatarTamanho(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ===== VALIDAR TIPO DE ARQUIVO =====
export function validarTipoArquivo(arquivo) {
    const tiposPermitidos = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];
    
    return tiposPermitidos.includes(arquivo.type);
}

export { supabase };