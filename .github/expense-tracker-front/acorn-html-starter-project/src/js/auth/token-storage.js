/**
 *
 * token-storage
 *
 *
 **/

class tokenStorage {

    static signOut(){
        localStorage.clear();
        location.reload();
    }

    static saveToken(token){
        localStorage.removeItem("auth-token");
        localStorage.setItem("auth-token", token);
    }

    static getToken(){
        return localStorage.getItem("auth-token");
    }

    static saveUser(user){
        localStorage.removeItem("auth-user");
        localStorage.setItem("auth-user", JSON.stringify(user));
    }

    static getUser(){
        const user = localStorage.getItem("auth-user");
        if(user){
            return JSON.parse(user);
        }
    }
}