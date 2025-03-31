package com.suppleit.backend.model;

import com.suppleit.backend.constants.Gender;
import com.suppleit.backend.constants.MemberRole;
import com.suppleit.backend.constants.SocialType;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {
    private Long memberId;
    private String email;
    private String password;
    private String nickname;
    private Gender gender;
    private LocalDate birth;

    private MemberRole memberRole;
    private SocialType socialType;

    // ✅ MyBatis가 Enum 값을 올바르게 매핑하도록 변환 메서드 추가
    public String getMemberRoleString() {
        return memberRole != null ? memberRole.name() : "USER"; // 기본값 설정
    }

    public void setMemberRole(String role) {
        if (role != null) {
            try {
                this.memberRole = MemberRole.valueOf(role);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid role: " + role + ". Allowed values: USER, ADMIN");
            }
        } else {
            this.memberRole = MemberRole.USER;
        }
    }

    public String getSocialTypeString() {
        return socialType != null ? socialType.name() : "NONE"; // 기본값 설정
    }

    public void setSocialType(String socialType) {
        if (socialType != null) {
            try {
                this.socialType = SocialType.valueOf(socialType);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid social type: " + socialType + ". Allowed values: NONE, KAKAO, NAVER, GOOGLE");
            }
        } else {
            this.socialType = SocialType.NONE;
        }
    }
}
