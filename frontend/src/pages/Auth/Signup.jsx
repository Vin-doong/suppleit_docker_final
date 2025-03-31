// src/pages/Auth/Signup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Container, Row, Col, ButtonGroup, ToggleButton, Modal } from "react-bootstrap";
import "./Signup.css";
import { signup, checkEmail, checkNickname } from '../../services/api';

const Signup = () => {
  // 회원가입 데이터 
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    birthDate: "",
    gender: "",
    termsAgreed: false,
    adminOption: false,
    adminCode: "",
  });

  // 관리자 코드 상태 관리
  const [adminCode, setAdminCode] = useState("");

  // 비밀번호 표시 상태
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 환경변수에서 관리자 코드 가져오기
  useEffect(() => {
    // .env 파일에서 관리자 코드 가져오기
    setAdminCode(process.env.REACT_APP_ADMIN_SECRET_CODE || "admin1234");
  }, []);

  // 유효성 검사 결과 저장 상태 추가
  const [validation, setValidation] = useState({
    emailChecked: false,
    emailAvailable: false,
    nicknameChecked: false,
    nicknameAvailable: false,
    passwordMatch: false,
    passwordChecked: false
  });

  const [birthdateError, setBirthdateError] = useState("");
  // 현재 날짜 계산 (생년월일 최대값으로 사용)
  const today = new Date().toISOString().split('T')[0];

  // 생년월일 변경 핸들러 추가
  const handleBirthdateChange = (e) => {
    const selectedDate = e.target.value;
    
    if (selectedDate > today) {
      setBirthdateError("생년월일은 현재 날짜 이후로 설정할 수 없습니다.");
      return;
    }
    
    setBirthdateError("");
    setFormData({
      ...formData,
      birthDate: selectedDate
    });
  };

  // 이메일 변경 시 유효성 검사 결과 초기화
  const handleEmailChange = (e) => {
    setFormData({
      ...formData,
      email: e.target.value
    });
    setValidation({
      ...validation,
      emailChecked: false,
      emailAvailable: false
    });
  };

  // 닉네임 변경 시 유효성 검사 결과 초기화
  const handleNicknameChange = (e) => {
    setFormData({
      ...formData,
      nickname: e.target.value
    });
    setValidation({
      ...validation,
      nicknameChecked: false,
      nicknameAvailable: false
    });
  };

  // 비밀번호 변경 시 일치 여부 확인
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setFormData({
      ...formData,
      password: newPassword
    });

    // 비밀번호 유효성 검사
    const isValid = validatePassword(newPassword);
    
    // 비밀번호 일치 여부 확인
    const passwordsMatch = newPassword === formData.confirmPassword && newPassword !== '';
    
    setValidation({
      ...validation,
      passwordChecked: isValid,
      passwordMatch: passwordsMatch
    });
  };

  // 비밀번호 확인 변경 시 일치 여부 확인
  const handleConfirmPasswordChange = (e) => {
    const confirmPassword = e.target.value;
    setFormData({
      ...formData,
      confirmPassword: confirmPassword
    });

    // 비밀번호 일치 여부 확인
    const passwordsMatch = formData.password === confirmPassword && confirmPassword !== '';
    
    setValidation({
      ...validation,
      passwordMatch: passwordsMatch
    });
  };

  // 비밀번호 유효성 검사 함수
  const validatePassword = (password) => {
    // 비밀번호는 8자 이상, 숫자와 특수문자를 포함해야 함
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    return regex.test(password);
  };

  // 일반 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // 이메일 중복 검사
  const handleEmailCheck = async () => {
    if (!formData.email) {
      alert("이메일을 입력해주세요.");
      return;
    }

    // 이메일 형식 검사 (간단한 정규식)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("올바른 이메일 형식이 아닙니다.");
      return;
    }

    try {
      const response = await checkEmail(formData.email);
      console.log("이메일 중복 확인 응답:", response.data);
      
      if (response.data.isAvailable) {
        setValidation({
          ...validation,
          emailChecked: true,
          emailAvailable: true
        });
        alert("사용 가능한 이메일입니다.");
      } else {
        setValidation({
          ...validation,
          emailChecked: true,
          emailAvailable: false
        });
        alert("이미 사용 중인 이메일입니다.");
      }
    } catch (error) {
      console.error("이메일 중복 확인 오류:", error);
      alert("이메일 중복 확인 중 오류가 발생했습니다.");
    }
  };

  // 닉네임 중복 검사
  const handleNicknameCheck = async () => {
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
        setValidation({
          ...validation,
          nicknameChecked: true,
          nicknameAvailable: true
        });
        alert("사용 가능한 닉네임입니다.");
      } else {
        setValidation({
          ...validation,
          nicknameChecked: true,
          nicknameAvailable: false
        });
        alert("이미 사용 중인 닉네임입니다.");
      }
    } catch (error) {
      console.error("닉네임 중복 확인 오류:", error);
      alert("닉네임 중복 확인 중 오류가 발생했습니다.");
    }
  };

  // 회원가입 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 비밀번호 일치 확인
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    
    // 필수 약관 동의 확인
    if (!formData.termsAgreed) {
      alert("약관에 동의해야 합니다.");
      return;
    }
    
    // 이메일 중복 확인 완료 여부 확인
    if (!validation.emailChecked) {
      alert("이메일 중복 확인을 해주세요.");
      return;
    }
    
    // 이메일 사용 가능 여부 확인
    if (!validation.emailAvailable) {
      alert("이미 사용 중인 이메일입니다.");
      return;
    }
    
    // 닉네임 중복 확인 완료 여부 확인
    if (!validation.nicknameChecked) {
      alert("닉네임 중복 확인을 해주세요.");
      return;
    }
    
    // 닉네임 사용 가능 여부 확인
    if (!validation.nicknameAvailable) {
      alert("이미 사용 중인 닉네임입니다.");
      return;
    }
    
    // 관리자 옵션 선택 시 코드 검증
    if (formData.adminOption) {
      // .env 파일에서 가져온 관리자 코드와 비교
      if (formData.adminCode !== adminCode) {
        alert("관리자 코드가 올바르지 않습니다.");
        return;
      }
    }
    
    try {
      // 백엔드로 전송할 회원가입 데이터 준비
      const userData = {
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
        gender: formData.gender === "남자" ? "MALE" : "FEMALE",
        birth: formData.birthDate,
        // 관리자 옵션에 따라 역할 결정
        memberRole: formData.adminOption ? "ADMIN" : "USER",
        socialType: "NONE"
      };
      
      console.log("회원가입 요청 데이터:", userData);
      
      // API 호출하여 회원가입 요청
      const response = await signup(userData);
      
      if (response.data && response.data.success) {
        alert(`${formData.adminOption ? '관리자' : '일반 회원'} 계정으로 가입되었습니다!`);
        navigate('/login'); // 로그인 페이지로 이동
      } else {
        alert(response.data.message || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      alert(error.response?.data?.message || "회원가입 중 오류가 발생했습니다.");
    }
  };

  const [showModal, setShowModal] = useState(false);

  return (
    <>
    <div className="signup-page">
      <Container className="signup-container">
        <Row className="justify-content-md-center">
          <Col md={6}>
            <div className="signup-card">
              <h2 className="mb-3">회원가입</h2>
              <Form onSubmit={handleSubmit}>
                {/* 이메일 입력 필드 (중복 검사 버튼 수정) */}
                <Form.Group className="mb-3">
                  <Form.Label className="signup-form-label">이메일</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleEmailChange}
                      required
                      className="signup-form-control"
                      style={{ flex: "1", minWidth: "0" }}
                    />
                    <Button 
                      variant="outline-primary" 
                      onClick={handleEmailCheck}
                      style={{ width: "80px", marginLeft: "8px", whiteSpace: "nowrap" }}
                    >
                      중복확인
                    </Button>
                  </div>
                  {validation.emailChecked && (
                    <div className={`mt-1 ${validation.emailAvailable ? 'text-success' : 'text-danger'}`}>
                      {validation.emailAvailable ? '✅ 사용 가능한 이메일입니다.' : '❌ 이미 사용 중인 이메일입니다.'}
                    </div>
                  )}
                </Form.Group>

                {/* 비밀번호 입력 필드 (보기/숨기기 아이콘 추가) */}
                <Form.Group className="mb-3">
                  <Form.Label className="signup-form-label">비밀번호</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handlePasswordChange}
                      required
                      className="signup-form-control"
                    />
                    <button
                      type="button"
                      className="btn position-absolute end-0 top-0 h-100 d-flex align-items-center border-0 bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none' }}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  <Form.Text className={validation.passwordChecked ? "text-success" : "text-muted"}>
                    {validation.passwordChecked 
                      ? "✅ 비밀번호가 유효합니다." 
                      : "비밀번호는 8자 이상, 숫자와 특수문자를 포함해야 합니다."}
                  </Form.Text>
                </Form.Group>

                {/* 비밀번호 확인 필드 (보기/숨기기 아이콘 추가) */}
                <Form.Group className="mb-3">
                  <Form.Label className="signup-form-label">비밀번호 확인</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      required
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
                  {formData.confirmPassword && (
                    <Form.Text className={validation.passwordMatch ? "text-success" : "text-danger"}>
                      {validation.passwordMatch 
                        ? "✅ 비밀번호가 일치합니다." 
                        : "❌ 비밀번호가 일치하지 않습니다."}
                    </Form.Text>
                  )}
                </Form.Group>

                {/* 닉네임 입력 필드 (중복 검사 버튼 수정) */}
                <Form.Group className="mb-3">
                  <Form.Label className="signup-form-label">닉네임</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleNicknameChange}
                      required
                      className="signup-form-control"
                      style={{ flex: "1", minWidth: "0" }}
                    />
                    <Button 
                      variant="outline-primary" 
                      onClick={handleNicknameCheck}
                      style={{ width: "80px", marginLeft: "8px", whiteSpace: "nowrap" }}
                    >
                      중복확인
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    닉네임은 3~20자의 영문, 숫자, 한글만 사용 가능합니다.
                  </Form.Text>
                  {validation.nicknameChecked && (
                    <div className={`mt-1 ${validation.nicknameAvailable ? 'text-success' : 'text-danger'}`}>
                      {validation.nicknameAvailable ? '✅ 사용 가능한 닉네임입니다.' : '❌ 이미 사용 중인 닉네임입니다.'}
                    </div>
                  )}
                </Form.Group>

                {/* 생년월일 필드 (현재 날짜 제한 추가) */}
                <Form.Group className="mb-3">
                  <Form.Label className="signup-form-label">생년월일</Form.Label>
                  <Form.Control
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleBirthdateChange}
                    max={today}
                    className={`signup-form-control ${birthdateError ? "is-invalid" : ""}`}
                    required
                  />
                  {birthdateError && (
                    <div className="invalid-feedback">
                      {birthdateError}
                    </div>
                  )}
                  <Form.Text className="text-muted">
                    생년월일은 현재 날짜 이전만 선택 가능합니다.
                  </Form.Text>
                </Form.Group>

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
                        required
                      >
                        {g}
                      </ToggleButton>
                    ))}
                  </ButtonGroup>
                </Form.Group>

                {/* 관리자 계정 옵션 체크박스 */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="adminOption"
                    name="adminOption"
                    label="관리자 계정으로 가입"
                    checked={formData.adminOption}
                    onChange={handleChange}
                    className="text-primary"
                  />
                </Form.Group>

                {/* 관리자 코드 입력 필드 (조건부 렌더링) */}
                {formData.adminOption && (
                  <Form.Group className="mb-3">
                    <Form.Label className="signup-form-label">관리자 코드</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="adminCode"
                        value={formData.adminCode}
                        onChange={handleChange}
                        required={formData.adminOption}
                        className="signup-form-control"
                        placeholder="관리자 코드를 입력하세요"
                      />
                      <button
                        type="button"
                        className="btn position-absolute end-0 top-0 h-100 d-flex align-items-center border-0 bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: 'none', border: 'none' }}
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    <Form.Text className="text-muted">
                      관리자 계정으로 가입하려면 관리자 코드가 필요합니다.
                    </Form.Text>
                  </Form.Group>
                )}

                <Form.Group className="mb-3 d-flex align-items-center">
                  {/* 체크박스 */}
                  <Form.Check
                    type="checkbox"
                    name="termsAgreed"
                    checked={formData.termsAgreed}
                    onChange={handleChange}
                    required
                    className="me-2"
                  />
                  {/* 모달을 열 수 있는 텍스트 */}
                  <span
                    style={{ color: "#007bff", cursor: "pointer", fontSize: "14px" }}
                    onClick={() => setShowModal(true)}
                  >
                    [필수] 개인정보 수집 및 이용 동의서
                  </span>
                </Form.Group>

                {/* React-Bootstrap Modal */}
                <Modal show={showModal} onHide={() => setShowModal(false)}>
                  <Modal.Header closeButton>
                    <Modal.Title>개인정보 수집 및 이용 동의서</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <p>
                    [필수] 개인정보 수집 및 이용 동의서<br /> <br />
                    1. 수집 목적: 회원가입, 서비스 제공, 고객 지원.  <br />
                    2. 수집 항목: 이메일, 비밀번호, 생년월일, 성별.  <br />
                    3. 보유 기간: 회원 탈퇴 시 즉시 삭제 (단, 법령에 따라 일정 기간 보관될 수 있음).  <br />
                    4. 제3자 제공: 법적 의무 또는 이용자 동의 없이 제공되지 않음.  <br />
                    5. 이용자 권리: 개인정보 열람·수정·삭제 가능, 동의 철회 가능.  <br /> <br />
                    ※ 동의하지 않을 경우 서비스 이용이 제한될 수 있습니다.
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                      닫기
                    </Button>
                  </Modal.Footer>
                </Modal>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="signup-btn-primary"
                  disabled={
                    !validation.emailAvailable || 
                    !validation.nicknameAvailable || 
                    !validation.passwordMatch || 
                    !validation.passwordChecked
                  }
                >
                  회원가입
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
    </>
  );
};

export default Signup;