import React from 'react';

const PasswordValidation = ({ password }) => {
  // 비밀번호 검증 조건들
  const validations = [
    { 
      id: 'length', 
      message: '8자 이상 입력', 
      isValid: password.length >= 8 
    },
    { 
      id: 'number', 
      message: '숫자 포함', 
      isValid: /\d/.test(password) 
    },
    { 
      id: 'special', 
      message: '특수문자 포함', 
      isValid: /[!@#$%^&*(),.?":{}|<>]/.test(password) 
    }
  ];

  return (
    <div className="mt-2">
      <p className="text-sm mb-1 text-gray-600">비밀번호 조건:</p>
      <ul className="space-y-1">
        {validations.map(validation => (
          <li 
            key={validation.id} 
            className={`text-sm flex items-center ${
              password.length === 0 
                ? 'text-gray-400' 
                : validation.isValid 
                  ? 'text-green-500' 
                  : 'text-red-500'
            }`}
          >
            <span className="mr-2">
              {password.length === 0 
                ? '•' 
                : validation.isValid 
                  ? '✓' 
                  : '✗'}
            </span>
            {validation.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordValidation;