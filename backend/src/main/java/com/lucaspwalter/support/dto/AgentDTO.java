package com.lucaspwalter.support.dto;

import com.lucaspwalter.support.model.Agent;
import com.lucaspwalter.support.model.AgentStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record AgentDTO(
        UUID id,
        String name,
        AgentStatus status,
        LocalDateTime createdAt
) {
    public static AgentDTO from(Agent agent) {
        return new AgentDTO(agent.getId(), agent.getName(), agent.getStatus(), agent.getCreatedAt());
    }
}
