import { db } from '../config/firebase.config.js';
import { 
    collection, 
    onSnapshot, 
    doc, 
    updateDoc, 
    query, 
    orderBy, 
    serverTimestamp,
    addDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const leadService = {
    /**
     * Suscribirse a los leads en tiempo real para el pipeline
     * @param {Function} callback - Función que recibe la lista de leads
     */
    subscribeToLeads(callback) {
        const leadsRef = collection(db, 'leads_inbox');
        const q = query(leadsRef, orderBy('timestamp', 'desc'));
        
        return onSnapshot(q, (snapshot) => {
            const leads = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(leads);
        }, (error) => {
            console.error("Error al escuchar leads:", error);
        });
    },

    /**
     * Actualizar el estado de un lead (Pipeline)
     * @param {string} leadId - ID del documento
     * @param {string} newStatus - 'new' | 'contacted' | 'audit' | 'closed'
     */
    async updateLeadStatus(leadId, newStatus) {
        const leadRef = doc(db, 'leads_inbox', leadId);
        try {
            await updateDoc(leadRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error("Error al actualizar lead:", error);
            return { error };
        }
    },

    /**
     * Guardar una sesión de chat como lead
     */
    async saveChatLead(leadData, history) {
        try {
            const docRef = await addDoc(collection(db, 'leads_inbox'), {
                ...leadData,
                history,
                timestamp: serverTimestamp(),
                source: 'chatbot_planes',
                status: 'new'
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Error al guardar lead del chat:", error);
            return { error };
        }
    }
};
