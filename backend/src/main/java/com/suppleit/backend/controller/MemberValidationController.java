package com.suppleit.backend.controller;

import com.suppleit.backend.service.AuthService;
import com.suppleit.backend.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/member/validation")
@RequiredArgsConstructor
public class MemberValidationController extends JwtSupportController {

    private final MemberService memberService;
    private final AuthService authService;

    // 닉네임 중복 검사
    @GetMapping("/nickname/{nickname}")
    public ResponseEntity<Map<String, Object>> checkNickname(@PathVariable("nickname") String nickname) {
        try {
            boolean isAvailable = memberService.validateAndCheckNickname(nickname);
            
            return ResponseEntity.ok(Map.of(
                "isAvailable", isAvailable,
                "message", isAvailable ? "사용 가능한 닉네임입니다." : "이미 사용 중인 닉네임입니다."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "isAvailable", false,
                "message", e.getMessage()
            ));
        }
    }

    // 이메일 중복 검사
    @GetMapping("/email/{email}")
    public ResponseEntity<Map<String, Object>> checkEmail(@PathVariable("email") String email) {
        // 이메일 형식 검증
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            return ResponseEntity.badRequest().body(Map.of(
                "isAvailable", false,
                "message", "올바른 이메일 형식이 아닙니다."
            ));
        }

        boolean isAvailable = memberService.checkEmail(email);

        return ResponseEntity.ok(Map.of(
            "isAvailable", isAvailable,
            "message", isAvailable ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다."
        ));
    }
    
}