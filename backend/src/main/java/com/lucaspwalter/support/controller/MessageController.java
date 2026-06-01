package com.lucaspwalter.support.controller;

import com.lucaspwalter.support.dto.MessageDTO;
import com.lucaspwalter.support.service.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/chat.send")
    public void send(MessageDTO message) {
        messageService.send(message.sessionId(), message.senderType(), message.content());
    }
}
