import React, { useState, useEffect } from "react";
import {
  TextInput,
  Button,
  Alert,
  Card,
  SelectInput,
} from "./SharedComponents";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SubjectManagement = () => {
  // State for the "Create New Subject" form
  const [newSubjectName, setNewSubjectName] = useState("");
  const [numLevels, setNumLevels] = useState(1);
  const [createMessage, setCreateMessage] = useState({ type: "", text: "" });
  const [isCreating, setIsCreating] = useState(false);

  // State for the "Add New Level" form
  const [existingSubject, setExistingSubject] = useState("");
  const [addLevelMessage, setAddLevelMessage] = useState({
    type: "",
    text: "",
  });
  const [isAddingLevel, setIsAddingLevel] = useState(false);
  const [subjectsData, setSubjectsData] = useState({});

  // Fetch existing subjects to populate the dropdown
  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/questions`);
      const data = await res.json();
      setSubjectsData(data);
      if (Object.keys(data).length > 0) {
        // setExistingSubject(Object.keys(data)[0]);
        setSubjectsData(data);
        setExistingSubject("");
      }
    } catch (error) {
      console.error("Failed to fetch subjects structure:", error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateMessage({ type: "", text: "" });
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/create-subject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectName: newSubjectName,
            numLevels: parseInt(numLevels),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCreateMessage({ type: "success", text: data.message });
      setNewSubjectName(""); // Reset form
      fetchSubjects(); // Refresh the subjects list
    } catch (error) {
      setCreateMessage({
        type: "error",
        text: error.message || "Failed to create subject.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddLevel = async (e) => {
    e.preventDefault();
    setIsAddingLevel(true);
    setAddLevelMessage({ type: "", text: "" });
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/add-level`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectName: existingSubject }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAddLevelMessage({ type: "success", text: data.message });
      fetchSubjects(); // Refresh the subjects list
    } catch (error) {
      setAddLevelMessage({
        type: "error",
        text: error.message || "Failed to add level.",
      });
    } finally {
      setIsAddingLevel(false);
    }
  };

  const subjectOptions = Object.keys(subjectsData).map((s) => ({
    value: s,
    label: s.toUpperCase(),
  }));

  return (
    <div className="space-y-6">
      <Card title="Create New Subject">
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="New Subject Name"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="e.g., python_basics"
              required
            />
            <TextInput
              label="Initial Number of Levels"
              type="number"
              value={numLevels}
              onChange={(e) => setNumLevels(e.target.value)}
              placeholder="e.g., 1"
              required
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? "Creating Subject..." : "Create Subject"}
          </Button>
        </form>
        {createMessage.text && (
          <Alert
            type={createMessage.type}
            message={createMessage.text}
            className="mt-4"
          />
        )}
      </Card>
      <Card title="Add New Level to Existing Subject">
        <form onSubmit={handleAddLevel} className="space-y-4">
          <SelectInput
            label="Select Subject"
            value={existingSubject}
            onChange={(e) => setExistingSubject(e.target.value)}
            options={subjectOptions}
            placeholder="Choose a subject"
          />
          <Button
            type="submit"
            variant="secondary"
            size="md"
            disabled={isAddingLevel || !existingSubject}
            className="w-full"
          >
            {isAddingLevel ? "Adding Level..." : "+ Add New Level"}
          </Button>
        </form>
        {addLevelMessage.text && (
          <Alert
            type={addLevelMessage.type}
            message={addLevelMessage.text}
            className="mt-4"
          />
        )}
      </Card>
    </div>
  );
};

export default SubjectManagement;
