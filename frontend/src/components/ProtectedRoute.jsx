import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../App'; // Import the context from App.jsx

/**
 * A wrapper component that checks for user authentication.
 * If the user is not logged in, it redirects them to the /login page.
 * Otherwise, it renders the child components (the protected page).
 */
const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);

    if (!user) {
        // User not authenticated, redirect to the login page
        return <Navigate to="/login" replace />;
    }

    // User is authenticated, render the page they requested
    return children;
};

export default ProtectedRoute;