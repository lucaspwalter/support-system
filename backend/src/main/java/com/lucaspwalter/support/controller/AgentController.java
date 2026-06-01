package com.lucaspwalter.support.controller;

import com.lucaspwalter.support.model.Agent;
import com.lucaspwalter.support.model.AgentStatus;
import com.lucaspwalter.support.repository.AgentRepository;
import com.lucaspwalter.support.service.QueueService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/agents")
@CrossOrigin(origins = "*")
public class AgentController {

    private final AgentRepository agentRepository;
    private final QueueService queueService;

    public AgentController(AgentRepository agentRepository, QueueService queueService) {
        this.agentRepository = agentRepository;
        this.queueService = queueService;
    }

    @PostMapping
    public AgentDTO create(@RequestBody CreateAgentRequest request) {
        Agent saved = agentRepository.save(new Agent(request.name()));
        queueService.broadcastAgents();
        return AgentDTO.from(saved);
    }

    @PatchMapping("/{id}/status")
    public AgentDTO status(@PathVariable UUID id, @RequestBody UpdateStatusRequest request) {
        Agent agent = agentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Agent not found"));
        agent.setStatus(request.status());
        Agent saved = agentRepository.save(agent);
        queueService.broadcastAgents();
        return AgentDTO.from(saved);
    }

    @GetMapping
    public List<AgentDTO> list() {
        return agentRepository.findAll().stream()
                .map(AgentDTO::from)
                .toList();
    }

    public record CreateAgentRequest(String name) {
    }

    public record UpdateStatusRequest(AgentStatus status) {
    }

    public record AgentDTO(UUID id, String name, AgentStatus status, LocalDateTime createdAt) {
        static AgentDTO from(Agent agent) {
            return new AgentDTO(agent.getId(), agent.getName(), agent.getStatus(), agent.getCreatedAt());
        }
    }
}
