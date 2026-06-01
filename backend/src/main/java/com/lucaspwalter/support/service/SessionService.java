package com.lucaspwalter.support.service;

import com.lucaspwalter.support.dto.SessionDTO;
import com.lucaspwalter.support.dto.SystemMessageDTO;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;
    private final AgentRepository agentRepository;
    private final QueueService queueService;
    private final SimpMessagingTemplate messagingTemplate;

    public SessionService(SessionRepository sessionRepository, AgentRepository agentRepository, QueueService queueService, SimpMessagingTemplate messagingTemplate) {
        this.sessionRepository = sessionRepository;
        this.agentRepository = agentRepository;
        this.queueService = queueService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public SessionDTO createSession(String clientName, String subject) {
        Session saved = sessionRepository.save(new Session(clientName, subject));
        queueService.broadcastQueue();
        return SessionDTO.from(saved);
    }

    @Transactional(readOnly = true)
    public SessionDTO getSession(UUID id) {
        return sessionRepository.findById(id)
                .map(SessionDTO::from)
                .orElseThrow(() -> new EntityNotFoundException("Session not found"));
    }

    @Transactional(readOnly = true)
    public List<SessionDTO> listSessions(String status) {
        if (status == null || status.isBlank()) {
            return sessionRepository.findAll().stream()
                    .map(SessionDTO::from)
                    .toList();
        }

        SessionStatus sessionStatus = SessionStatus.valueOf(status.toUpperCase());
        return sessionRepository.findByStatusOrderByStartedAtDesc(sessionStatus).stream()
                .map(SessionDTO::from)
                .toList();
    }

    @Transactional
    public SessionDTO closeSession(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Session not found"));

        if (session.getStatus() != SessionStatus.CLOSED) {
            session.setStatus(SessionStatus.CLOSED);
            session.setClosedAt(LocalDateTime.now());
            Agent agent = session.getAgent();
            if (agent != null) {
                agent.setStatus(AgentStatus.AVAILABLE);
                agentRepository.save(agent);
            }
            sessionRepository.save(session);
        }

        SessionDTO dto = SessionDTO.from(session);
        queueService.broadcastQueue();
        queueService.broadcastAgents();
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, SystemMessageDTO.sessionClosed(sessionId));
        return dto;
    }
}
