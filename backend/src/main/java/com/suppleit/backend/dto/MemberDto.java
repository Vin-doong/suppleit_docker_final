package com.suppleit.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.suppleit.backend.constants.Gender;
import com.suppleit.backend.constants.MemberRole;
import com.suppleit.backend.constants.SocialType;
import com.suppleit.backend.model.Member;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberDto {
    //📛📛 유정 추가
    private Long memberId;
    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;
    
    private String password;
    
    @Size(min = 3, max = 20, message = "닉네임은 3~20자 사이여야 합니다.")
    private String nickname;
    
    private Gender gender;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate birth;
    
    @JsonProperty("memberRole")
    private MemberRole memberRole;
    
    @JsonProperty("socialType")
    private SocialType socialType;

    // Member → MemberDto 변환
    public static MemberDto fromEntity(Member member) {
        return MemberDto.builder()
                .email(member.getEmail())
                //📛📛 유정 추가
                .memberId(member.getMemberId())
                .password(null)  // 보안상 비밀번호는 반환하지 않음
                .nickname(member.getNickname())
                .gender(member.getGender())
                .birth(member.getBirth())
                .memberRole(member.getMemberRole())
                .socialType(member.getSocialType())
                .build();
    }

    // MemberDto → Member 변환
    public Member toEntity(String encodedPassword) {
        return Member.builder()
            .email(this.email)
            //📛📛 유정 추가
            .memberId(this.memberId)
            .password(encodedPassword)
            .nickname(this.nickname)
            .gender(this.gender)
            .birth(this.birth)
            .memberRole(this.memberRole != null ? this.memberRole : MemberRole.USER)
            .socialType(this.socialType != null ? this.socialType : SocialType.NONE)
            .build();
    }
}