package com.suppleit.backend.controller;

import com.suppleit.backend.dto.ReviewDto;
import com.suppleit.backend.model.Product;
import com.suppleit.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    // 리뷰 전체조회
    @GetMapping
    public ResponseEntity<List<ReviewDto>> getAllReviews() {
        List<ReviewDto> reviews = reviewService.getAllReviews();
        return ResponseEntity.ok(reviews);
    }

    // 리뷰 상세조회
    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewDto> getReviewById(@PathVariable("reviewId") Long reviewId) {
        return ResponseEntity.ok(reviewService.getReviewById(reviewId));
    }

    // 리뷰 등록
    @PostMapping
    public ResponseEntity<Map<String, Object>> createReview(@RequestBody ReviewDto reviewDto) {
        if (reviewDto.getTitle() == null || reviewDto.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "제목을 입력하세요."));
        }
        if (reviewDto.getContent() == null || reviewDto.getContent().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "리뷰 내용을 입력하세요."));
        }
        if (reviewDto.getPrdId() == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "제품을 선택하세요."));
        }

        try {
            System.out.println("🔹 받은 데이터: " + reviewDto);
            reviewService.createReview(reviewDto);

            return ResponseEntity.ok(Map.of("success", true, "message", "리뷰가 등록되었습니다."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "리뷰 등록 중 오류가 발생했습니다.", "error", e.getMessage()));
        }
    }

    // 리뷰 수정
    @PutMapping("/{reviewId}")
    public ResponseEntity<Map<String, Object>> updateReview(
            @PathVariable("reviewId") Long reviewId, 
            @RequestBody ReviewDto reviewDto) {
        try {
            reviewDto.setReviewId(reviewId);
            reviewService.updateReview(reviewDto);
            return ResponseEntity.ok(Map.of("success", true, "message", "리뷰가 수정되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 리뷰 삭제
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Map<String, Object>> deleteReview(@PathVariable("reviewId") Long reviewId) {
        try {
            reviewService.deleteReview(reviewId);
            return ResponseEntity.ok(Map.of("success", true, "message", "리뷰가 삭제되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 리뷰 작성 시 제품 검색
    @GetMapping("/products/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam(name = "keyword") String keyword) {
        List<Product> products = reviewService.searchProducts(keyword);
        return ResponseEntity.ok(products);
    }

    // 리뷰 조회수 증가
    @PostMapping("/{reviewId}")
    public ResponseEntity<?> increaseViewCount(@PathVariable("reviewId") Long reviewId) {
        reviewService.increaseViewCount(reviewId);
        return ResponseEntity.ok().body(Map.of("message", "조회수 증가 완료"));
    }
}