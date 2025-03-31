package com.suppleit.backend.constants;

public enum SocialType {
    NONE,   
    KAKAO,
    NAVER,
    GOOGLE;

    public static SocialType fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return NONE;  // ✅ 기본값 NONE 설정
        }
        for (SocialType type : SocialType.values()) {
            if (type.name().equalsIgnoreCase(value.trim())) {  // ✅ 대소문자 무시하고 변환
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid social type: " + value + ". Allowed values: NONE, KAKAO, NAVER, GOOGLE");
    }
}
