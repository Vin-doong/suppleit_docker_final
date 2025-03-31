// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// 인증 컨텍스트 생성
export const AuthContext = createContext(null);

// 인증 제공자 컴포넌트
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 사용자 역할 상태 추가

  useEffect(() => {
    // 토큰 확인 등의 초기화 작업
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('role');
    
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role); // 역할 정보 설정
      
      // API 호출로 사용자 정보 가져오기 (생략)
      setCurrentUser({ email: "example@email.com", role: role }); // 임시
    }
    
    setLoading(false);
    
    // 스토리지 이벤트 리스너 추가
    const handleStorageChange = () => {
      const updatedToken = localStorage.getItem('accessToken');
      const updatedRole = localStorage.getItem('role');
      
      setIsAuthenticated(!!updatedToken);
      setUserRole(updatedRole);
      
      if (updatedToken) {
        setCurrentUser({ email: "example@email.com", role: updatedRole }); // 임시
      } else {
        setCurrentUser(null);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 로그인 함수
  const login = (userData, tokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    
    // 역할 정보 저장 추가
    if (userData && userData.memberRole) {
      localStorage.setItem('role', userData.memberRole);
      setUserRole(userData.memberRole);
    } else {
      localStorage.setItem('role', 'USER');
      setUserRole('USER');
    }
    
    setCurrentUser(userData);
    setIsAuthenticated(true);
  };

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role'); // 역할 정보도 제거
    setCurrentUser(null);
    setIsAuthenticated(false);
    setUserRole(null); // 역할 정보 초기화
  };

  const value = {
    currentUser,
    loading,
    isAuthenticated,
    userRole, // 역할 정보 추가
    isAdmin: userRole === 'ADMIN', // 관리자 여부 편의 속성 추가
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 인증 컨텍스트 사용을 위한 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서 사용해야 합니다');
  }
  return context;
};