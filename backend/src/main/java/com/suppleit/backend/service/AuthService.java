package com.suppleit.backend.service;

import com.suppleit.backend.constants.MemberRole;
import com.suppleit.backend.constants.SocialType;
import com.suppleit.backend.mapper.MemberMapper;
import com.suppleit.backend.model.Member;
import com.suppleit.backend.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Log4j2
@RequiredArgsConstructor
public class AuthService {
    
    private final MemberMapper memberMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    
    // 로그인 인증 및 JWT 생성
    public String authenticate(String email, String password) {
        Member member = memberMapper.getMemberByEmail(email);
        
        if (member == null) {
            throw new IllegalArgumentException("해당 이메일로 가입된 사용자가 없습니다.");
        }
        
        String storedPassword = member.getPassword();
        if (storedPassword == null || storedPassword.isEmpty()) {
            throw new IllegalArgumentException("비밀번호가 설정되지 않은 계정입니다.");
        }
        
        // 소셜 로그인 사용자는 일반 로그인 불가
        if (member.getSocialType() != SocialType.NONE) {
            throw new IllegalArgumentException("소셜 로그인 계정입니다. 일반 로그인 대신 소셜 로그인 API를 사용하세요.");
        }
        
        // 비밀번호 검증
        boolean passwordMatch = passwordEncoder.matches(password, storedPassword);
        if (!passwordMatch) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        
        MemberRole role = (member.getMemberRole() != null) ? member.getMemberRole() : MemberRole.USER;
        return jwtTokenProvider.createToken(email, role.name());
    }
    
    // 리프레시 토큰으로 새 액세스 토큰 발급
    public String refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateRefreshToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }
        
        String email = jwtTokenProvider.getEmail(refreshToken);
        Member member = memberMapper.getMemberByEmail(email);
        
        if (member == null) {
            throw new IllegalArgumentException("해당 이메일로 가입된 사용자가 없습니다.");
        }
        
        MemberRole role = (member.getMemberRole() != null) ? member.getMemberRole() : MemberRole.USER;
        return jwtTokenProvider.createToken(email, role.name());
    }
    
    /**
     * 이메일과 닉네임으로 사용자 확인 후 임시 비밀번호 발급
     */
    public String generateTempPasswordWithNicknameCheck(String email, String nickname) {
        // 이메일로 회원 조회
        Member member = memberMapper.getMemberByEmail(email);
        if (member == null) {
            throw new IllegalArgumentException("존재하지 않는 이메일입니다.");
        }
        
        // 소셜 로그인 계정 확인
        if (member.getSocialType() != SocialType.NONE) {
            throw new IllegalArgumentException("소셜 로그인 계정은 비밀번호 찾기를 이용할 수 없습니다.");
        }
        
        // 닉네임 일치 여부 확인
        if (!member.getNickname().equals(nickname)) {
            throw new IllegalArgumentException("입력한 정보와 일치하는 계정이 없습니다.");
        }

        // 임시 비밀번호 생성 (8자리 랜덤 문자열)
        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        String encryptedTempPassword = passwordEncoder.encode(tempPassword);

        // 비밀번호 업데이트
        memberMapper.updatePassword(email, encryptedTempPassword);
        log.info("임시 비밀번호 발급: {}", tempPassword);

        return tempPassword;
    }
    
    // 비밀번호 변경
    public boolean changePassword(String email, String oldPassword, String newPassword) {
        Member member = memberMapper.getMemberByEmail(email);
    
        if (member == null) {
            throw new IllegalArgumentException("해당 이메일로 가입된 사용자가 없습니다.");
        }
        
        if (member.getSocialType() != SocialType.NONE) {
            throw new IllegalArgumentException("소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다.");
        }
        
        if (!passwordEncoder.matches(oldPassword, member.getPassword())) {
            throw new IllegalArgumentException("기존 비밀번호가 일치하지 않습니다.");
        }
    
        if (passwordEncoder.matches(newPassword, member.getPassword())) {
            throw new IllegalArgumentException("새로운 비밀번호는 기존 비밀번호와 다르게 설정해야 합니다.");
        }
    
        String encodedNewPassword = passwordEncoder.encode(newPassword);
        memberMapper.updatePassword(email, encodedNewPassword);
        
        return true;
    }
    
    // 비밀번호 업데이트 (임시 비밀번호 저장 등에 사용)
    public void updatePassword(String email, String newPassword) {
        String encodedPassword = passwordEncoder.encode(newPassword);
        memberMapper.updatePassword(email, encodedPassword);
    }
}