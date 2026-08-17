package com.mentorhub.repository;

import com.mentorhub.model.MentoringSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MentoringSessionRepository extends JpaRepository<MentoringSession, Long> {
    List<MentoringSession> findByMenteeIdOrMentorId(Long menteeId, Long mentorId);
    List<MentoringSession> findByMenteeIdAndStatus(Long menteeId, String status);
    long countByMenteeIdOrMentorId(Long menteeId, Long mentorId);
    long countByMenteeIdAndStatus(Long menteeId, String status);
}
