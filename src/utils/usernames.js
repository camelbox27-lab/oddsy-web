import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

/**
 * usernames/{key} -> { uid, email, username }
 *
 * Girişte kullanıcı adını e-postaya çevirmek için kullanılır. Eskiden bu işlem
 * tüm users koleksiyonunu sorgulayarak yapılıyordu ve bu yüzden users listesi
 * herkese açık olmak zorundaydı. Bu küçük eşleme koleksiyonu sayesinde users
 * listesi artık sadece adminlere açık.
 */

// Kullanıcı adını döküman anahtarına çevirir (küçük harf, Türkçe duyarlı)
export function usernameKey(username = '') {
    const normalized = String(username).trim().toLocaleLowerCase('tr');
    if (!normalized) return '';
    // Firestore döküman id'sinde "/" kullanılamaz, "." ve ".." de geçersizdir
    const safe = normalized.replace(/\//g, '_');
    if (safe === '.' || safe === '..') return '';
    // Firestore döküman id sınırı 1500 byte; fazlasını kırp
    return safe.slice(0, 200);
}

// Giriş ekranı: kullanıcı adından e-posta bulur, yoksa null döner
export async function lookupEmailByUsername(username) {
    const key = usernameKey(username);
    if (!key) return null;
    const snap = await getDoc(doc(db, 'usernames', key));
    if (!snap.exists()) return null;
    return snap.data()?.email || null;
}

// Kayıt ekranı: kullanıcı adı başkası tarafından alınmış mı?
export async function isUsernameTaken(username, ownUid = null) {
    const key = usernameKey(username);
    if (!key) return false;
    const snap = await getDoc(doc(db, 'usernames', key));
    if (!snap.exists()) return false;
    return snap.data()?.uid !== ownUid;
}

// Kayıt sırasında eşlemeyi oluşturur
export async function reserveUsername(username, uid, email) {
    const key = usernameKey(username);
    if (!key || !uid) return;
    await setDoc(doc(db, 'usernames', key), {
        uid,
        email: email || null,
        username: String(username).trim(),
        updatedAt: serverTimestamp()
    });
}

// Girişten sonra eksik eşlemeyi tamamlar (eski üyeler için kendi kendine onarım)
export async function ensureUsernameMapping(username, uid, email) {
    const key = usernameKey(username);
    if (!key || !uid) return;
    try {
        const snap = await getDoc(doc(db, 'usernames', key));
        // Eşleme varsa ve bu kullanıcıya aitse dokunma
        if (snap.exists() && snap.data()?.uid === uid) return;
        // Eşleme başka birine aitse üzerine yazma
        if (snap.exists()) return;
        await reserveUsername(username, uid, email);
    } catch (err) {
        console.error('Kullanıcı adı eşlemesi oluşturulamadı:', err);
    }
}

/**
 * Admin paneli: mevcut tüm üyeler için eksik eşlemeleri toplu oluşturur.
 * users listesi zaten panelde yüklü olduğu için ekstra okuma yapmaz.
 * { created, skipped, failed } döner.
 */
export async function backfillUsernameMappings(users = []) {
    let created = 0;
    let skipped = 0;
    let failed = 0;

    const seen = new Set();
    const pending = [];

    for (const u of users) {
        const key = usernameKey(u?.username);
        const uid = u?.uid || u?.id;
        if (!key || !uid || seen.has(key)) {
            skipped++;
            continue;
        }
        seen.add(key);
        pending.push({ key, uid, email: u?.email || null, username: String(u.username).trim() });
    }

    // Firestore batch limiti 500; 400'lük gruplar halinde yaz
    const CHUNK = 400;
    for (let i = 0; i < pending.length; i += CHUNK) {
        const chunk = pending.slice(i, i + CHUNK);
        const batch = writeBatch(db);
        for (const item of chunk) {
            batch.set(doc(db, 'usernames', item.key), {
                uid: item.uid,
                email: item.email,
                username: item.username,
                updatedAt: serverTimestamp()
            }, { merge: true });
        }
        try {
            await batch.commit();
            created += chunk.length;
        } catch (err) {
            console.error('Eşleme grubu yazılamadı:', err);
            failed += chunk.length;
        }
    }

    return { created, skipped, failed };
}
