"use client";

// Auth context for user authentication and subscription management
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  User,
  onAuthChange,
  signIn,
  signUp,
  signOut,
  signInWithGoogle,
} from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isSubscribed: boolean;
  subscriptionLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createCheckout: () => Promise<{
    id: string;
    checkout_url?: string;
    hosted_checkout_url?: string;
  }>;
  cancelSubscription: () => void;
  activateSubscription: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const initAuth = () => {
      unsubscribe = onAuthChange((authUser) => {
        if (isMounted) {
          setUser(authUser);
          // Load subscription status from localStorage keyed by user ID
          if (authUser) {
            const stored = localStorage.getItem(
              `2heal_subscribed_${authUser.uid}`,
            );
            setIsSubscribed(stored === "true");
          } else {
            setIsSubscribed(false);
          }
          setLoading(false);
        }
      });

      setTimeout(() => {
        if (isMounted && loading) {
          setLoading(false);
        }
      }, 1000);
    };

    initAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Anmeldung fehlgeschlagen";
      if (message.includes("invalid-credential")) {
        setError("Ungueltige E-Mail oder Passwort");
      } else if (message.includes("user-not-found")) {
        setError("Benutzer nicht gefunden");
      } else if (message.includes("wrong-password")) {
        setError("Falsches Passwort");
      } else {
        setError(message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google-Anmeldung fehlgeschlagen";
      if (!message.includes("popup-closed-by-user")) {
        setError(message);
      }
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await signUp(email, password);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registrierung fehlgeschlagen";
      if (message.includes("email-already-in-use")) {
        setError("Diese E-Mail wird bereits verwendet");
      } else if (message.includes("weak-password")) {
        setError("Passwort muss mindestens 6 Zeichen lang sein");
      } else if (message.includes("invalid-email")) {
        setError("Ungueltige E-Mail-Adresse");
      } else {
        setError(message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut();
    } catch (err) {
      setError("Abmeldung fehlgeschlagen");
      throw err;
    }
  };

  const createCheckout = async () => {
    // Use Firebase Auth directly in case React state hasn't updated yet
    const { getFirebaseAuth } = await import("@/lib/firebase");
    const firebaseAuth = getFirebaseAuth();
    const currentUser = firebaseAuth?.currentUser || user;

    if (!currentUser || !currentUser.email)
      throw new Error("Benutzer nicht angemeldet");

    setSubscriptionLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          email: currentUser.email,
        }),
      });

      if (!response.ok) throw new Error("Checkout-Fehler");

      const checkout = await response.json();
      return checkout;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout-Fehler";
      setError(message);
      throw err;
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const cancelSubscription = () => {
    if (!user) return;
    localStorage.removeItem(`2heal_subscribed_${user.uid}`);
    setIsSubscribed(false);
  };

  const activateSubscription = () => {
    const { getFirebaseAuth } = require("@/lib/firebase");
    const auth = getFirebaseAuth();
    const uid = auth?.currentUser?.uid || user?.uid;
    if (uid) {
      localStorage.setItem(`2heal_subscribed_${uid}`, "true");
      setIsSubscribed(true);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isSubscribed,
        subscriptionLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        createCheckout,
        cancelSubscription,
        activateSubscription,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
