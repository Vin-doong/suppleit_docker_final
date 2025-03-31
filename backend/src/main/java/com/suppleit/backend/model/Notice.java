package com.suppleit.backend.model;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notice {
    private Long noticeId;
    private String title;
    private String content;
    private Long memberId; // ✅ 추가: 작성자 ID (외래키)

    //0319
    private String imagePath;        // 이미지 경로
    private String attachmentPath;   // 첨부파일 경로
    private String attachmentName;   // 첨부파일 원본명

    //0320
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int views;
    private Long lastModifiedBy;
}
