package com.suppleit.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.suppleit.backend.security.jwt.JwtFilter;
import com.suppleit.backend.security.jwt.JwtTokenProvider;
import com.suppleit.backend.security.jwt.JwtTokenBlacklistService;
import com.suppleit.backend.service.MemberDetailsService;
import com.suppleit.backend.service.SocialLoginService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.LogoutConfigurer;
import org.springframework.security.config.annotation.web.configurers.oauth2.client.OAuth2LoginConfigurer;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Map;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final MemberDetailsService memberDetailsService;
    private final JwtTokenBlacklistService tokenBlacklistService;
    private final SocialLoginService socialLoginService;

    // ✅ 비밀번호 암호화 (BCrypt)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ✅ 보안 필터 체인 설정
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())  // CSRF 보호 비활성화 (REST API)
            .cors(cors -> cors.configurationSource(corsSource()))  // CORS 설정 활성화
            .formLogin(form -> form.disable())  // 기본 로그인 폼 비활성화
            .httpBasic(basic -> basic.disable())  // HTTP Basic 인증 비활성화
            .authorizeHttpRequests(this::configureAuthorization)  // 요청별 권한 설정
            .addFilterBefore(jwtFilter(), 
                    UsernamePasswordAuthenticationFilter.class)  // ✅ JWT 필터 적용
            .logout(this::configureLogout);  // 로그아웃 설정

        return http.build();
    }
    
    // 이메일 추출 메소드
    private String extractEmail(OAuth2User oauth2User, String provider) {
        if ("GOOGLE".equals(provider)) {
            return oauth2User.getAttribute("email");
        } else if ("NAVER".equals(provider)) {
            Map<String, Object> response = oauth2User.getAttribute("response");
            if (response != null) {
                return (String) response.get("email");
            }
        }
        // 이메일이 없는 경우 예외 처리
        throw new IllegalArgumentException("이메일 정보를 찾을 수 없습니다.");
    }
    
    // 이름 추출 메소드
    private String extractName(OAuth2User oauth2User, String provider) {
        if ("GOOGLE".equals(provider)) {
            return oauth2User.getAttribute("name");
        } else if ("NAVER".equals(provider)) {
            Map<String, Object> response = oauth2User.getAttribute("response");
            if (response != null) {
                return (String) response.get("name");
            }
        }
        return "사용자";
    }
    
    // ✅ JWT 필터를 Bean으로 등록
    @Bean
    public JwtFilter jwtFilter() {
        return new JwtFilter(jwtTokenProvider, memberDetailsService, tokenBlacklistService);
    }

    // ✅ 요청별 권한 설정
    private void configureAuthorization(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth) {
        auth
            .requestMatchers("/admin/**").hasAuthority("ROLE_ADMIN")
            .requestMatchers("/api/member/auth/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_USER")
            .requestMatchers("/api/logout").authenticated()

            // OAuth2 관련 경로 추가
            .requestMatchers("/login/oauth2/code/**").permitAll()
            .requestMatchers("/oauth2/authorization/**").permitAll()
            .requestMatchers("/oauth2/success").permitAll()
            
            // 소셜 로그인 API는 인증 없이 접근 가능
            .requestMatchers("/api/social/**").permitAll()
            .requestMatchers("/api/social/login/**").permitAll()
            .requestMatchers("/api/social/login/google").permitAll()
            .requestMatchers("/api/social/login/naver").permitAll()
            .requestMatchers("/api/oauth2/**").permitAll()

            // 기존 설정 유지
            .requestMatchers("/api/member/verify-email").permitAll()
            .requestMatchers("/api/auth/refresh").permitAll()
            .requestMatchers("/api/auth/login").permitAll()
            .requestMatchers("/api/reviews/**").permitAll()
            .requestMatchers("/api/notice/image/**").permitAll()
            .requestMatchers("/api/notice/attachment/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/notice/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/notice").hasAuthority("ROLE_ADMIN")
            .requestMatchers(HttpMethod.PUT, "/api/notice/**").hasAuthority("ROLE_ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/api/notice/**").hasAuthority("ROLE_ADMIN")
            .anyRequest().permitAll();
    }

    // ✅ 로그아웃 설정 추가
    private void configureLogout(LogoutConfigurer<HttpSecurity> logout) {
        logout
            .logoutUrl("/api/logout")
            .logoutSuccessHandler((request, response, authentication) -> {
                response.setStatus(HttpServletResponse.SC_OK);
                response.getWriter().write("{\"message\": \"Logout successful\"}");
                response.getWriter().flush();
            });
    }

    // ✅ CORS 설정 보완
    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.setAllowCredentials(true);
        corsConfig.addAllowedHeader("*");
        corsConfig.addAllowedMethod("*");
        corsConfig.setAllowedOriginPatterns(List.of("*"));
        corsConfig.addExposedHeader("Authorization");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        return source;
    }
}