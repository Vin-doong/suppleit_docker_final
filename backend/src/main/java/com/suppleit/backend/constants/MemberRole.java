package com.suppleit.backend.constants;

public enum MemberRole {
    USER,
    ADMIN;

    public static MemberRole fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return USER;  // ✅ 기본값 USER 설정
        }
        for (MemberRole role : MemberRole.values()) {
            if (role.name().equalsIgnoreCase(value.trim())) {  // ✅ 대소문자 무시하고 변환
                return role;
            }
        }
        throw new IllegalArgumentException("Unknown role: " + value + ". Allowed values: USER, ADMIN");
    }
}
