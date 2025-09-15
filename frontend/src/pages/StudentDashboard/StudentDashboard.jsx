import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../App";
import Spinner from "../Spinner/Spinner";
import ds from "../../assets/Courses/ds.png";
import ml from "../../assets/Courses/ml.png";
import DL from "../../assets/Courses/DeepLearning.png";
import speech from "../../assets/Courses/speech.png";
import llm from "../../assets/Courses/llm.png";
import NLP from "../../assets/Courses/nlp.png";
import nophoto from "../../assets/nophoto.jpg";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 12H5"></path>
    <path d="M12 19l-7-7 7-7"></path>
  </svg>
);

const courseImageMapping = {
  "Deep Learning": DL,
  LLM: llm,
  NLP: NLP,
  "Speech Recognition": speech,
  ds: ds,
  dsa: ds,
  ml: ml,
  "Generative AI": llm,
};

const StudentDashboard = () => {
  const [subjects, setSubjects] = useState({});
  const [coursesData, setCoursesData] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const subjectsRes = await fetch(`${API_BASE_URL}/api/questions`);
        if (!subjectsRes.ok) {
          throw new Error(
            `Failed to fetch subjects: Status ${subjectsRes.status}`
          );
        }
        const structure = await subjectsRes.json();
        setSubjects(structure);

        const coursesRes = await fetch(`${API_BASE_URL}/api/courses`);
        if (!coursesRes.ok) {
          throw new Error(
            `Failed to fetch courses: Status ${coursesRes.status}`
          );
        }
        const courses = await coursesRes.json();
        setCoursesData(courses);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setErrorMessage(
          "Could not load course data. Please try refreshing the page."
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getCourseTitle = (subjectKey) => {
    return coursesData[subjectKey]?.title || subjectKey.toUpperCase();
  };

  const getImageSource = (subjectKey) => {
    return courseImageMapping[subjectKey] || nophoto;
  };

  const handleImageError = (event) => {
    if (event.target.src !== nophoto) {
      event.target.src = nophoto;
    }
  };

  const handleStartExam = async (subject, levelNum) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/questions/${subject}/${levelNum}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch questions: ${res.status}`);
      }
      const data = await res.json();
      if (!data || data.length === 0) {
        setErrorMessage("No questions updated for this level yet.");
        return;
      }
      setErrorMessage("");
      navigate(`/exam/${subject}/${levelNum}`);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setErrorMessage("Failed to load questions. Please try again later.");
    }
  };

  const handleCourseCardClick = (subjectKey, levelsAvailable) => {
    if (levelsAvailable > 0) {
      setSelectedSubject(subjectKey);
      setErrorMessage("");
    }
  };

  if (loading) return <Spinner />;
  if (!user) return null;

  if (selectedSubject) {
    let firstUnlockedFound = false;
    const courseTitle = getCourseTitle(selectedSubject);
    const currentSubjectLevels = subjects[selectedSubject];
    if (!currentSubjectLevels || currentSubjectLevels.length === 0) {
      return (
        <div className="min-h-screen bg-[#EEF1F9]">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
              onClick={() => setSelectedSubject(null)}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mb-8"
            >
              <BackIcon />
              <span>My Courses</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              {courseTitle}
            </h1>
            <div className="bg-white rounded-md shadow-sm p-6 text-center">
              <p className="text-xl text-gray-700 font-semibold">
                This course is currently unavailable.
              </p>
              <p className="text-gray-500 mt-2">Please check back later.</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#EEF1F9]">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => setSelectedSubject(null)}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mb-8"
          >
            <BackIcon />
            <span>My Courses</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {courseTitle}
          </h1>
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md font-semibold">
              {errorMessage}
            </div>
          )}
          <div className="flex flex-col gap-6">
            {subjects[selectedSubject]?.map((levelName) => {
              const levelNum = levelName.replace("level", "");
              const status =
                user.progress?.[selectedSubject]?.[levelName] || "locked";
              const isFirstUnlocked =
                status === "unlocked" && !firstUnlockedFound;
              if (isFirstUnlocked) {
                firstUnlockedFound = true;
              }
              const statusStyles = {
                completed: "bg-green-100 text-green-800",
                unlocked: "bg-blue-100 text-blue-800",
                locked: "bg-gray-100 text-gray-800",
              };
              return (
                <div
                  key={levelName}
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white rounded-md shadow-sm border border-gray-200 ${
                    status === "locked" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex-grow mb-4 sm:mb-0">
                    <span
                      className={`inline-block capitalize px-3 py-1 text-sm font-semibold rounded-full mb-3 ${statusStyles[status]}`}
                    >
                      {status}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900">
                      Practice Problems: Level {levelNum}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Sharpen your skills with a set of challenges.
                    </p>
                  </div>
                  <div className="w-full sm:w-auto sm:ml-6">
                    {status === "completed" && (
                      <button
                        className="w-full sm:w-auto bg-gray-700 text-white font-semibold py-2 px-5 rounded-lg hover:bg-gray-800 transition-colors"
                        onClick={() =>
                          handleStartExam(selectedSubject, levelNum)
                        }
                      >
                        Review Exam
                      </button>
                    )}
                    {isFirstUnlocked && (
                      <button
                        className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={() =>
                          handleStartExam(selectedSubject, levelNum)
                        }
                      >
                        Start Exam
                      </button>
                    )}
                    {status === "locked" && !isFirstUnlocked && (
                      <span className="text-gray-500 font-semibold">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF1F9]">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Courses</h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome back, {user.username}! Choose a subject to begin your
          practice.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {user.progress &&
            Object.keys(user.progress)
              .filter((subjectKey) => coursesData[subjectKey]?.isActive)
              .map((subjectKey) => {
                const courseTitle = getCourseTitle(subjectKey);
                const courseImage = getImageSource(subjectKey);
                const levelsAvailable = subjects[subjectKey]?.length || 0;
                return (
                  <div
                    key={subjectKey}
                    className={`bg-white rounded-lg w-full overflow-hidden flex flex-col ${
                      levelsAvailable > 0 ? "cursor-pointer" : "opacity-70"
                    }`}
                    onClick={() =>
                      handleCourseCardClick(subjectKey, levelsAvailable)
                    }
                  >
                    <img
                      src={courseImage}
                      alt={`${courseTitle} course illustration`}
                      className="w-auto h-48 m-2 object-cover rounded-md"
                      onError={handleImageError}
                    />
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {courseTitle}
                      </h2>
                      <p className="text-sm text-gray-600 mt-2">
                        {levelsAvailable > 0
                          ? `${levelsAvailable} Levels available`
                          : "Currently unavailable"}
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
