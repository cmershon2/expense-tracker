package com.caseymershon.expensetracker.services;

import com.caseymershon.expensetracker.domain.User;
import com.caseymershon.expensetracker.exceptions.EtAuthException;

public interface UserService {
    
    User validateUser(String email, String password) throws EtAuthException;
    
    User registerUser(String firstName, String lastName, String email, String password) throws EtAuthException;

}
