// pages/login.js
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { app } from '@/lib/firebaseConfig'; // Adjust the path as necessary
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

const LoginPage = () => {
  
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to home
        router.push('/');
      }
      
    });

    return () => unsubscribe(); // Clean up subscription
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists in the database
      const userRef = ref(db, 'users/' + user.uid);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        // If the user doesn't exist in the database, store their details
        await set(userRef, {
          email: user.email,
          uid: user.uid,
        });
        console.log("New user data saved to database");
      } else {
        console.log("User already exists in database");
      }

      console.log("User Info: ", user);
      router.push('/'); // Redirect to home after successful login
    } catch (error) {
      setError('Failed to sign in with Google. Please try again.');
      console.error("Error during sign in:", error);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="bg-white rounded shadow p-4" style={{ width: '400px' }}>
        <h1 className="text-center text-primary">Login</h1>
        {error && <p className="text-danger text-center">{error}</p>}
        <button 
          className="btn btn-primary w-100 mt-3"
          onClick={handleGoogleSignIn}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
