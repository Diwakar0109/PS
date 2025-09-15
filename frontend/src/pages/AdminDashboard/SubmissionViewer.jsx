import React, { useState, useEffect } from "react";
import {
  Spinner,
  SelectInput,
  TextInput,
  Button,
  Alert,
  Card,
} from "./SharedComponents";

// Define the base URL from the environment variable once, at the top of the file.
// This makes the code cleaner and easier to read.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Enhanced Student Submission Detail Component ---
const StudentSubmissionDetail = ({ username, submissions }) => {
  // ... (This component has no fetch calls, so no changes are needed here) ...
  const summary = submissions.reduce((acc, sub) => {
    if (!acc[sub.subject]) {
      acc[sub.subject] = { completed: 0, failed: 0, attempts: 0 };
    }
    acc[sub.subject].attempts++;
    if (sub.status === "completed" || sub.status === "passed") {
      const completedLevelsForSubject = submissions
        .filter(
          (s) =>
            s.subject === sub.subject &&
            (s.status === "completed" || s.status === "passed")
        )
        .map((s) => s.level);
      acc[sub.subject].completed = new Set(completedLevelsForSubject).size;
    }
    if (sub.status === "failed") {
      acc[sub.subject].failed++;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xl font-semibold mb-4 text-slate-800 flex items-center">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
            <svg
              className="w-4 h-4 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          Progress Summary for {username}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(summary).map(([subject, data]) => (
            <div
              key={subject}
              className="bg-white p-4 rounded-lg shadow-sm border border-slate-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-slate-800">
                  {subject.toUpperCase()}
                </h5>
                <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">
                    Completed Levels
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium text-xs">
                    {data.completed}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">Total Attempts</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium text-xs">
                    {data.attempts}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xl font-semibold mb-4 text-slate-800 flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          Full Submission History ({submissions.length})
        </h4>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full border-collapse bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700 text-sm uppercase tracking-wider border-b border-slate-200">
                  Subject
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700 text-sm uppercase tracking-wider border-b border-slate-200">
                  Level
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700 text-sm uppercase tracking-wider border-b border-slate-200">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700 text-sm uppercase tracking-wider border-b border-slate-200">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {submissions.map((sub, index) => (
                <tr
                  key={index}
                  className="hover:bg-slate-50 transition-colors duration-150"
                >
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {sub.subject}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{sub.level}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full font-medium text-xs uppercase tracking-wide ${
                        sub.status === "passed" || sub.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm">
                    {new Date(sub.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


const SubmissionsViewer = () => {
  const [view, setView] = useState("aggregate");
  const [submissions, setSubmissions] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [isAggLoading, setIsAggLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState("");

  useEffect(() => {
    if (view === "aggregate") {
      const fetchAggregateSubmissions = async () => {
        setIsAggLoading(true);
        try {
          // --- CHANGE #1: Corrected the API endpoint ---
          // The endpoint for all submissions is /api/submissions, not /api/questions.
          const res = await fetch(`${API_BASE_URL}/api/submissions`);
          if (!res.ok) throw new Error("Failed to fetch submission data.");
          const data = await res.json();
          setSubmissions(data);
          const availableSubjects = Object.keys(data);
          setSubjects(availableSubjects);
          if (availableSubjects.length > 0) {
            const firstSubject = availableSubjects[0];
            setSelectedSubject(firstSubject);

            const firstLevels = Object.keys(data[firstSubject] || {});
            if (firstLevels.length > 0) {
              setSelectedLevel(firstLevels[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching aggregate submissions", error);
        } finally {
          setIsAggLoading(false);
        }
      };
      fetchAggregateSubmissions();
    }
  }, [view]);

  const handleStudentSearch = async (e) => {
    e.preventDefault();
    if (!searchUsername) return;
    setIsStudentLoading(true);
    setStudentError("");
    setStudentData(null);
    try {
      // --- CHANGE #2: Used the API_BASE_URL constant for consistency ---
      const res = await fetch(`${API_BASE_URL}/api/submissions/${searchUsername}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Student not found.");
      data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setStudentData(data);
    } catch (error) {
      setStudentError(error.message);
    } finally {
      setIsStudentLoading(false);
    }
  };

  const subjectOptions = subjects.map((s) => ({
    value: s,
    label: s.toUpperCase(),
  }));

  const levelsForSubject = selectedSubject
    ? Object.keys(submissions[selectedSubject] || {})
    : [];

  const levelOptions = levelsForSubject.map((l) => ({
    value: l,
    label: l
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase()),
  }));

  const displayedSubmissions =
    (selectedSubject &&
      selectedLevel &&
      submissions[selectedSubject]?.[selectedLevel]) ||
    [];

  return (
    // ... (No changes needed in the JSX return part) ...
    <div className="space-y-6">
      <Card>
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setView("aggregate")}
            variant={view === "aggregate" ? "primary" : "outline"}
            className="flex-1 sm:flex-none"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Aggregate View
          </Button>
          <Button
            onClick={() => setView("student")}
            variant={view === "student" ? "primary" : "outline"}
            className="flex-1 sm:flex-none"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Student View
          </Button>
        </div>

        {view === "aggregate" && (
          <div>
            <h3 className="text-xl font-semibold mb-6 text-slate-800 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              View All Submissions
            </h3>
            {isAggLoading ? (
              <Spinner />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <SelectInput
                    label="Select Subject"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    options={subjectOptions}
                    placeholder="Choose a subject"
                  />
                  <SelectInput
                    label="Select Level"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    options={levelOptions}
                    disabled={!selectedSubject}
                    placeholder="Choose a level"
                  />
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full border-collapse bg-white">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-700 text-sm uppercase tracking-wider border-b border-slate-200">
                          Username
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700 text-sm uppercase tracking-wider border-b border-slate-200">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700 text-sm uppercase tracking-wider border-b border-slate-200">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {displayedSubmissions.length > 0 ? (
                        displayedSubmissions.map((sub, index) => (
                          <tr
                            key={index}
                            className="hover:bg-slate-50 transition-colors duration-150"
                          >
                            <td className="px-4 py-3 text-slate-700 font-medium">
                              {sub.username}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2.5 py-1 rounded-full font-medium text-xs uppercase tracking-wide ${
                                  sub.status === "passed" ||
                                  sub.status === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-sm">
                              {new Date(sub.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="px-4 py-8 text-center text-slate-500"
                          >
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                <svg
                                  className="w-6 h-6 text-slate-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"
                                  />
                                </svg>
                              </div>
                              <p className="font-medium">
                                No submissions found
                              </p>
                              <p className="text-sm mt-1">
                                Try selecting a different subject and level
                                combination.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
        {view === "student" && (
          <div>
            <h3 className="text-xl font-semibold mb-6 text-slate-800 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              View Student Progress
            </h3>
            <form
              onSubmit={handleStudentSearch}
              className="flex flex-col sm:flex-row gap-3 items-end mb-6"
            >
              <div className="flex-1 w-full">
                <TextInput
                  label="Enter Student Username"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  placeholder="e.g., student1"
                />
              </div>
              <Button
                type="submit"
                disabled={isStudentLoading || !searchUsername}
                variant="primary"
                className="whitespace-nowrap py-3.5"
              >
                {isStudentLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Search
                  </span>
                )}
              </Button>
            </form>
            {studentError && (
              <Alert type="error" message={studentError} className="mb-4" />
            )}
            {isStudentLoading && <Spinner />}
            {studentData && (
              <StudentSubmissionDetail
                username={searchUsername}
                submissions={studentData}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SubmissionsViewer;
