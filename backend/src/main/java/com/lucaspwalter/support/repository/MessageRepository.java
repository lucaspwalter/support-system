package com.lucaspwalter.support.repository;

import com.lucaspwalter.support.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findBySessionIdOrderBySentAtAsc(UUID sessionId);
}
