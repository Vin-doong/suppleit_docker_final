import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const GoogleCallback = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // URL에서 인증 코드 가져오기
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        
        if (!code) {
          throw new Error('인증 코드를 찾을 수 없습니다');
        }

        console.log('구글 인증 코드 받음:', code.substring(0, 10) + '...');

        // 백엔드 API 호출
        const response = await axios.post('/api/social/login/google', { code }, {
          headers: { 'Content-Type': 'application/json' }
        });

        console.log('구글 로그인 응답:', response.data);

        if (response.data && response.data.data) {
          const responseData = response.data.data;
          
          // 토큰 및 사용자 정보 저장
          localStorage.setItem('accessToken', responseData.accessToken);
          localStorage.setItem('refreshToken', responseData.refreshToken);
          localStorage.setItem('memberId', responseData.member.memberId);
          localStorage.setItem('email', responseData.member.email);
          localStorage.setItem('role', responseData.member.memberRole || 'USER');
          
          // 로그인 상태 업데이트 이벤트 발생
          window.dispatchEvent(new Event('storage'));
          
          // 홈페이지로 이동
          navigate('/');
        } else {
          throw new Error('서버에서 토큰을 받지 못했습니다');
        }
      } catch (error) {
        console.error('구글 로그인 오류:', error);
        console.error('오류 응답:', error.response?.data);
        setError(`구글 로그인 처리 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
        setTimeout(() => navigate('/login'), 5000);
      } finally {
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [location, navigate]);

  // 로딩 및 에러 UI는 유지
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
        <h2>구글 로그인 처리 중</h2>
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
        <p>5초 후 로그인 페이지로 이동합니다...</p>
      </div>
    );
  }

  return null;
};

export default GoogleCallback;