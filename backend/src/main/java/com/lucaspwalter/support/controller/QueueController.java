package com.lucaspwalter.support.controller;

import com.lucaspwalter.support.dto.QueueDTO;
import com.lucaspwalter.support.dto.SessionDTO;
import com.lucaspwalter.support.service.QueueService;
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
@RequestMapping("/queue")
@CrossOrigin(origins = "*")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    @GetMapping
    public List<QueueDTO> waiting() {
        return queueService.waitingSessions();
    }

    @PostMapping("/{sessionId}/accept")
    public SessionDTO accept(@PathVariable UUID sessionId, @RequestBody AcceptSessionRequest request) {
        return queueService.acceptSession(sessionId, request.agentId());
    }

    public record AcceptSessionRequest(UUID agentId) {
    }
}
