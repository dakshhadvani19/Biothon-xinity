import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const sessionUser = await authService.getCurrentUser();
            setUser(sessionUser);
            setIsLoading(false);
        };
        checkSession();
    }, []);

    const value = {
        user,
        isLoading,
        loginWithGoogle: authService.loginWithGoogle,
        logout: async () => {
            await authService.logout();
            setUser(null);
        }
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
