package com.suppleit.backend.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.suppleit.backend.model.Notice;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoticeDto {
    private Long noticeId;
    private String title;
    private String content;
    private Long memberId;
    private String authorName; // 작성자 이름 (JOIN 쿼리 결과)
    private Long lastModifiedBy; // 마지막 수정자 ID
    private String modifierName; // 수정자 이름 (JOIN 쿼리 결과)

    private String imagePath;
    private String attachmentPath;
    private String attachmentName;
    private boolean removeAttachment; // 첨부파일 제거 플래그
    private boolean removeImage; // 이미지 제거 플래그

    //조회수, 작성일, 수정일
    private int views;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // 이미지 URL 생성 메서드
    public String getImageUrl() {
        if (imagePath != null && !imagePath.isEmpty()) {
            return "/api/notice/image/" + imagePath;
        }
        return null;
    }

    // 첨부파일 URL 생성 메서드
    public String getAttachmentUrl() {
        if (attachmentPath != null && !attachmentPath.isEmpty() && attachmentName != null) {
            return "/api/notice/attachment/" + noticeId + "/" + attachmentName;
        }
        return null;
    }

    // 첨부파일 있는지 확인하는 메서드
    public boolean hasAttachment() {
        return attachmentPath != null && !attachmentPath.isEmpty() && attachmentName != null;
    }

    // 이미지 있는지 확인하는 메서드
    public boolean hasImage() {
        return imagePath != null && !imagePath.isEmpty();
    }

    // Notice 엔티티 → NoticeDto 변환 메서드
    public static NoticeDto fromEntity(Notice notice) {
        return NoticeDto.builder()
                .noticeId(notice.getNoticeId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .memberId(notice.getMemberId())
                .lastModifiedBy(notice.getLastModifiedBy())
                .imagePath(notice.getImagePath())
                .attachmentPath(notice.getAttachmentPath())
                .attachmentName(notice.getAttachmentName())
                .views(notice.getViews())
                .createdAt(notice.getCreatedAt())
                .updatedAt(notice.getUpdatedAt())
                .removeAttachment(false) // 기본값은 false
                .removeImage(false)
                .build();
    }

    // NoticeDto → Notice 엔티티 변환 메서드
    public Notice toEntity() {
        return Notice.builder()
                .noticeId(this.noticeId)
                .title(this.title)
                .content(this.content)
                .memberId(this.memberId)
                .lastModifiedBy(this.lastModifiedBy)
                .imagePath(this.imagePath)
                .attachmentPath(this.attachmentPath)
                .attachmentName(this.attachmentName)
                .views(this.views)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .build();
    }
}