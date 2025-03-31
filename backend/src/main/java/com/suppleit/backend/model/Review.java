package com.suppleit.backend.model;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class Review {
    private Long reviewId;
    private Long memberId;
    private Long prdId;
    private String authorEmail;
    private String title;
    private String content;
    private String productName;
    private int rating;
    private int views;
    private int likeCount;
    private int dislikeCount;
    private boolean isCommentable = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}