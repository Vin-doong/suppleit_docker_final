package com.suppleit.backend.security.jwt;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class JwtTokenBlacklistService {
    
    private final RedisTemplate<String, String> redisTemplate;
    
    public JwtTokenBlacklistService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    // 토큰을 블랙리스트에 추가
    public void addToBlacklist(String token, Long expiryTimeInMillis) {
        long ttl = expiryTimeInMillis - System.currentTimeMillis();
        if (ttl > 0) {
            redisTemplate.opsForValue().set("blacklist:" + token, "true", ttl, TimeUnit.MILLISECONDS);
        }
    }
    
    // 토큰이 블랙리스트에 있는지 확인
    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + token));
    }
}