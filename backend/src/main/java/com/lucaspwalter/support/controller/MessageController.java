package com.lucaspwalter.support.controller;

import com.lucaspwalter.support.dto.MessageDTO;
import com.lucaspwalter.support.service.MessageService;
import com.lucaspwalter.support.service.SessionService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class MessageController {

    private final MessageService messageService;
    private final SessionService sessionService;

    public MessageController(MessageService messageService, SessionService sessionService) {
        this.messageService = messageService;
        this.sessionService = sessionService;
    }

    @MessageMapping("/chat.send")
    public void send(MessageDTO message) {
        messageService.send(message.sessionId(), message.senderType(), message.content());
    }

    @MessageMapping("session.close")
    public void close(@Payload String sessionId) {
        sessionService.closeSession(UUID.fromString(sessionId.replace("\"", "").trim()));
    }
}
