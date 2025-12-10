// utils/crypto.ts
import * as SecureStore from 'expo-secure-store';
import { doc, updateDoc } from 'firebase/firestore';
import nacl from 'tweetnacl';
// DÜZELTME BURADA: 'as' ifadesi kaldırıldı, direkt orijinal isimler kullanıldı
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import { db } from '../app/(tabs)/index';

// 1. ANAHTARLARI OLUŞTUR VE KAYDET
export const generateAndStoreKeys = async (userId: string) => {
  try {
    const existingKey = await SecureStore.getItemAsync('my_private_key');
    if (existingKey) return; 

    const keyPair = nacl.box.keyPair();

    const privateKeyBase64 = encodeBase64(keyPair.secretKey);
    await SecureStore.setItemAsync('my_private_key', privateKeyBase64);

    const publicKeyBase64 = encodeBase64(keyPair.publicKey);
    
    await updateDoc(doc(db, "users", userId), { publicKey: publicKeyBase64 });
    try {
        await updateDoc(doc(db, "public_users", userId), { publicKey: publicKeyBase64 });
    } catch(e) {}

    console.log("Şifreleme anahtarları oluşturuldu.");
  } catch (error) {
    console.error("Anahtar oluşturma hatası:", error);
  }
};

// 2. MESAJ ŞİFRELEME
export const encryptMessage = async (text: string, receiverPublicKeyB64: string) => {
  try {
    const myPrivateKeyB64 = await SecureStore.getItemAsync('my_private_key');
    if (!myPrivateKeyB64) throw new Error("Gizli anahtar bulunamadı!");

    const myPrivateKey = decodeBase64(myPrivateKeyB64);
    const receiverPublicKey = decodeBase64(receiverPublicKeyB64);

    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageUint8 = new TextEncoder().encode(text); 

    const encryptedBox = nacl.box(messageUint8, nonce, receiverPublicKey, myPrivateKey);

    const fullMessage = {
      ciphertext: encodeBase64(encryptedBox),
      nonce: encodeBase64(nonce)
    };

    return JSON.stringify(fullMessage);

  } catch (e) {
    console.error("Şifreleme hatası:", e);
    return null;
  }
};

// 3. MESAJ ÇÖZME
export const decryptMessage = async (encryptedDataString: string, senderPublicKeyB64: string) => {
  try {
    let encryptedData;
    try {
        encryptedData = JSON.parse(encryptedDataString);
    } catch {
        return encryptedDataString; 
    }

    if (!encryptedData.ciphertext || !encryptedData.nonce) return "Şifreleme hatası";

    const myPrivateKeyB64 = await SecureStore.getItemAsync('my_private_key');
    if (!myPrivateKeyB64) return "Anahtar yok";

    const myPrivateKey = decodeBase64(myPrivateKeyB64);
    const senderPublicKey = decodeBase64(senderPublicKeyB64);
    const nonce = decodeBase64(encryptedData.nonce);
    const ciphertext = decodeBase64(encryptedData.ciphertext);

    const decrypted = nacl.box.open(ciphertext, nonce, senderPublicKey, myPrivateKey);

    if (!decrypted) return "Mesaj çözülemedi (Anahtar değişmiş olabilir)";

    return new TextDecoder().decode(decrypted);

  } catch (e) {
    return "🔒 Şifreli Mesaj";
  }
};