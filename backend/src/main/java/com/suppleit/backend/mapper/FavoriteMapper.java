// src/main/java/com/suppleit/backend/mapper/FavoriteMapper.java
package com.suppleit.backend.mapper;

import com.suppleit.backend.model.Favorite;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FavoriteMapper {
    // 특정 사용자의 즐겨찾기 목록 조회
    List<Favorite> getFavoritesByMemberId(@Param("memberId") Long memberId);
    
    // 특정 사용자와 제품의 즐겨찾기 정보 조회
    Favorite getFavoriteByMemberAndProduct(
            @Param("memberId") Long memberId, 
            @Param("prdId") Long prdId);
    
    // 즐겨찾기 추가
    void insertFavorite(Favorite favorite);
    
    // 즐겨찾기 삭제
    void deleteFavorite(
            @Param("memberId") Long memberId, 
            @Param("prdId") Long prdId);
}