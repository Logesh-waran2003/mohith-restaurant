package com.ringerr.dto;

import java.util.List;

public class AuthResponse {

    private Long userId;
    private String token;
    private String tokenType = "Bearer";
    private String email;
    private String fullName;
    private List<String> roles;

    public AuthResponse() {}

    public AuthResponse(Long userId, String token, String email, String fullName, List<String> roles) {
        this.userId = userId;
        this.token = token;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
}
