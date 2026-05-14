import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, role, additionalData) {
    console.log("Starting signup for:", email);
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
    console.log("Auth user created:", user.uid);
    
    const userDoc = {
      uid: user.uid,
      email,
      role,
      ...additionalData,
      createdAt: new Date().toISOString()
    };
    
    console.log("Attempting to save user to Firestore...");
    try {
      await setDoc(doc(db, 'users', user.uid), userDoc);
      console.log("User doc saved successfully");
    } catch (dbError) {
      console.error("Firestore Error:", dbError);
      throw new Error("Auth worked, but database failed: " + dbError.message);
    }
    
    setUserData(userDoc);
    return res;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function loginWithGoogle() {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    
    // Check if user already exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      // If new user, default to 'donor' or ask for role later
      const newUserDoc = {
        uid: user.uid,
        email: user.email,
        role: 'donor', // Default role
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString()
      };
      await setDoc(userDocRef, newUserDoc);
      setUserData(newUserDoc);
    } else {
      setUserData(userDocSnap.data());
    }
    
    return res;
  }

  async function updateUserData(newData) {
    if (!currentUser) {
      console.error("No current user - cannot update");
      throw new Error("User not authenticated");
    }
    try {
      if (!db) {
        throw new Error("Firestore database not initialized");
      }
      const userDocRef = doc(db, 'users', currentUser.uid);
      console.log("Updating user data for:", currentUser.uid);
      console.log("Data to save:", { ...userData, ...newData });
      await setDoc(userDocRef, { ...userData, ...newData, updatedAt: new Date().toISOString() }, { merge: true });
      setUserData(prev => ({ ...prev, ...newData }));
      console.log("User data updated successfully");
    } catch (error) {
      console.error("Failed to update user data:", {
        message: error.message,
        code: error.code,
        name: error.name
      });
      throw error;
    }
  }

  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth is not initialized. Check your configuration.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? user.uid : "no user");
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            console.log("User data found:", userDocSnap.data());
            setUserData(userDocSnap.data());
          } else {
            console.log("No user document found in Firestore");
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    // Timeout to prevent infinite loading screen
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth initialization timed out.");
        setLoading(false);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const value = {
    currentUser,
    userData,
    signup,
    login,
    logout,
    resetPassword,
    loginWithGoogle,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
