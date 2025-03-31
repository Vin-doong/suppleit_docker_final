// src/pages/Auth/UpdateProfile.jsx (전체 코드)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Container, Card, ButtonGroup, ToggleButton, Alert } from "react-bootstrap";
import { getMemberInfo, updateMemberInfo, checkNickname, deleteMember, changePassword, checkAccountType } from '../../services/api';
import "../Auth/Signup.css";
import Header from "../../components/include/Header";
import Footer from "../../components/include/Footer";
import Swal from "sweetalert2";

const UpdateProfile = () => {
  const navigate = useNavigate();
  // 프로필 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    nickname: "",
    birthDate: "",
    gender: ""
  });
  
  // 비밀번호 관련 상태
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // 상태 관리
  const [originalNickname, setOriginalNickname] = useState("");
  const [nicknameValidation, setNicknameValidation] = useState({
    checked: false,
    available: false
  });
  const [isSocialAccount, setIsSocialAccount] = useState(false);
  const [socialType, setSocialType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 비밀번호 표시 상태
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 비밀번호 유효성 검사 상태
  const [validation, setValidation] = useState({
    passwordChecked: false,
    passwordMatch: false
  });
  
  // 현재 날짜 계산 (생년월일 최대값으로 사용)
  const today = new Date().toISOString().split('T')[0];

  // 컴포넌트가 마운트될 때 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // 계정 유형 확인 (소셜 계정 여부)
        const accountTypeResponse = await checkAccountType();
        setIsSocialAccount(accountTypeResponse.data.isSocialAccount);
        setSocialType(accountTypeResponse.data.socialType);
        
        // 사용자 정보 가져오기
        const response = await getMemberInfo();
        const userData = response.data;
        
        console.log("사용자 정보:", userData);
        
        // 원본 닉네임 저장 (중복 검사 시 필요)
        setOriginalNickname(userData.nickname || "");
        
        // 가져온 정보로 폼 데이터 설정
        setFormData({
          email: userData.email || "",
          nickname: userData.nickname || "",
          birthDate: userData.birth || "",
          // gender 값을 '남자' 또는 '여자'로 변환
          gender: userData.gender === "MALE" ? "남자" : 
                 userData.gender === "FEMALE" ? "여자" : ""
        });
        
        setLoading(false);
      } catch (error) {
        console.error("사용자 정보 가져오기 오류:", error);
        setError("사용자 정보를 불러오는데 실패했습니다.");
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // 닉네임 변경 시 유효성 검사 결과 초기화
  const handleNicknameChange = (e) => {
    setFormData({
      ...formData,
      nickname: e.target.value
    });
    
    // 원래 닉네임과 같으면 검사 완료 및 사용 가능 표시
    if (e.target.value === originalNickname) {
      setNicknameValidation({
        checked: true,
        available: true
      });
    } else {
      // 다른 닉네임이면 검사 필요
      setNicknameValidation({
        checked: false,
        available: false
      });
    }
  };

  // 일반 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // 비밀번호 유효성 검사
  const validatePassword = (password) => {
    // 최소 8자, 숫자와 특수문자 포함 필수
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    return regex.test(password);
  };
  
  // 새 비밀번호 입력 처리
  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    
    // 비밀번호 유효성 검사
    const isValid = validatePassword(value);
    
    // 비밀번호 일치 여부 확인
    const passwordsMatch = value === confirmPassword && value !== '';
    
    setValidation({
      passwordChecked: isValid,
      passwordMatch: passwordsMatch
    });
  };

  // 비밀번호 확인 입력 처리
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // 비밀번호 일치 여부 확인
    const passwordsMatch = newPassword === value && value !== '';
    
    setValidation({
      ...validation,
      passwordMatch: passwordsMatch
    });
  };

  // 닉네임 중복 검사
  const handleNicknameCheck = async () => {
    if (isSocialAccount) {
      Swal.fire({
        title: '수정 제한',
        text: "소셜 계정은 닉네임을 변경할 수 없습니다.",
        icon: 'warning',
        confirmButtonColor: '#2A9D8F'
      });
      return;
    }
    
    // 원래 닉네임과 같으면 중복 검사 없이 통과
    if (formData.nickname === originalNickname) {
      setNicknameValidation({
        checked: true,
        available: true
      });
      alert("현재 사용 중인 닉네임입니다.");
      return;
    }
    
    if (!formData.nickname) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    // 닉네임 길이 검사
    if (formData.nickname.length < 3 || formData.nickname.length > 20) {
      alert("닉네임은 3~20자 사이여야 합니다.");
      return;
    }

    // 닉네임 형식 검사 (영문, 숫자, 한글만)
    const nicknameRegex = /^[a-zA-Z0-9가-힣]+$/;
    if (!nicknameRegex.test(formData.nickname)) {
      alert("닉네임은 영문, 숫자, 한글만 사용할 수 있습니다.");
      return;
    }

    try {
      const response = await checkNickname(formData.nickname);
      console.log("닉네임 중복 확인 응답:", response.data);
      
      if (response.data.isAvailable) {
        setNicknameValidation({
          checked: true,
          available: true
        });
        Swal.fire({
          title: '사용 가능',
          text: '사용 가능한 닉네임입니다.',
          icon: 'success',
          confirmButtonColor: '#2A9D8F'
        });
      } else {
        setNicknameValidation({
          checked: true,
          available: false
        });
        Swal.fire({
          title: '사용 불가',
          text: '이미 사용 중인 닉네임입니다.',
          icon: 'error',
          confirmButtonColor: '#2A9D8F'
        });
      }
    } catch (error) {
      console.error("닉네임 중복 확인 오류:", error);
      Swal.fire({
        title: '확인 오류',
        text: '닉네임 중복 확인 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonColor: '#2A9D8F'
      });
    }
  };
  // 생년월일 유효성 검사 상태 추가
  const [birthdateError, setBirthdateError] = useState("");

  // 생년월일 변경 핸들러 수정
  const handleBirthdateChange = (e) => {
    const selectedDate = e.target.value;
    
    // 오늘 날짜와 선택된 날짜 비교
    if (selectedDate > today) {
      setBirthdateError("생년월일은 현재 날짜 이후로 설정할 수 없습니다.");
      // 입력값은 변경하지 않음 (기존 값 유지)
      return;
    }
    
    // 유효한 날짜인 경우
    setBirthdateError("");
    setFormData({
      ...formData,
      birthDate: selectedDate
    });
  };

  // 소셜 타입에 따른 한글 이름 반환
  const getSocialTypeName = (type) => {
    switch(type) {
      case 'GOOGLE': return '구글';
      case 'NAVER': return '네이버';
      case 'KAKAO': return '카카오';
      default: return '소셜';
    }
  };

  // 회원 탈퇴 처리 함수
  const handleDeleteAccount = async () => {
    // 소셜 계정과 로컬 계정에 따라 다른 확인 메시지 표시
    const message = isSocialAccount
      ? `${getSocialTypeName(socialType)} 계정 연동이 해제되고 회원정보가 삭제됩니다. 계속하시겠습니까?`
      : "회원 탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다. 정말로 탈퇴하시겠습니까?";

    if (window.confirm(message)) {
      try {
        // 회원 탈퇴 API 호출
        await deleteMember();
        
        // 로컬 스토리지의 인증 정보 삭제 (로그아웃)
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("role");
        localStorage.removeItem('email');
        localStorage.removeItem('memberId');
        
        alert("회원 탈퇴가 완료되었습니다.");
        
        // 로그인 페이지로 이동
        navigate("/login");
      } catch (error) {
        console.error("회원 탈퇴 오류:", error);
        alert("회원 탈퇴 중 오류가 발생했습니다: " + 
              (error.response?.data?.message || error.message));
      }
    }
  };

  // 회원정보 수정 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 소셜 계정인 경우 정보 수정 불가
    if (isSocialAccount) {
      alert("소셜 로그인 계정은 정보를 수정할 수 없습니다.");
      return;
    }

    // 닉네임 필수 검증
    if (!formData.nickname || !formData.birthDate || !formData.gender) {
      alert("닉네임, 생년월일, 성별은 필수 입력 항목입니다.");
      return;
    }

    // 닉네임이 변경되었고 중복 검사를 하지 않았거나 사용할 수 없는 경우
    if (formData.nickname !== originalNickname && (!nicknameValidation.checked || !nicknameValidation.available)) {
      alert("닉네임 중복 확인이 필요합니다.");
      return;
    }

    // 모든 비밀번호 필드가 채워진 경우 비밀번호 변경 로직 실행
    if (oldPassword && newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
        return;
      }
      
      if (!validatePassword(newPassword)) {
        alert('비밀번호는 8자 이상이며, 숫자와 특수문자를 포함해야 합니다.');
        return;
      }
      
      try {
        // 비밀번호 변경 API 호출
        const passwordResponse = await changePassword(oldPassword, newPassword);
        if (!passwordResponse.data.success) {
          alert(passwordResponse.data.message || '비밀번호 변경에 실패했습니다.');
          return;
        }
        setPasswordSuccess(true);
      } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        alert('비밀번호 변경 중 오류가 발생했습니다: ' + 
              (error.response?.data?.message || error.message));
        return;
      }
    }

    // 비밀번호 필드가 일부만 채워진 경우 경고
    if ((oldPassword && !newPassword) || (!oldPassword && newPassword) || 
        (newPassword && !confirmPassword) || (!newPassword && confirmPassword)) {
      alert('비밀번호를 변경하려면 현재 비밀번호, 새 비밀번호, 비밀번호 확인을 모두 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 서버에 전송할 데이터 준비 (백엔드 API 형식에 맞게)
      const updateData = {
        nickname: formData.nickname,
        gender: formData.gender === "남자" ? "MALE" : "FEMALE",
        birth: formData.birthDate
      };
    
      // 회원 정보 업데이트 API 호출
      const response = await updateMemberInfo(updateData);
      
      console.log("회원정보 수정 응답:", response.data);
      
      // SweetAlert2로 성공 메시지 표시
      Swal.fire({
        title: '수정 완료!',
        text: '회원 정보가 성공적으로 수정되었습니다.',
        icon: 'success',
        confirmButtonColor: '#2A9D8F'
      });
      
      setSuccess("회원 정보가 성공적으로 수정되었습니다.");
      
      // 원본 닉네임 업데이트
      setOriginalNickname(formData.nickname);
      
      // 비밀번호 관련 필드 초기화
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setValidation({
        passwordChecked: false,
        passwordMatch: false
      });
      
      // 5초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccess("");
        setPasswordSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("회원 정보 수정 오류:", error);
      setError("회원 정보 수정 중 오류가 발생했습니다: " + 
            (error.response?.data?.message || error.message));
      
      // 오류 메시지 SweetAlert로 표시
      Swal.fire({
        title: '수정 실패',
        text: '회원 정보 수정 중 오류가 발생했습니다: ' + 
              (error.response?.data?.message || error.message),
        icon: 'error',
        confirmButtonColor: '#2A9D8F'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (loading) {
    return (
      <>
        <Header />
        <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container style={{ marginTop: "50px", marginBottom: "50px", maxWidth: "900px" }}>
        <Card className="signup-card shadow-lg">
          <Card.Body className="p-4">
            <h2 className="mb-4 text-center" style={{ color: '#2A9D8F', fontWeight: 'bold' }}>회원정보 수정</h2>
            
            {/* 소셜 계정인 경우 안내 메시지 표시 */}
            {isSocialAccount && (
              <Alert variant="info" className="mb-3">
                <Alert.Heading>{getSocialTypeName(socialType)} 소셜 로그인 계정</Alert.Heading>
                <p>
                  소셜 계정은 회원정보를 변경할 수 없습니다. 회원정보 수정이 필요한 경우 {getSocialTypeName(socialType)} 계정에서 관리하세요.
                </p>
              </Alert>
            )}
            
            {success && <Alert variant="success">{success}</Alert>}
            {passwordSuccess && <Alert variant="success">비밀번호가 성공적으로 변경되었습니다.</Alert>}
            
            <Form onSubmit={handleSubmit}>
              {/* 회원 정보 섹션 */}
              <div className="mb-4 p-4 border rounded bg-light">
                <h4 className="mb-3 text-teal-700">기본 정보</h4>
                
                {/* 이메일 필드 - 소셜/로컬 계정 모두 수정 불가 */}
                <Form.Group className="mb-3">
                  <Form.Label className="signup-form-label">이메일</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled // 이메일은 수정 불가
                    className="signup-form-control"
                  />
                  <Form.Text className="text-muted">
                    이메일은 변경할 수 없습니다.
                  </Form.Text>
                </Form.Group>

                {/* 닉네임 입력 필드 */}
                <Form.Group className="mb-3">
                  <Form.Label className="signup-form-label">닉네임</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleNicknameChange}
                      className="signup-form-control"
                      style={{ flex: "1", minWidth: "0" }}
                      disabled={isSocialAccount}
                      required
                    />
                    <Button 
                      variant="outline-primary" 
                      onClick={handleNicknameCheck}
                      style={{ width: "80px", marginLeft: "8px", whiteSpace: "nowrap" }}
                      disabled={isSocialAccount}
                    >
                      중복확인
                    </Button>
                  </div>
                  {isSocialAccount ? (
                    <Form.Text className="text-muted">
                      소셜 계정은 닉네임을 변경할 수 없습니다.
                    </Form.Text>
                  ) : (
                    <Form.Text className="text-muted">
                      닉네임은 3~20자의 영문, 숫자, 한글만 사용 가능합니다.
                    </Form.Text>
                  )}
                  {!isSocialAccount && nicknameValidation.checked && (
                    <div className={`mt-1 ${nicknameValidation.available ? 'text-success' : 'text-danger'}`}>
                      {nicknameValidation.available ? '✅ 사용 가능한 닉네임입니다.' : '❌ 이미 사용 중인 닉네임입니다.'}
                    </div>
                  )}
                </Form.Group>

                {/* 생년월일 필드 - max 속성 추가 */}
                <Form.Group className="mb-3">
                  <Form.Label className="signup-form-label">생년월일</Form.Label>
                  <Form.Control
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleBirthdateChange} // 기존 handleChange에서 변경
                    max={today}
                    className={`signup-form-control ${birthdateError ? "is-invalid" : ""}`}
                    disabled={isSocialAccount}
                    required
                  />
                  {birthdateError && (
                    <div className="invalid-feedback">
                      {birthdateError}
                    </div>
                  )}
                  {isSocialAccount ? (
                    <Form.Text className="text-muted">
                      소셜 계정은 생년월일을 변경할 수 없습니다.
                    </Form.Text>
                  ) : (
                    <Form.Text className="text-muted">
                      생년월일은 현재 날짜 이전만 선택 가능합니다.
                    </Form.Text>
                  )}
                </Form.Group>

                {/* 성별 필드 */}
                <Form.Group className="mb-3">
                  <Form.Label>성별</Form.Label>
                  <ButtonGroup className="gender-button-group">
                    {["남자", "여자"].map((g, idx) => (
                      <ToggleButton
                        key={idx}
                        id={`gender-${g}`}
                        type="radio"
                        name="gender"
                        value={g}
                        variant="outline-primary"
                        checked={formData.gender === g}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className={`gender-button ${formData.gender === g ? "isActive" : ""}`}
                        disabled={isSocialAccount}
                        required
                      >
                        {g}
                      </ToggleButton>
                    ))}
                  </ButtonGroup>
                  {isSocialAccount && (
                    <Form.Text className="text-muted d-block mt-2">
                      소셜 계정은 성별을 변경할 수 없습니다.
                    </Form.Text>
                  )}
                </Form.Group>
              </div>
              
              {/* 비밀번호 변경 섹션 - 소셜 계정이 아닌 경우에만 표시 */}
              {!isSocialAccount && (
                <div className="mb-4 p-3 border rounded bg-light">
                  <h4 className="mb-3">비밀번호 변경</h4>
                  
                  {/* 현재 비밀번호 입력 필드 */}
                  <Form.Group className="mb-3">
                    <Form.Label>현재 비밀번호</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="현재 비밀번호를 입력하세요"
                        className="signup-form-control"
                      />
                      <button
                        type="button"
                        className="btn position-absolute end-0 top-0 h-100 d-flex align-items-center border-0 bg-transparent"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        style={{ background: 'none', border: 'none' }}
                      >
                        <i className={`fas ${showOldPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </Form.Group>
                  
                  {/* 새 비밀번호 입력 필드 */}
                  <Form.Group className="mb-3">
                    <Form.Label>새 비밀번호</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={handleNewPasswordChange}
                        placeholder="새 비밀번호를 입력하세요"
                        className="signup-form-control"
                      />
                      <button
                        type="button"
                        className="btn position-absolute end-0 top-0 h-100 d-flex align-items-center border-0 bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ background: 'none', border: 'none' }}
                      >
                        <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    <Form.Text className={validation.passwordChecked ? "text-success" : "text-muted"}>
                      {validation.passwordChecked 
                        ? "✅ 비밀번호가 유효합니다." 
                        : "비밀번호는 8자 이상, 숫자와 특수문자를 포함해야 합니다."}
                    </Form.Text>
                  </Form.Group>
                  
                  {/* 새 비밀번호 확인 필드 */}
                  <Form.Group className="mb-3">
                    <Form.Label>새 비밀번호 확인</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        placeholder="새 비밀번호를 다시 입력하세요"
                        className="signup-form-control"
                      />
                      <button
                        type="button"
                        className="btn position-absolute end-0 top-0 h-100 d-flex align-items-center border-0 bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ background: 'none', border: 'none' }}
                      >
                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    {confirmPassword && (
                      <Form.Text className={validation.passwordMatch ? "text-success" : "text-danger"}>
                        {validation.passwordMatch 
                          ? "✅ 비밀번호가 일치합니다." 
                          : "❌ 비밀번호가 일치하지 않습니다."}
                      </Form.Text>
                    )}
                    <Form.Text className="text-muted mt-2 d-block">
                      비밀번호를 변경하지 않으려면 비워두세요.
                    </Form.Text>
                  </Form.Group>
                </div>
              )}
              
              {/* 버튼 그룹 */}
              <div className="d-flex justify-content-between mt-5">
                <Button 
                  variant="primary" 
                  type="submit" 
                  style={{ 
                    width: "45%", 
                    backgroundColor: '#2A9D8F', 
                    border: 'none', 
                    padding: '10px 0',
                    fontSize: '16px',
                    fontWeight: 'bold' 
                  }}
                  disabled={isSocialAccount || isSubmitting || (formData.nickname !== originalNickname && (!nicknameValidation.checked || !nicknameValidation.available))}
                >
                  {isSubmitting ? "저장 중..." : "정보 수정"}
                </Button>
                
                <Button 
                  variant="danger" 
                  onClick={handleDeleteAccount}
                  style={{ 
                    width: "45%", 
                    backgroundColor: '#e63946', 
                    border: 'none',
                    padding: '10px 0',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                  disabled={isSubmitting}
                >
                  회원 탈퇴
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
      <Footer />
    </>
  );
};

export default UpdateProfile;