package com.suppleit.backend.controller;

import com.suppleit.backend.dto.ApiResponse;
import com.suppleit.backend.service.SocialLoginService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialLoginController {

    private final SocialLoginService socialLoginService;

    /**
     * 카카오 로그인 API - 사용하지 않음
     * 클라이언트에서 받은 카카오 액세스 토큰을 이용해 사용자 정보를 조회하고
     * 회원가입/로그인 처리 후 JWT 토큰을 반환
     */
    /*
    @PostMapping("/login/kakao")
    public ResponseEntity<?> loginWithKakao(@RequestParam String accessToken) {
        try {
            Map<String, Object> result = socialLoginService.getKakaoMember(accessToken);
            return ResponseEntity.ok(ApiResponse.success("카카오 로그인 성공", result));
        } catch (Exception e) {
            log.error("카카오 로그인 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("카카오 로그인 실패: " + e.getMessage()));
        }
    }
    */

    /**
     * 구글 로그인 API
     * 클라이언트에서 받은 구글 액세스 토큰을 이용해 사용자 정보를 조회하고
     * 회원가입/로그인 처리 후 JWT 토큰을 반환
     */
    @PostMapping("/login/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        log.info("구글 로그인 요청 - 인증 코드: {}", code.substring(0, Math.min(10, code.length())) + "...");
        
        try {
            Map<String, Object> result = socialLoginService.getGoogleMember(code);
            log.info("구글 로그인 성공 - 이메일: {}", result.get("email"));
            return ResponseEntity.ok(ApiResponse.success("구글 로그인 성공", result));
        } catch (Exception e) {
            log.error("구글 로그인 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("구글 로그인 실패: " + e.getMessage()));
        }
    }

    /**
     * 네이버 로그인 API
     * 클라이언트에서 받은 네이버 액세스 토큰을 이용해 사용자 정보를 조회하고
     * 회원가입/로그인 처리 후 JWT 토큰을 반환
     */
    @PostMapping("/login/naver")
    public ResponseEntity<?> loginWithNaver(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        // state는 선택적으로 처리
        String state = request.getOrDefault("state", "");
        
        log.info("네이버 로그인 요청 - 인증 코드: {}", code);
        
        try {
            // state 파라미터 없이 코드만으로 사용자 정보 조회
            Map<String, Object> result = socialLoginService.getNaverMember(code);
            return ResponseEntity.ok(ApiResponse.success("네이버 로그인 성공", result));
        } catch (Exception e) {
            log.error("네이버 로그인 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("네이버 로그인 실패: " + e.getMessage()));
        }
    }
}