package com.lucaspwalter.support.repository;

import com.lucaspwalter.support.model.Session;
import com.lucaspwalter.support.model.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {
    List<Session> findByStatusOrderByStartedAtAsc(SessionStatus status);
}
