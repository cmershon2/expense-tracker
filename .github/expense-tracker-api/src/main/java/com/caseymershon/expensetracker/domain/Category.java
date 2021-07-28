package com.caseymershon.expensetracker.domain;

public class Category {
    
    private Integer categoryId;
    private Integer userId;
    private String title;
    private String description;
    private String icon;
    private Double totalExpense;

    public Category(Integer categoryId, Integer userId, String title, String description, String icon, Double totalExpense) {
        this.setCategoryId(categoryId);
        this.setUserId(userId);
        this.setTitle(title);
        this.setIcon(icon);
        this.setDescription(description);
        this.setTotalExpense(totalExpense);
    }

    public Double getTotalExpense() {
        return totalExpense;
    }

    public void setTotalExpense(Double totalExpense) {
        this.totalExpense = totalExpense;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }

    
}
