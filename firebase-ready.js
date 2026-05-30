// Firebase backend connect file

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSkIZLKkgdaK8jgJiPbP2klklBYB4l2Bk",
  authDomain: "shayari-76c31.firebaseapp.com",
  projectId: "shayari-76c31",
  storageBucket: "shayari-76c31.firebasestorage.app",
  messagingSenderId: "65887646075",
  appId: "1:65887646075:web:2d5a4b7123d38038484dde",
  measurementId: "G-W41JPKXMPD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export function watchLogin(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function fbRegister(email, password, profile = {}) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    profile,
    plan: "free",
    createdAt: Date.now(),
    updatedAt: Date.now()
  }, { merge: true });

  await setDoc(doc(db, "stores", uid), {
    ownerId: uid,
    storeName: profile.storeName || "",
    businessType: profile.businessType || "",
    bio: profile.bio || "",
    logoUrl: profile.logoUrl || "",
    createdAt: Date.now(),
    updatedAt: Date.now()
  }, { merge: true });

  return uid;
}

export async function fbLogin(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user.uid;
}

export async function fbGoogleLogin() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email || "",
    name: user.displayName || "",
    photoURL: user.photoURL || "",
    plan: "free",
    updatedAt: Date.now()
  }, { merge: true });

  await setDoc(doc(db, "stores", user.uid), {
    ownerId: user.uid,
    storeName: user.displayName || "",
    logoUrl: user.photoURL || "",
    updatedAt: Date.now()
  }, { merge: true });

  return user.uid;
}

export function setupRecaptcha(containerId = "recaptcha-container") {
  if (window.recaptchaVerifier) return window.recaptchaVerifier;

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible"
  });

  return window.recaptchaVerifier;
}

export async function fbSendOtp(phone) {
  const appVerifier = setupRecaptcha();
  window.confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
  return true;
}

export async function fbVerifyOtp(code) {
  if (!window.confirmationResult) {
    throw new Error("OTP pehle send karo");
  }

  const result = await window.confirmationResult.confirm(code);
  const user = result.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    phone: user.phoneNumber || "",
    plan: "free",
    updatedAt: Date.now()
  }, { merge: true });

  await setDoc(doc(db, "stores", user.uid), {
    ownerId: user.uid,
    updatedAt: Date.now()
  }, { merge: true });

  return user.uid;
}

export async function fbLogout() {
  await signOut(auth);
}

export async function saveUserData(uid, data) {
  await setDoc(doc(db, "stores", uid), {
    ...data,
    updatedAt: Date.now()
  }, { merge: true });
}

export async function loadUserData(uid) {
  const snap = await getDoc(doc(db, "stores", uid));
  return snap.exists() ? snap.data() : null;
}

export function listenUserData(uid, callback) {
  return onSnapshot(doc(db, "stores", uid), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export async function uploadStoreLogo(uid, file) {
  const logoRef = ref(storage, `store-logos/${uid}/${Date.now()}-${file.name}`);
  await uploadBytes(logoRef, file);
  const url = await getDownloadURL(logoRef);

  await saveUserData(uid, { logoUrl: url });

  return url;
}

export async function addUserItem(uid, collectionName, item) {
  const refCol = collection(db, "stores", uid, collectionName);
  const docRef = await addDoc(refCol, {
    ...item,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return docRef.id;
}

export async function getUserItems(uid, collectionName) {
  const refCol = collection(db, "stores", uid, collectionName);
  const snap = await getDocs(refCol);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));
}

export async function updateUserItem(uid, collectionName, itemId, data) {
  await updateDoc(doc(db, "stores", uid, collectionName, itemId), {
    ...data,
    updatedAt: Date.now()
  });
}

export async function deleteUserItem(uid, collectionName, itemId) {
  await deleteDoc(doc(db, "stores", uid, collectionName, itemId));
}

console.log("Firebase connected successfully");