// src/main/java/com/suppleit/backend/controller/FavoriteController.java
package com.suppleit.backend.controller;

import com.suppleit.backend.dto.ApiResponse;
import com.suppleit.backend.dto.FavoriteDto;
import com.suppleit.backend.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Slf4j
public class FavoriteController extends JwtSupportController {

    private final FavoriteService favoriteService;

    @GetMapping
    public ResponseEntity<?> getUserFavorites(HttpServletRequest request) {
        log.info("즐겨찾기 목록 조회 요청");
        try {
            // JWT에서 사용자 이메일 추출
            String email = extractEmailFromToken(request);
            List<FavoriteDto> favorites = favoriteService.getUserFavorites(email);
            return ResponseEntity.ok(favorites);
        } catch (Exception e) {
            log.error("즐겨찾기 목록 조회 중 오류: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("즐겨찾기 목록 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> addFavorite(@RequestBody FavoriteDto favoriteDto, HttpServletRequest request) {
        log.info("즐겨찾기 추가 요청: {}", favoriteDto);
        try {
            // JWT에서 사용자 이메일 추출
            String email = extractEmailFromToken(request);
            favoriteService.addFavorite(email, favoriteDto);
            return ResponseEntity.ok(ApiResponse.success("즐겨찾기 추가 성공", null));
        } catch (Exception e) {
            log.error("즐겨찾기 추가 중 오류: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("즐겨찾기 추가 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{prdId}")
    public ResponseEntity<?> removeFavorite(@PathVariable Long prdId, HttpServletRequest request) {
        log.info("즐겨찾기 삭제 요청: {}", prdId);
        try {
            // JWT에서 사용자 이메일 추출
            String email = extractEmailFromToken(request);
            favoriteService.removeFavorite(email, prdId);
            return ResponseEntity.ok(ApiResponse.success("즐겨찾기 삭제 성공", null));
        } catch (Exception e) {
            log.error("즐겨찾기 삭제 중 오류: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("즐겨찾기 삭제 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}