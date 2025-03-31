package com.suppleit.backend.controller;

import com.suppleit.backend.dto.MemberDto;
import com.suppleit.backend.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/member")
@RequiredArgsConstructor
public class MemberController extends JwtSupportController {

    private final MemberService memberService;

    // 회원가입
    @PostMapping("/join")
    public ResponseEntity<?> joinMember(@RequestBody @Valid MemberDto memberDto) {
        try {
            memberService.insertMember(memberDto);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "회원가입이 성공적으로 완료되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // JWT 토큰 기반으로 회원 정보 조회
    @GetMapping("/info")
    public ResponseEntity<?> getMemberInfo(HttpServletRequest request) {
        try {
            String email = extractEmailFromToken(request);
            Optional<MemberDto> memberOptional = memberService.getMemberByEmail(email);
            
            if (memberOptional.isPresent()) {
                // 비밀번호 정보는 제외
                MemberDto member = memberOptional.get();
                member.setPassword(null);
                return ResponseEntity.ok(member);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "회원 정보를 찾을 수 없습니다."));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // 회원 정보 수정
    @PutMapping("/update")
    public ResponseEntity<?> updateMemberInfo(@RequestBody MemberDto memberDto, HttpServletRequest request) {
        try {
            String email = extractEmailFromToken(request);
            memberService.updateMemberInfo(email, memberDto);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "회원 정보가 성공적으로 업데이트되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 회원 탈퇴 (로그인한 사용자만 자신의 계정 삭제 가능)
    @DeleteMapping("/delete")
    public ResponseEntity<Map<String, Object>> deleteMember(HttpServletRequest req) {
        try {
            String email = extractEmailFromToken(req);
            
            // 계정 유형 확인 (소셜 계정 여부)
            boolean isSocialAccount = memberService.isSocialAccount(email);
            String socialType = isSocialAccount ? memberService.getSocialType(email) : "NONE";
            
            // 회원 탈퇴 처리
            memberService.deleteMemberByEmail(email);
            
            // 계정 유형에 따른 응답 메시지 설정
            String message = isSocialAccount ? 
                    socialType + " 소셜 계정 연동이 해제되고 회원 탈퇴가 완료되었습니다." : 
                    "회원 탈퇴가 완료되었습니다.";
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", message
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // 계정 유형 조회 API (소셜 계정 여부 확인)
    @GetMapping("/account-type")
    public ResponseEntity<?> getAccountType(HttpServletRequest request) {
        try {
            String email = extractEmailFromToken(request);
            boolean isSocialAccount = memberService.isSocialAccount(email);
            String socialType = memberService.getSocialType(email);
            
            return ResponseEntity.ok(Map.of(
                "isSocialAccount", isSocialAccount,
                "socialType", socialType
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}