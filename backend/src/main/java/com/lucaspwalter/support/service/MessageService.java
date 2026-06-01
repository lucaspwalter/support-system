package com.lucaspwalter.support.service;

import com.lucaspwalter.support.dto.MessageDTO;
import com.lucaspwalter.support.model.Message;
import com.lucaspwalter.support.model.SenderType;
import com.lucaspwalter.support.model.Session;
import com.lucaspwalter.support.repository.MessageRepository;
import com.lucaspwalter.support.repository.SessionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final SessionRepository sessionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageService(MessageRepository messageRepository, SessionRepository sessionRepository, SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.sessionRepository = sessionRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public MessageDTO send(UUID sessionId, SenderType senderType, String content) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Session not found"));
        Message saved = messageRepository.save(new Message(session, senderType, content));
        MessageDTO dto = MessageDTO.from(saved);
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<MessageDTO> history(UUID sessionId) {
        return messageRepository.findBySessionIdOrderBySentAtAsc(sessionId).stream()
                .map(MessageDTO::from)
                .toList();
    }
}
