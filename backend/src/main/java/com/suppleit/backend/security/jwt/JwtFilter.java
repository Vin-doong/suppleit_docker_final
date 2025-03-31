package com.suppleit.backend.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;


import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;
    private final JwtTokenBlacklistService tokenBlacklistService; // 추가

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            // 요청 URI 확인
            String requestUri = request.getRequestURI();
            String method = request.getMethod();
            
            log.debug("요청 URI: {}, 메서드: {}", requestUri, method);
            
            // 소셜 로그인 API 요청은 즉시 통과 (가장 우선적으로 체크)
            if (requestUri.contains("/api/social/login/")) {
                log.info("소셜 로그인 API 요청 감지: {}, 필터 우회", requestUri);
                chain.doFilter(request, response);
                return;
            }
            
            // 인증이 필요 없는 다른 API 요청
            if ((requestUri.startsWith("/api/notice") && method.equals("GET")) || 
                (requestUri.startsWith("/api/reviews") && method.equals("GET"))) {
                chain.doFilter(request, response);
                return;
            }
            
            // 토큰 검사
            String token = resolveToken(request);
            if (token == null) {
                // 토큰이 없는 경우 다음 필터로 진행
                chain.doFilter(request, response);
                return;
            }
            
            // 블랙리스트 확인
            if (tokenBlacklistService.isBlacklisted(token)) {
                log.info("토큰이 블랙리스트에 있음: {}", token.substring(0, Math.min(token.length(), 10)) + "...");
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "토큰이 무효화되었습니다 (로그아웃)");
                return;
            }

            // 토큰 유효성 검사
            if (!jwtTokenProvider.validateToken(token)) {
                log.warn("잘못되거나 만료된 토큰");
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "잘못되거나 만료된 토큰");
                return;
            }

            // 사용자 정보 로드 및 인증 설정
            String email = jwtTokenProvider.getEmail(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            if (userDetails != null) {
                Authentication auth = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
                ((UsernamePasswordAuthenticationToken) auth)
                        .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } else {
                log.warn("이메일에 해당하는 사용자 정보를 찾을 수 없음: {}", email);
            }
            
            chain.doFilter(request, response);
        } catch (Exception e) {
            log.error("JWT 필터 오류: {}", e.getMessage(), e);
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "인증 오류: " + e.getMessage());
        }
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            // 토큰이 없으면 null 반환 (예외 X)
            return null;
        }
        return bearerToken.substring(7);
    }
}