package com.lucaspwalter.support.dto;

import com.lucaspwalter.support.model.Session;

import java.time.LocalDateTime;
import java.util.UUID;

public record QueueDTO(
        UUID sessionId,
        String clientName,
        String subject,
        LocalDateTime startedAt
) {
    public static QueueDTO from(Session session) {
        return new QueueDTO(
                session.getId(),
                session.getClientName(),
                session.getSubject(),
                session.getStartedAt()
        );
    }
}
