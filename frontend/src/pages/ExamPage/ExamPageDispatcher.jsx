import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

// Import your specific exam page components
import ML_ExamPage from './ML_ExamPage'; // The original ML exam page
import DS_ExamPage from './DS_ExamPage'; // The new Data Science exam page

const ExamPageDispatcher = () => {
  // Get the 'subject' from the URL (e.g., 'ml', 'ds')
  const { subject } = useParams();

  // Render the correct component based on the subject
  switch (subject?.toLowerCase()) {
    case 'ml':
      return <ML_ExamPage />;
    
    case 'ds':
      return <DS_ExamPage />;

    // You can add more subjects here in the future
    // case 'web':
    //   return <WebExamPage />;

    // If the subject is not recognized, redirect to the dashboard
    default:
      console.error(`No exam component found for subject: ${subject}`);
      return <Navigate to="/dashboard" />;
  }
};

export default ExamPageDispatcher;