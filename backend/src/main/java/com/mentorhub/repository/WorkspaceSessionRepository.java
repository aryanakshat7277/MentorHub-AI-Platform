package com.mentorhub.repository;

import com.mentorhub.model.WorkspaceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WorkspaceSessionRepository extends JpaRepository<WorkspaceSession, Long> {
    Optional<WorkspaceSession> findBySessionId(Long sessionId);
}
