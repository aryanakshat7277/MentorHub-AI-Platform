package com.mentorhub.dto.agent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentActionDto {
    private String id;
    /**
     * Action types:
     * NAVIGATE_URL - Opens URL in web browser
     * SEARCH_WEB   - Searches the web via Google
     * OPEN_APP     - Launches desktop application (calc, notepad, explorer, chrome, etc.)
     * OPEN_FILE    - Opens file or folder in explorer
     * RUN_COMMAND  - Runs terminal / PowerShell command
     * READ_WEB     - Reads web page content
     */
    private String type;
    private String target;
    private Map<String, Object> params;
    private String description;
    private String status; // PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    private String output;
}
