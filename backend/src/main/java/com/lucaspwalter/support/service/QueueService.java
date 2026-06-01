package com.lucaspwalter.support.service;

import com.lucaspwalter.support.dto.QueueDTO;
import com.lucaspwalter.support.dto.SessionDTO;
import com.lucaspwalter.support.model.Agent;
import com.lucaspwalter.support.model.AgentStatus;
import com.lucaspwalter.support.model.Session;
import com.lucaspwalter.support.model.SessionStatus;
import com.lucaspwalter.support.repository.AgentRepository;
import com.lucaspwalter.support.repository.SessionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class QueueService {

    private final SessionRepository sessionRepository;
    private final AgentRepository agentRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public QueueService(SessionRepository sessionRepository, AgentRepository agentRepository, SimpMessagingTemplate messagingTemplate) {
        this.sessionRepository = sessionRepository;
        this.agentRepository = agentRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<QueueDTO> waitingSessions() {
        return sessionRepository.findByStatusOrderByStartedAtAsc(SessionStatus.WAITING).stream()
                .map(QueueDTO::from)
                .toList();
    }

    @Transactional
    public SessionDTO acceptSession(UUID sessionId, UUID agentId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Session not found"));
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new EntityNotFoundException("Agent not found"));

        if (session.getStatus() != SessionStatus.WAITING) {
            throw new IllegalStateException("Session is not waiting");
        }
        if (agent.getStatus() != AgentStatus.AVAILABLE) {
            throw new IllegalStateException("Agent is not available");
        }

        session.setStatus(SessionStatus.ACTIVE);
        session.setAgent(agent);
        agent.setStatus(AgentStatus.BUSY);

        Session saved = sessionRepository.save(session);
        agentRepository.save(agent);
        broadcastQueue();
        broadcastAgents();
        messagingTemplate.convertAndSend("/topic/session/" + saved.getId(), SessionDTO.from(saved));
        return SessionDTO.from(saved);
    }

    public void broadcastQueue() {
        messagingTemplate.convertAndSend("/topic/queue", waitingSessions());
    }

    public void broadcastAgents() {
        messagingTemplate.convertAndSend("/topic/agents", agentRepository.findAll());
    }
}
