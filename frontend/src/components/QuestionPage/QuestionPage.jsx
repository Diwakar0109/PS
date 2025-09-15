import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import './QuestionPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const QuestionPage = () => {
    // ... (keep all existing state and useEffect hooks) ...
    const { subject, level, questionId } = useParams();
    const [question, setQuestion] = useState(null);
    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user, updateUserProgress } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/questions/${subject}/${level}`);
                const questions = await res.json();
                const currentQuestion = questions.find(q => q.id === questionId);
                if (currentQuestion) {
                    setQuestion(currentQuestion);
                    setCode(currentQuestion.template);
                }
            } catch (error) {
                console.error("Failed to fetch question:", error);
            }
        };
        fetchQuestion();
    }, [subject, level, questionId]);
    
    // ... (keep the handleRun function as is) ...
    const handleRun = async () => {
        setIsLoading(true);
        setOutput('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    subject,
                    level,
                    questionId,
                    code,
                }),
            });
            const result = await response.json();
            
            let outputMessage = `Status: ${result.status.toUpperCase()}\nScore: ${result.score}%\n\n${result.message}`;
            setOutput(outputMessage);

            if (result.status === 'passed') {
                const newProgress = JSON.parse(JSON.stringify(user.progress));
                if (!newProgress[subject]) newProgress[subject] = {};
                if (!newProgress[subject][`level${level}`]) newProgress[subject][`level${level}`] = {};
                newProgress[subject][`level${level}`][questionId] = 'passed';
                updateUserProgress(newProgress);
            }

        } catch (error) {
            setOutput(`An error occurred: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!question) {
        return <div>Loading question...</div>;
    }

    return (
        <div className="question-page-layout">
            <div className="problem-panel">
                {/* MODIFIED PART */}
                <button onClick={() => navigate(-1)} className="back-button">← Back</button>
                {/* END MODIFIED PART */}
                <h1>{question.title}</h1>
                <p>{question.description}</p>
                <h3>Test Cases</h3>
                <ul className="test-cases-list">
                    {question.test_cases.map((tc, index) => (
                        <li key={index}>
                            <strong>Input:</strong> <code>{tc.input}</code>, <strong>Expected:</strong> <code>{tc.expected}</code>
                        </li>
                    ))}
                </ul>
            </div>
            {/* ... (rest of the JSX is the same) ... */}
            <div className="editor-panel">
                <textarea
                    className="code-editor"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck="false"
                />
                <div className="action-bar">
                    <button onClick={handleRun} disabled={isLoading} className="run-button">
                        {isLoading ? 'Running...' : 'Run & Submit'}
                    </button>
                </div>
                <div className="output-panel">
                    <pre className="output-console">{output || 'Output will be shown here...'}</pre>
                </div>
            </div>
        </div>
    );
};

export default QuestionPage;