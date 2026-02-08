import { db } from '../firebaseConfig';
import { doc, runTransaction, getDoc, setDoc } from 'firebase/firestore';

/**
 * Gets the next sequential User ID (format: 2026xxxx)
 * Starts from 20260001
 */
export async function getNextUserId() {
    const counterRef = doc(db, 'counters', 'user_id_counter');

    return await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);

        let nextId;
        if (!counterDoc.exists()) {
            nextId = 20260001;
            transaction.set(counterRef, { lastId: nextId });
        } else {
            nextId = counterDoc.data().lastId + 1;
            transaction.update(counterRef, { lastId: nextId });
        }

        return nextId;
    });
}

/**
 * Ensures a user has a displayId. If not, assigns one.
 * Useful for legacy users.
 */
export async function ensureUserDisplayId(userId, forceId = null) {
    const userRef = doc(db, 'users', userId);

    return await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) return null;

        const userData = userDoc.data();
        if (userData.displayId) return userData.displayId;

        let nextId;
        if (forceId) {
            nextId = forceId;
            // Also need to update counter if we jump ahead
            const counterRef = doc(db, 'counters', 'user_id_counter');
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists() || counterDoc.data().lastId < nextId) {
                transaction.set(counterRef, { lastId: nextId }, { merge: true });
            }
        } else {
            const counterRef = doc(db, 'counters', 'user_id_counter');
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists()) {
                nextId = 20260001;
                transaction.set(counterRef, { lastId: nextId });
            } else {
                nextId = counterDoc.data().lastId + 1;
                transaction.update(counterRef, { lastId: nextId });
            }
        }

        transaction.update(userRef, { displayId: nextId });
        return nextId;
    });
}
