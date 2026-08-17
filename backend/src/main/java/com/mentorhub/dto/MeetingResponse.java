package com.mentorhub.dto;

public class MeetingResponse {
    private Long sessionId;
    private String roomName;
    private String meetingDomain;
    private String mentorName;
    private String menteeName;
    private String topic;
    private String status;

    public MeetingResponse() {}

    public MeetingResponse(Long sessionId, String roomName, String meetingDomain, String mentorName, String menteeName, String topic, String status) {
        this.sessionId = sessionId;
        this.roomName = roomName;
        this.meetingDomain = meetingDomain;
        this.mentorName = mentorName;
        this.menteeName = menteeName;
        this.topic = topic;
        this.status = status;
    }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getMeetingDomain() { return meetingDomain; }
    public void setMeetingDomain(String meetingDomain) { this.meetingDomain = meetingDomain; }

    public String getMentorName() { return mentorName; }
    public void setMentorName(String mentorName) { this.mentorName = mentorName; }

    public String getMenteeName() { return menteeName; }
    public void setMenteeName(String menteeName) { this.menteeName = menteeName; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
