import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  signUp: (email: string, password: string, metadata: { full_name: string; phone: string; address: string; province?: string; municipality?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGestor, setIsGestor] = useState(false);

  const checkRoles = async (userId: string) => {
    try {
      const { data: adminData } = await supabase.rpc('is_admin', { _user_id: userId });
      setIsAdmin(!!adminData);
      const { data: gestorData } = await supabase.rpc('is_gestor', { _user_id: userId });
      setIsGestor(!!gestorData);
    } catch {
      setIsAdmin(false);
      setIsGestor(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => checkRoles(session.user.id), 0);
        } else {
          setIsAdmin(false);
          setIsGestor(false);
        }
        
        setLoading(false);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkRoles(session.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, metadata: { full_name: string; phone: string; address: string; province?: string; municipality?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      // Create profile after signup
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: data.user.id,
          full_name: metadata.full_name,
          phone: metadata.phone,
          address: metadata.address,
          province: metadata.province || null,
          municipality: metadata.municipality || null,
          email: email,
        });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        // Send welcome email (fire and forget)
        supabase.functions.invoke('send-welcome-email', {
          body: {
            customerEmail: email,
            customerName: metadata.full_name,
          },
        }).then(() => {
          console.log('Welcome email sent');
        }).catch((emailError) => {
          console.error('Error sending welcome email:', emailError);
        });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsGestor(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isGestor, signUp, signIn, signOut }}>
      {children}
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
