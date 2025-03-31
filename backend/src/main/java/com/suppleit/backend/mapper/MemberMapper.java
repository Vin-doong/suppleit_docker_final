package com.suppleit.backend.mapper;

import com.suppleit.backend.model.Member;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MemberMapper {
    // ✅ 회원 가입
    void insertMember(Member member);

    // ✅ 이메일로 회원 조회 (VARCHAR → Enum 변환 적용)
    Member getMemberByEmail(@Param("email") String email);

    // ✅ ID로 회원 조회
    Member getMemberById(@Param("memberId") Long memberId);

    // ✅ 이메일 중복 검사
    int checkEmail(@Param("email") String email);

    // ✅ 닉네임 중복 검사
    int checkNickname(@Param("nickname") String nickname);

    // ✅ 비밀번호 변경
    void updatePassword(@Param("email") String email, @Param("password") String password);

    // ✅ 회원 삭제 (이메일 기반)
    void deleteMemberByEmail(@Param("email") String email);

    // ✅ 회원 삭제 (ID 기반)
    void deleteMemberById(@Param("memberId") Long memberId);

    // 회원 정보 수정
    void updateMemberInfo(@Param("member") Member member);

}
