package com.suppleit.backend.constants;

public enum Gender {
    MALE,  
    FEMALE;

    public static Gender fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;  // ✅ NULL 처리 허용
        }
        for (Gender gender : Gender.values()) {
            if (gender.name().equalsIgnoreCase(value.trim())) {  // ✅ 대소문자 구분 없이 변환
                return gender;
            }
        }
        throw new IllegalArgumentException("Invalid gender value: " + value + ". Allowed values: MALE, FEMALE");
    }
}
