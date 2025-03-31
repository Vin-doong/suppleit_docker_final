package com.suppleit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;


import java.util.Map; 

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    
    // 성공 응답 생성 (데이터 포함)
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
    
    // 성공 응답 생성 (데이터 미포함)
    public static <T> ApiResponse<T> success(String message) {
        return success(message, null);
    }
    
    // 오류 응답 생성
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
    
    // 인증 응답을 위한 정적 메서드
    public static ApiResponse<Object> authSuccess(String accessToken, String refreshToken, MemberDto member) {
        return success("인증 성공", Map.of(
            "accessToken", accessToken,
            "refreshToken", refreshToken,
            "member", member
        ));
    }
}