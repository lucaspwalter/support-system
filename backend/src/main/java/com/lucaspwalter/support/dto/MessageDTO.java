package com.lucaspwalter.support.dto;

import com.lucaspwalter.support.model.Message;
import com.lucaspwalter.support.model.SenderType;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageDTO(
        UUID id,
        UUID sessionId,
        SenderType senderType,
        String content,
        LocalDateTime sentAt
) {
    public static MessageDTO from(Message message) {
        return new MessageDTO(
                message.getId(),
                message.getSession().getId(),
                message.getSenderType(),
                message.getContent(),
                message.getSentAt()
        );
    }
}
