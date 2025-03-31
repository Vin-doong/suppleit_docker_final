// frontend/src/pages/Auth/OAuth2Success.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const OAuth2Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const processOAuthSuccess = async () => {
      try {
        // URL에서 토큰과 이메일 파라미터 읽기
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const refreshToken = params.get('refreshToken');
        const email = params.get('email');
        
        if (!token) {
          setError('인증 토큰을 찾을 수 없습니다.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // 토큰 저장
        localStorage.setItem('accessToken', token);
        
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        // 사용자 정보 요청
        const userResponse = await axios.get('/api/member/info', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // 사용자 정보 저장
        localStorage.setItem('email', email || userResponse.data.email);
        localStorage.setItem('memberId', userResponse.data.memberId);
        localStorage.setItem('role', userResponse.data.memberRole || 'USER');
        
        // 상태 업데이트 이벤트 발생
        window.dispatchEvent(new Event('storage'));
        
        // 홈으로 리다이렉트
        navigate('/');
      } catch (error) {
        console.error('OAuth 성공 처리 중 오류:', error);
        setError('로그인 처리 중 오류가 발생했습니다.');
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };
    
    processOAuthSuccess();
  }, [location, navigate]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <h2>소셜 로그인 처리 중</h2>
        <p>잠시만 기다려주세요...</p>
        <div className="loading-spinner" style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <h2>로그인 오류</h2>
        <p>{error}</p>
        <p>잠시 후 로그인 페이지로 이동합니다...</p>
      </div>
    );
  }

  return null;
};

export default OAuth2Success;