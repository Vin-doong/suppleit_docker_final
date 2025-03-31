import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { findPassword } from '../../services/api';
import '../Auth/Login.css';
import Header from '../../components/include/Header';
import Swal from 'sweetalert2';

const FindPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [step, setStep] = useState(1); // 1: 정보 입력, 2: 임시 비밀번호 표시
  
  // 이메일 유효성 검사
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !nickname) {
      setError('이메일과 닉네임을 모두 입력해주세요.');
      return;
    }

    // 이메일 형식 검사
    if (!validateEmail(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    try {
      setLoading(true);
      
      // 백엔드 API 호출 - 이메일과 닉네임으로 사용자 확인 및 임시 비밀번호 발급
      const response = await findPassword(email, nickname);
      
      if (response.data.success && response.data.tempPassword) {
        // 임시 비밀번호 저장 및 다음 단계로 이동
        setTempPassword(response.data.tempPassword);
        setStep(2);
        
        // 성공 메시지 표시
        Swal.fire({
          title: '임시 비밀번호 발급 완료',
          text: '임시 비밀번호가 발급되었습니다. 로그인 후 비밀번호를 변경해주세요.',
          icon: 'success',
          confirmButtonColor: '#2A9D8F'
        });
      } else {
        setError(response.data.message || '비밀번호 찾기에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 찾기 오류:', error);
      setError(error.response?.data?.message || '서버와의 통신 중 오류가 발생했습니다.');
      
      // 오류 메시지 표시
      Swal.fire({
        title: '처리 오류',
        text: error.response?.data?.message || '서버와의 통신 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonColor: '#2A9D8F'
      });
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 복사 함수
  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(tempPassword);
    Swal.fire({
      title: '복사 완료',
      text: '임시 비밀번호가 클립보드에 복사되었습니다.',
      icon: 'success',
      confirmButtonColor: '#2A9D8F',
      timer: 1500
    });
  };

  return (
    <>
      <Header />
      <div className="login-container"
        style={{
          backgroundImage: "url('/images/back.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="login-box">
          <h2>{step === 1 ? '비밀번호 찾기' : '임시 비밀번호 발급'}</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          {step === 1 ? (
            // 1단계: 계정 정보 입력
            <Form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email">이메일</label>
                <input
                  type="email"
                  id="email"
                  placeholder="가입한 이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="nickname">닉네임</label>
                <input
                  type="text"
                  id="nickname"
                  placeholder="가입 시 설정한 닉네임을 입력하세요"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>
              
              <button 
                className="login-button" 
                type="submit"
                disabled={loading}
              >
                {loading ? '처리 중...' : '임시 비밀번호 발급'}
              </button>
              
              <div className="signup-link">
                <p>
                  <a href="/login">로그인 페이지로 돌아가기</a>
                </p>
              </div>
            </Form>
          ) : (
            // 2단계: 임시 비밀번호 표시
            <div>
              <Alert variant="success">
                임시 비밀번호가 발급되었습니다. 로그인 후 비밀번호를 변경해주세요.
              </Alert>
              
              <div className="input-group">
                <label>임시 비밀번호</label>
                <div className="d-flex">
                  <input
                    type="text"
                    value={tempPassword}
                    readOnly
                    className="form-control"
                  />
                  <Button 
                    variant="outline-secondary"
                    className="ms-2"
                    onClick={copyPasswordToClipboard}
                  >
                    복사
                  </Button>
                </div>
              </div>
              
              <Alert variant="warning" className="mt-3">
                <strong>중요:</strong> 보안을 위해 로그인 후 반드시 비밀번호를 변경해주세요.
                <br />임시 비밀번호는 매우 취약할 수 있습니다.
              </Alert>
              
              <button 
                className="login-button" 
                onClick={() => navigate('/login')}
                style={{ marginTop: '20px' }}
              >
                로그인하기
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FindPassword;