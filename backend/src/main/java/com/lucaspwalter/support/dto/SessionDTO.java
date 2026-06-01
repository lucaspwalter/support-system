package com.lucaspwalter.support.dto;

import com.lucaspwalter.support.model.Session;
import com.lucaspwalter.support.model.SessionStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record SessionDTO(
        UUID id,
        String clientName,
        String subject,
        SessionStatus status,
        UUID agentId,
        String agentName,
        LocalDateTime startedAt,
        LocalDateTime closedAt
) {
    public static SessionDTO from(Session session) {
        UUID agentId = session.getAgent() == null ? null : session.getAgent().getId();
        String agentName = session.getAgent() == null ? null : session.getAgent().getName();
        return new SessionDTO(
                session.getId(),
                session.getClientName(),
                session.getSubject(),
                session.getStatus(),
                agentId,
                agentName,
                session.getStartedAt(),
                session.getClosedAt()
        );
    }
}
