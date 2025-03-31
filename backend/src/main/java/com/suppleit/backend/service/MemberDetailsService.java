package com.suppleit.backend.service;

import com.suppleit.backend.constants.SocialType;
import com.suppleit.backend.constants.MemberRole;
import com.suppleit.backend.mapper.MemberMapper;
import com.suppleit.backend.model.Member;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberDetailsService implements UserDetailsService {

    private final MemberMapper memberMapper;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Member member = memberMapper.getMemberByEmail(email);
        if (member == null) {
            throw new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email);
        }

        // ✅ 소셜 로그인 회원도 기본 USER 권한 부여
        String password = "SOCIAL_LOGIN_USER";
        if (member.getSocialType() == SocialType.NONE) {  // ✅ String 비교 → Enum 비교로 변경
            password = member.getPassword();
        }

        return User.withUsername(member.getEmail())
                .password(password)
                .roles(member.getMemberRole() != null ? member.getMemberRole().name() : MemberRole.USER.name())  // ✅ memberRole이 null이면 기본값 "USER" 설정
                .build();
    }
}
