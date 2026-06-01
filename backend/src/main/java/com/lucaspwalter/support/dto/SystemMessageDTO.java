package com.lucaspwalter.support.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SystemMessageDTO(
        UUID sessionId,
        String senderType,
        String eventType,
        String content,
        LocalDateTime sentAt
) {
    public static SystemMessageDTO sessionClosed(UUID sessionId) {
        return new SystemMessageDTO(sessionId, "SYSTEM", "SESSION_CLOSED", "Atendimento encerrado", LocalDateTime.now());
    }
}
