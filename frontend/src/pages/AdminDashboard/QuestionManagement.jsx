import React, { useState, useEffect } from "react";
import {
  SelectInput,
  TextInput,
  TextareaInput,
  Button,
  Alert,
  Card,
  FileUploader, // Note: This was previously CSVUploader
} from "./SharedComponents";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const QuestionManagement = () => {
  const [subjectsData, setSubjectsData] = useState({});
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [testCases, setTestCases] = useState([
    { input: "", expected_output: "" },
  ]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/questions`);
      const data = await res.json();
      setSubjectsData(data);
      if (Object.keys(data).length > 0) {
        const firstSubject = Object.keys(data)[0];
        setSubject(firstSubject);
      }
    } catch (error) {
      console.error("Failed to fetch subjects structure:", error);
      setMessage({ type: "error", text: "Could not load subjects." });
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
  };

  const addTestCase = () => {
    if (testCases.length < 5) {
      setTestCases([...testCases, { input: "", expected_output: "" }]);
    }
  };

  const removeTestCase = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    const newQuestion = {
      id,
      title,
      description,
      test_cases: testCases.filter(
        (tc) => tc.input.trim() !== "" || tc.expected_output.trim() !== ""
      ),
    };

    try {
      // Note: The original endpoint was POST /api/questions
      const res = await fetch(`${API_BASE_URL}/api/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          level,
          newQuestion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage({ type: "success", text: data.message });
      // Reset form fields
      setId("");
      setTitle("");
      setDescription("");
      setTestCases([{ input: "", expected_output: "" }]);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "An error occurred while adding the question.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectOptions = Object.keys(subjectsData).map((s) => ({
    value: s,
    label: s.toUpperCase(),
  }));

  const levelOptions = (subjectsData[subject] || []).map((l) => ({
    value: l.replace("level", ""),
    label: `Level ${l.replace("level", "")}`,
  }));

  return (
    <div className="space-y-6">
      <Card title="Add Single Question">
        <form onSubmit={handleAddQuestion} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectInput
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              options={subjectOptions}
              placeholder="Select a subject"
            />
            <SelectInput
              label="Level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              options={levelOptions}
              disabled={!subject}
              placeholder="Select a level"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Question ID"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g., q3, find_average"
              required
            />
            <TextInput
              label="Question Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter question title"
              required
            />
          </div>

          <TextareaInput
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter question description..."
            required
            rows={5}
          />

          <div>
            <label className="block font-medium mb-3 text-slate-700 text-sm">
              Test Cases (Max 5)
            </label>
            <div className="space-y-3">
              {testCases.map((tc, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 lg:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Test Input {index + 1}
                    </label>
                    <textarea
                      className="w-full p-2.5 border border-slate-300 rounded-md text-sm bg-white text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-y"
                      value={tc.input}
                      onChange={(e) =>
                        handleTestCaseChange(index, "input", e.target.value)
                      }
                      placeholder="e.g., 5 10"
                      rows="2"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Expected Output {index + 1}
                    </label>
                    <textarea
                      className="w-full p-2.5 border border-slate-300 rounded-md text-sm bg-white text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-y"
                      value={tc.expected_output}
                      onChange={(e) =>
                        handleTestCaseChange(
                          index,
                          "expected_output",
                          e.target.value
                        )
                      }
                      placeholder="e.g., 15"
                      rows="2"
                    />
                  </div>
                  {testCases.length > 1 && (
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeTestCase(index)}
                        className="w-full"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {testCases.length < 5 && (
              <Button
                type="button"
                variant="secondary"
                onClick={addTestCase}
                className="mt-3"
              >
                + Add Test Case
              </Button>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Adding Question..." : "Add Question"}
          </Button>
        </form>
        {message.text && (
          <Alert type={message.type} message={message.text} className="mt-4" />
        )}
      </Card>

      <Card>
        <FileUploader
          title="Upload Full Level via JSON"
          endpoint="/upload-questions"
          templateName="questions_template.json"
          onUploadComplete={fetchSubjects}
          acceptFormat=".json"
          extraData={{ subject, level: level.replace("level", "") }}
        />
      </Card>
    </div>
  );
};

export default QuestionManagement;
