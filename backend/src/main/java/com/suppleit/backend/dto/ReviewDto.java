package com.suppleit.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.suppleit.backend.model.Review;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
public class ReviewDto {
    private Long reviewId;
    private Long memberId;
    private String authorEmail;

    private Long prdId;

    @NotNull(message = "제목을 입력하세요.")
    @NotEmpty(message = "제목을 입력하세요.")
    private String title;

    @NotNull(message = "내용을 입력하세요.")
    private String content;

    private String productName;
    private int views;
    private int rating;
    private int likeCount;
    private int dislikeCount;

    @JsonIgnore
    private boolean isCommentable = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Review 객체를 ReviewDto로 변환하는 메서드
    public static ReviewDto fromEntity(Review review) {
        ReviewDto dto = new ReviewDto();
        dto.setReviewId(review.getReviewId());
        dto.setMemberId(review.getMemberId());
        dto.setAuthorEmail(review.getAuthorEmail());
        dto.setTitle(review.getTitle());
        dto.setContent(review.getContent());
        dto.setProductName(review.getProductName());
        dto.setPrdId(review.getPrdId());
        dto.setRating(review.getRating());
        dto.setViews(review.getViews());
        dto.setLikeCount(review.getLikeCount());
        dto.setDislikeCount(review.getDislikeCount());
        dto.setCommentable(review.isCommentable());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setUpdatedAt(review.getUpdatedAt());
        return dto;
    }
}