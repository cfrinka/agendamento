import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/lib/types';

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setFirebaseUser(firebaseUser);

            if (firebaseUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

                    if (userDoc.exists()) {
                        setUser({ id: userDoc.id, ...userDoc.data() } as User);
                    } else {
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            console.error('Sign in error:', error);
            throw new Error(getAuthErrorMessage(error.code));
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setFirebaseUser(null);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            console.error('Sign up error:', error);
            throw new Error(getAuthErrorMessage(error.code));
        }
    };

    return (
        <AuthContext.Provider value= {{ user, firebaseUser, loading, signIn, signOut, signUp }
}>
    { children }
    </AuthContext.Provider>
  );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

function getAuthErrorMessage(code: string): string {
    switch (code) {
        case 'auth/user-not-found':
            return 'Usuário não encontrado';
        case 'auth/wrong-password':
            return 'Senha incorreta';
        case 'auth/email-already-in-use':
            return 'Email já está em uso';
        case 'auth/weak-password':
            return 'Senha muito fraca';
        case 'auth/invalid-email':
            return 'Email inválido';
        case 'auth/too-many-requests':
            return 'Muitas tentativas. Tente novamente mais tarde';
        default:
            return 'Erro ao autenticar. Tente novamente';
    }
}
