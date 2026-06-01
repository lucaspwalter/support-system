package com.lucaspwalter.support.controller;

import com.lucaspwalter.support.dto.MessageDTO;
import com.lucaspwalter.support.service.MessageService;
import com.lucaspwalter.support.service.SessionService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public void closeSession(String sessionId) {
        sessionService.closeSession(sessionId);
    }
}
