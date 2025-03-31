import React from 'react';

const PasswordMatchIndicator = ({ password, confirmPassword }) => {
  // 비밀번호 입력 전에는 표시하지 않음
  if (!password || !confirmPassword) {
    return null;
  }
  
  const doPasswordsMatch = password === confirmPassword;
  
  return (
    <div className={`mt-2 text-sm flex items-center ${doPasswordsMatch ? 'text-green-500' : 'text-red-500'}`}>
      <span className="mr-2">{doPasswordsMatch ? '✓' : '✗'}</span>
      {doPasswordsMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
    </div>
  );
};

export default PasswordMatchIndicator;