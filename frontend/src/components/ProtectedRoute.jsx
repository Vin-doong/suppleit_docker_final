import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 인증 상태 확인
    const token = localStorage.getItem('accessToken');
    const isAuth = !!token;
    
    if (!isAuth) {
      // 인증되지 않은 경우 알림 표시
      alert('로그인이 필요한 페이지입니다.');
      
      // 로그인 페이지로 이동하고 히스토리 대체 (replace: true)
      navigate('/login', { replace: true });
    } else {
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, [navigate]);

  // 로딩 중에는 로딩 화면 표시
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }
  
  // 인증된 경우에만 자식 컴포넌트 렌더링
  return isAuthenticated ? children : null;
};

export default ProtectedRoute;