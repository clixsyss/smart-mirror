import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAur1VKqvq2qAMl5qPfkpcu0nqD53VD4Lg",
  authDomain: "clixsys-4d367.firebaseapp.com",
  projectId: "clixsys-4d367",
  storageBucket: "clixsys-4d367.firebasestorage.app",
  messagingSenderId: "775251400128",
  appId: "1:775251400128:web:2fe2decdd9c49ef39a6425",
  measurementId: "G-XZX0B7TMSR"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.')
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.')
  }
})

export { auth, db }