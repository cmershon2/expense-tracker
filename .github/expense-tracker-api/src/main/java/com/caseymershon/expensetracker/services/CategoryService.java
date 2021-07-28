package com.caseymershon.expensetracker.services;

import com.caseymershon.expensetracker.domain.Category;
import com.caseymershon.expensetracker.exceptions.EtBadRequestException;
import com.caseymershon.expensetracker.exceptions.EtResourceNotFoundException;

import java.util.List;

public interface CategoryService {
    

    List<Category> fetchAllCategories(Integer userId);

    Category fetchCategoryById(Integer userId, Integer categoryId) throws EtResourceNotFoundException;

    Category addCategory(Integer userId, String title, String icon, String description) throws EtBadRequestException;

    void updateCategory(Integer userId, Integer categoryId, Category category) throws EtBadRequestException;

    void removeCategoryWithAllTransactions(Integer userId, Integer categoryId) throws EtResourceNotFoundException;
}
