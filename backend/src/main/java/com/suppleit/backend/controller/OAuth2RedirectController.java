package com.suppleit.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.suppleit.backend.service.SocialLoginService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Map;

@RestController
@RequestMapping("/login/oauth2/code")
@RequiredArgsConstructor
@Slf4j
public class OAuth2RedirectController {

    private final SocialLoginService socialLoginService;

    @GetMapping("/google")
    public RedirectView processGoogleCallback(@RequestParam("code") String code) {
        try {
            Map<String, Object> tokenResponse = socialLoginService.getGoogleMember(code);
            String token = (String) tokenResponse.get("accessToken");
            String refreshToken = (String) tokenResponse.get("refreshToken");
            Map<String, Object> memberData = (Map<String, Object>) tokenResponse.get("member");
            String email = (String) memberData.get("email");
            
            return new RedirectView("/oauth2/success?token=" + token + 
                                   "&refreshToken=" + refreshToken + 
                                   "&email=" + email);
        } catch (Exception e) {
            log.error("구글 OAuth 콜백 처리 중 오류: {}", e.getMessage(), e);
            return new RedirectView("/login?error=oauth_failed");
        }
    }

    @GetMapping("/naver")
    public RedirectView processNaverCallback(@RequestParam("code") String code) {
        try {
            Map<String, Object> tokenResponse = socialLoginService.getNaverMember(code);
            String token = (String) tokenResponse.get("accessToken");
            String refreshToken = (String) tokenResponse.get("refreshToken");
            Map<String, Object> memberData = (Map<String, Object>) tokenResponse.get("member");
            String email = (String) memberData.get("email");
            
            return new RedirectView("/oauth2/success?token=" + token + 
                                   "&refreshToken=" + refreshToken + 
                                   "&email=" + email);
        } catch (Exception e) {
            log.error("네이버 OAuth 콜백 처리 중 오류: {}", e.getMessage(), e);
            return new RedirectView("/login?error=oauth_failed");
        }
    }
}