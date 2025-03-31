package com.suppleit.backend.controller;

import com.suppleit.backend.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;

public abstract class JwtSupportController {
    
    @Autowired
    protected JwtTokenProvider jwtTokenProvider;
    
    // JWT 토큰에서 이메일 추출 (예외 처리 추가)
    protected String extractEmailFromToken(HttpServletRequest req) {
        try {
            String token = parseBearerToken(req);
            
            if (token == null) {
                return null; // 토큰이 없는 경우 null 반환
            }
            
            if (!jwtTokenProvider.validateToken(token)) {
                throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
            }
            
            if (jwtTokenProvider.isJwtExpired(token)) {
                throw new IllegalArgumentException("JWT가 만료되었습니다.");
            }
            
            return jwtTokenProvider.getEmail(token);
        } catch (Exception e) {
            throw new IllegalArgumentException("토큰 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // Bearer 토큰 추출 (예외 메시지 명확화)
    protected String parseBearerToken(HttpServletRequest req) {
        String authorization = req.getHeader("Authorization");

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 인증 형식입니다. Bearer 토큰이 필요합니다.");
        }

        return authorization.substring(7);
    }
}