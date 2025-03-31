// src/pages/Auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState({});
  const navigate = useNavigate();

  // OAuth 제공자 정보 로드
  useEffect(() => {
    const loadOAuthProviders = async () => {
      try {
        const response = await axios.get('/api/oauth2/providers');
        setOauthProviders(response.data);
        console.log('OAuth 제공자 정보 로드 완료:', response.data);
      } catch (error) {
        console.error('OAuth 제공자 정보 로드 실패:', error);
      }
    };
    
    loadOAuthProviders();
  }, []);

  // 일반 로그인 처리 함수
  const handleLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      console.log("로그인 시도:", email, password);

      // 백엔드 API 호출
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      console.log("로그인 응답:", response.data);

      // 로그인 성공한 경우
      if (response.data.accessToken) {
        // 토큰 저장
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);

        // 사용자 정보 요청 및 역할 저장
        try {
          const userInfoResponse = await axios.get('/api/member/info', {
            headers: {
              'Authorization': `Bearer ${response.data.accessToken}`
            }
          });
        
          // 역할 정보 저장 (ADMIN 또는 USER)
          localStorage.setItem('role', userInfoResponse.data.memberRole);
          localStorage.setItem('email', userInfoResponse.data.email);
          localStorage.setItem('memberId', userInfoResponse.data.memberId);
          
          // 로그인 상태 업데이트를 위한 이벤트 발생
          window.dispatchEvent(new Event('storage'));
          
          // 홈페이지로 이동
          navigate('/');
        } catch (userInfoError) {
          console.error('사용자 정보 요청 오류:', userInfoError);
          setError('사용자 정보를 가져오는 중 오류가 발생했습니다.');
        }
      } else {
        setError('로그인에 실패했습니다. 응답에 토큰이 없습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setError(error.response?.data?.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 로그인 처리 함수
  const handleGoogleLogin = () => {
    try {
      setIsLoading(true);
      
      // 구글 OAuth URL 구성 (도커 환경에서도 작동하는 URL 구성)
      const clientId = '286893397263-o0opr0c1et57me60o8sq5ccdf836js75.apps.googleusercontent.com';
      const redirectUri = encodeURIComponent('http://localhost/callback/google');
      const scope = encodeURIComponent('email profile');
      const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
      
      console.log('구글 로그인 URL로 이동:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('구글 로그인 오류:', error);
      setError('구글 로그인 처리 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 네이버 로그인 처리 함수 - 리다이렉트 URI 수정
  const handleNaverLogin = () => {
    try {
      setIsLoading(true);
      
      // 네이버 OAuth URL 구성 (현재 URL을 기반으로 동적 생성)
      const clientId = 'M_qS71BqoG7oESo3_thQ';
      const redirectUri = encodeURIComponent(`${window.location.origin}/callback/naver`);
      const state = [...Array(30)].map(() => (~~(Math.random() * 36)).toString(36)).join('');
      
      // CSRF 보호를 위해 state 저장
      sessionStorage.setItem('naverState', state);
      
      // URL에 state 파라미터 추가
      const authUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;      
      
      console.log('네이버 로그인 URL로 이동:', authUrl);
      console.log('네이버 상태 값 저장:', state);
      window.location.href = authUrl;
    } catch (error) {
      console.error('네이버 로그인 오류:', error);
      setError('네이버 로그인 처리 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };


  return (
    <div className="login-container"
      style={{
        backgroundImage: "url('/images/back.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="login-box">
        <h2>로그인</h2>

        {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

        <div className="input-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <button 
          className="login-button" 
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>

        <div className="signup-link">
          <p>계정이 없으신가요? <a href="/signup">회원가입</a></p>
          <p><a href="/find-password">비밀번호를 잊으셨나요?</a></p>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="social-login">
          <button className="social-button google" onClick={handleGoogleLogin} disabled={isLoading}>
            <img src="/images/Google.png" alt="구글 로그인" className="social-icon" />
          </button>
          <button className="social-button naver" onClick={handleNaverLogin} disabled={isLoading}>
            <img src="/images/Naver.png" alt="네이버 로그인" className="social-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;