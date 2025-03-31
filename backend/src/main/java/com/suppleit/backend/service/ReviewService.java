package com.suppleit.backend.service;

import com.suppleit.backend.dto.ReviewDto;
import com.suppleit.backend.mapper.ReviewMapper;
import com.suppleit.backend.model.Product;
import com.suppleit.backend.model.Review;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewMapper reviewMapper;

    public List<ReviewDto> getAllReviews() {
        return reviewMapper.getAllReviews();
    }

    public ReviewDto getReviewById(Long reviewId) {
        Review review = reviewMapper.getReviewById(reviewId);
        if (review == null) {
            return null;
        }
        // Review 객체를 ReviewDto로 변환
        return ReviewDto.fromEntity(review); 
    }

    public void createReview(ReviewDto reviewDto) {
        reviewMapper.insertReview(reviewDto);
    }

    public void updateReview(ReviewDto reviewDto) {
        reviewMapper.updateReview(reviewDto);
    }

    public void deleteReview(Long reviewId) {
        reviewMapper.deleteReview(reviewId);
    }

    public List<Product> searchProducts(String keyword) {
        return reviewMapper.searchProducts(keyword);
    }

    @Transactional
    public void increaseViewCount(Long reviewId) {
        reviewMapper.incrementViews(reviewId);
    }
}
