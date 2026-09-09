package com.mentorhub.repository;

import com.mentorhub.model.SosBugRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SosBugRepository extends JpaRepository<SosBugRequest, Long> {
    List<SosBugRequest> findByStatus(String status);
    List<SosBugRequest> findByMenteeId(Long menteeId);
    List<SosBugRequest> findByMentorId(Long mentorId);
}
