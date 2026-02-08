import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const COUNTER_DOC = 'counters/userIdCounter';

/**
 * Get the next sequential user display ID.
 * Uses a Firestore counter document for atomicity.
 */
export async function getNextUserId() {
    const counterRef = doc(db, COUNTER_DOC);
    const counterSnap = await getDoc(counterRef);

    if (counterSnap.exists()) {
        const current = counterSnap.data().current || 20260000;
        const next = current + 1;
        await updateDoc(counterRef, { current: next });
        return next;
    } else {
        // Initialize counter - find the highest existing displayId
        let maxId = 20260000;
        try {
            const usersQuery = query(collection(db, 'users'), orderBy('displayId', 'desc'), limit(1));
            const snapshot = await getDocs(usersQuery);
            if (!snapshot.empty) {
                const highestId = snapshot.docs[0].data().displayId;
                if (highestId && highestId > maxId) {
                    maxId = highestId;
                }
            }
        } catch (e) {
            // If query fails (no index), start from default
        }

        const next = maxId + 1;
        await setDoc(counterRef, { current: next });
        return next;
    }
}

/**
 * Ensure a user has a display ID assigned.
 * If preferredId is provided and available, use it.
 * Otherwise, get the next sequential ID.
 */
export async function ensureUserDisplayId(uid, preferredId = null) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().displayId) {
        return userSnap.data().displayId;
    }

    let assignedId;

    if (preferredId) {
        // Check if preferred ID is already taken
        const usersQuery = query(collection(db, 'users'));
        const snapshot = await getDocs(usersQuery);
        const taken = snapshot.docs.some(d => d.data().displayId === preferredId);

        if (!taken) {
            assignedId = preferredId;
        } else {
            assignedId = await getNextUserId();
        }
    } else {
        assignedId = await getNextUserId();
    }

    await updateDoc(userRef, { displayId: assignedId });
    return assignedId;
}
