import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createWallet } from '../services/api'; 

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재 세션 확인
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
      } catch (error) {
        console.error('인증 상태 확인 중 오류 발생:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

   // user가 로그인되면 wallet 존재 여부 확인 후 생성
  useEffect(() => {
    const ensureWallet = async () => {
      if (!user?.id) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('wallet_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ wallet 조회 실패:', error);
        return;
      }

      if (!profile?.wallet_id) {
        console.log('🧾 wallet_id 없음, 자동 생성 시작:', user.id);
        try {
          await createWallet(user.id);
          console.log('✅ wallet 생성 완료');
        } catch (err) {
          console.error('❌ wallet 생성 실패:', err.message);
        }
      }
    };

    ensureWallet();
  }, [user?.id]); // user가 바뀔 때마다 실행됨

  const value = {
    user,
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
    signInWithGoogle: () => supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:8001/signup',  // 서버 포트로 변경
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 반드시 AuthProvider 내부에서 사용해야 합니다');
  }
  return context;
}; 