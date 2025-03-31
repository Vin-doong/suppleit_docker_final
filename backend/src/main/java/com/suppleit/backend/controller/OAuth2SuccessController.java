package com.suppleit.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/oauth2")
public class OAuth2SuccessController {

    @GetMapping("/providers")
    public ResponseEntity<Map<String, String>> getAuthProviders() {
        Map<String, String> providers = new HashMap<>();
        providers.put("google", "/oauth2/authorization/google");
        providers.put("naver", "/oauth2/authorization/naver");
        
        return ResponseEntity.ok(providers);
    }
}