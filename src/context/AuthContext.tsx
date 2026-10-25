import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import i18n from "../lib/i18n";
import { clearInMemoryData } from "../store";

export function getFriendlyAuthErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: string }).code);
    switch (code) {
      case "auth/invalid-email":
        return i18n.t("auth.invalidEmail");
      case "auth/user-disabled":
        return i18n.t("auth.userDisabled");
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return i18n.t("auth.invalidCredential");
      case "auth/email-already-in-use":
        return i18n.t("auth.emailInUse");
      case "auth/weak-password":
        return i18n.t("auth.passwordMin");
      case "auth/popup-closed-by-user":
        return i18n.t("auth.popupClosed");
      case "auth/popup-blocked":
        return i18n.t("auth.popupBlocked");
      case "auth/network-request-failed":
        return i18n.t("auth.networkFailed");
      case "auth/too-many-requests":
        return i18n.t("auth.tooManyRequests");
      case "auth/unauthorized-domain":
        return i18n.t("auth.unauthorizedDomain");
      case "auth/operation-not-allowed":
        return i18n.t("auth.operationNotAllowed");
      case "auth/account-exists-with-different-credential":
        return i18n.t("auth.accountExistsDifferentCredential");
      default:
        return (
          (error as { message?: string }).message ||
          i18n.t("auth.failed")
        );
    }
  }
  return i18n.t("auth.unexpectedError");
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let prevUid: string | null = null;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser || (prevUid && currentUser.uid !== prevUid)) {
        clearInMemoryData();
      }
      prevUid = currentUser ? currentUser.uid : null;
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    clearInMemoryData();
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
