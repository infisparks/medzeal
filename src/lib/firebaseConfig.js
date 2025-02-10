// lib/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBbLohk17rZT8-BfXhsRvzhq9C-eAVkCWk",
  authDomain: "medzeal-c5d31.firebaseapp.com",
  databaseURL: "https://medzeal-c5d31-default-rtdb.firebaseio.com",
  projectId: "medzeal-c5d31",
  storageBucket: "medzeal-c5d31.appspot.com",
  messagingSenderId: "222700687597",
  appId: "1:222700687597:web:2eaa3fab44711b6a79fce4"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app); 
export { app, db ,storage ,auth}; // Named export for db
