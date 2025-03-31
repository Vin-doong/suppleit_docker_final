package com.suppleit.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RequestDto {
    
    // 인증 요청 DTO
    public static class Auth {
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        private String email;
        
        @NotBlank(message = "비밀번호를 입력해주세요.")
        private String password;
    }
    
    // 비밀번호 변경 요청 DTO
    public static class PasswordChange {
        @NotBlank(message = "현재 비밀번호를 입력해주세요.")
        private String oldPassword;
        
        @NotBlank(message = "새 비밀번호를 입력해주세요.")
        @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
        private String newPassword;
    }
    
    // 리프레시 토큰 요청 DTO
    public static class TokenRefresh {
        @NotBlank(message = "리프레시 토큰이 필요합니다.")
        private String refreshToken;
    }
    
    
    // 비밀번호 찾기 요청 DTO
    public static class PasswordReset {
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        private String email;
    }
}