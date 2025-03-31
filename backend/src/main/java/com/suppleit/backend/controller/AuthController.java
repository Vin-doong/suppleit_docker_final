package com.suppleit.backend.controller;

import com.suppleit.backend.dto.AuthRequest;
import com.suppleit.backend.security.jwt.JwtTokenBlacklistService;
import com.suppleit.backend.security.jwt.JwtTokenProvider;
import com.suppleit.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController extends JwtSupportController {

    private final AuthService authService;
    private final JwtTokenBlacklistService tokenBlacklistService;

    // 로그인 API (JWT 발급)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            String token = authService.authenticate(request.getEmail(), request.getPassword());
            String refreshToken = jwtTokenProvider.createRefreshToken(request.getEmail());
            return ResponseEntity.ok(Map.of(
                "accessToken", token,
                "refreshToken", refreshToken
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }
    
    // 로그아웃 (토큰 무효화)
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletRequest req) {
        try {
            String token = parseBearerToken(req);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                            "success", false,
                            "message", "유효하지 않은 인증 형식입니다. Bearer 토큰이 필요합니다."
                        ));
            }

            // 이미 만료된 토큰인 경우
            if (jwtTokenProvider.isJwtExpired(token)) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "이미 로그아웃되었거나 만료된 토큰입니다."
                ));
            }

            // 블랙리스트에 있는 토큰인지 확인
            if (tokenBlacklistService.isBlacklisted(token)) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "이미 로그아웃된 토큰입니다."
                ));
            }

            // 토큰의 만료 시간 가져오기
            Long expirationTime = jwtTokenProvider.getTokenExpirationTime(token);
            if (expirationTime == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                            "success", false,
                            "message", "유효하지 않은 토큰입니다."
                        ));
            }

            // 토큰을 블랙리스트에 추가
            tokenBlacklistService.addToBlacklist(token, expirationTime);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "로그아웃이 완료되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "success", false,
                        "message", "로그아웃 처리 중 오류가 발생했습니다: " + e.getMessage()
                    ));
        }
    }
    
    // 비밀번호 찾기 (임시 비밀번호 발급)
    @PostMapping("/find/password")
    public ResponseEntity<Map<String, Object>> findPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String nickname = request.get("nickname");
            
            if (email == null || nickname == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "이메일과 닉네임을 모두 입력해주세요."
                ));
            }
            
            // 이메일과 닉네임으로 사용자 확인 후 임시 비밀번호 발급
            String tempPassword = authService.generateTempPasswordWithNicknameCheck(email, nickname);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "임시 비밀번호가 발급되었습니다.",
                "tempPassword", tempPassword
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 비밀번호 변경
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> request, HttpServletRequest req) {
        try {
            String email = extractEmailFromToken(req);
            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");
            
            boolean isChanged = authService.changePassword(email, oldPassword, newPassword);
            
            return ResponseEntity.ok(Map.of(
                "success", isChanged,
                "message", "비밀번호가 변경되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // 토큰 리프레시 API
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        
        if (refreshToken == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "리프레시 토큰이 필요합니다."
            ));
        }
        
        try {
            String newAccessToken = authService.refreshToken(refreshToken);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "accessToken", newAccessToken
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}