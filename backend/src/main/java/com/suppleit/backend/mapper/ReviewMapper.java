package com.suppleit.backend.mapper;

import com.suppleit.backend.dto.ReviewDto;
import com.suppleit.backend.model.Product;
import com.suppleit.backend.model.Review;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReviewMapper {
    void insertReview(ReviewDto reviewDto);

    Review getReviewById(@Param("reviewId") Long reviewId);

    List<ReviewDto> getAllReviews();

    void updateReview(ReviewDto reviewDto);

    void deleteReview(@Param("reviewId") Long reviewId);

    List<Product> searchProducts(String keyword);

    void updateReviewImagePath(ReviewDto reviewDto);

    void incrementViews(@Param("reviewId") Long reviewId);

}
