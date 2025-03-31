package com.suppleit.backend.controller;

import com.suppleit.backend.dto.ApiResponse;
import com.suppleit.backend.dto.HealthFunctionalFoodDto;
import com.suppleit.backend.service.HealthFunctionalFoodService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/health-foods")
@RequiredArgsConstructor
@Slf4j
public class HealthFunctionalFoodController {

    private final HealthFunctionalFoodService healthFunctionalFoodService;

    /**
     * 건강기능식품 검색 API
     * @param keyword 검색어 (제품명)
     * @param pageNo 페이지 번호 (기본값 1)
     * @param numOfRows 한 페이지 결과 수 (기본값 10)
     * @return 검색된 건강기능식품 목록
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchHealthFunctionalFood(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int numOfRows) {
        
        log.info("건강기능식품 검색 요청: 키워드={}, 페이지={}, 결과수={}", keyword, pageNo, numOfRows);
        
        try {
            if (keyword == null || keyword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("검색어를 입력해주세요."));
            }
            
            List<HealthFunctionalFoodDto> results = healthFunctionalFoodService.searchHealthFunctionalFood(
                    keyword, pageNo, numOfRows);
            
            if (results.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success("검색 결과가 없습니다.", results));
            }
            
            return ResponseEntity.ok(ApiResponse.success("검색 성공", results));
        } catch (Exception e) {
            log.error("건강기능식품 검색 처리 중 오류", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("검색 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 건강기능식품 상세정보 조회 API
     * @param sttemntNo 품목제조신고번호
     * @return 건강기능식품 상세정보
     */
    @GetMapping("/detail/{sttemntNo}")
    public ResponseEntity<?> getHealthFunctionalFoodDetail(@PathVariable String sttemntNo) {
        log.info("건강기능식품 상세정보 조회 요청: 품목제조신고번호={}", sttemntNo);
        
        try {
            if (sttemntNo == null || sttemntNo.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("품목제조신고번호를 입력해주세요."));
            }
            
            HealthFunctionalFoodDto foodDetail = healthFunctionalFoodService.getHealthFunctionalFoodDetail(sttemntNo);
            
            if (foodDetail == null) {
                return ResponseEntity.ok(ApiResponse.error("해당 품목제조신고번호로 등록된 제품이 없습니다."));
            }
            
            return ResponseEntity.ok(ApiResponse.success("조회 성공", foodDetail));
        } catch (Exception e) {
            log.error("건강기능식품 상세정보 조회 처리 중 오류", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 제품명으로 건강기능식품 검색하는 간단한 API
     */
    @GetMapping("/quick-search")
    public ResponseEntity<?> quickSearch(@RequestParam String name) {
        log.info("건강기능식품 빠른 검색 요청: 제품명={}", name);
        
        try {
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("제품명을 입력해주세요."));
            }
            
            // 첫 페이지 5개 결과만 가져오기
            List<HealthFunctionalFoodDto> results = healthFunctionalFoodService.searchHealthFunctionalFood(
                    name, 1, 5);
            
            return ResponseEntity.ok(ApiResponse.success("검색 성공", results));
        } catch (Exception e) {
            log.error("빠른 검색 처리 중 오류", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("검색 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}