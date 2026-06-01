package com.lucaspwalter.support.controller;

import com.lucaspwalter.support.dto.MessageDTO;
import com.lucaspwalter.support.dto.SessionDTO;
import com.lucaspwalter.support.service.MessageService;
import com.lucaspwalter.support.service.SessionService;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/sessions")
@CrossOrigin(origins = "*")
public class SessionController {

    private final SessionService sessionService;
    private final MessageService messageService;

    public SessionController(SessionService sessionService, MessageService messageService) {
        this.sessionService = sessionService;
        this.messageService = messageService;
    }

    @PostMapping
    public SessionDTO create(@RequestBody CreateSessionRequest request) {
        return sessionService.createSession(request.clientName(), request.subject());
    }

    @GetMapping("/{id}")
    public SessionDTO get(@PathVariable UUID id) {
        return sessionService.getSession(id);
    }

    @GetMapping("/{id}/messages")
    public List<MessageDTO> messages(@PathVariable UUID id) {
        return messageService.history(id);
    }

    @PostMapping("/{id}/close")
    public SessionDTO closeRest(@PathVariable UUID id) {
        return sessionService.closeSession(id);
    }

    @MessageMapping("/session.close")
    public void close(@Payload CloseSessionRequest request) {
        sessionService.closeSession(request.sessionId());
    }

    public record CreateSessionRequest(String clientName, String subject) {
    }

    public record CloseSessionRequest(UUID sessionId) {
    }
}
