import React, { useState, useRef, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const Spinner = () => (
  <div className="flex justify-center items-center p-12">
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
    </div>
  </div>
);

export const SelectInput = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Select an option",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const hasOptions = options && options.length > 0;
  const selectedOption = options?.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : "";
  const filteredOptions = hasOptions
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled && hasOptions) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  const handleOptionSelect = (option) => {
    onChange({ target: { value: option.value } });
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
    } else if (e.key === "Enter" && filteredOptions.length === 1) {
      handleOptionSelect(filteredOptions[0]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block font-semibold mb-3 text-slate-700 text-sm tracking-wide">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled || !hasOptions}
          className={`w-full p-4 pr-12 text-left border-2 rounded-xl text-base transition-all duration-300 ease-in-out
            ${
              disabled || !hasOptions
                ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                : isOpen
                ? "bg-white border-purple-500 border-2"
                : " from-white to-slate-50 border-slate-300 text-slate-700 hover:border-purple-300 "
            }`}
        >
          <span className={displayValue ? "text-slate-800" : "text-slate-500"}>
            {displayValue ||
              (hasOptions ? placeholder : "No options available")}
          </span>
        </button>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <svg
            className={`w-5 h-5 transition-all duration-300 ease-in-out ${
              disabled || !hasOptions
                ? "text-slate-300"
                : isOpen
                ? "text-purple-600 rotate-180"
                : "text-purple-400"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {isOpen && hasOptions && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-purple-200 rounded-xl shadow-xl shadow-purple-100/20 overflow-hidden">
            {options.length > 5 && (
              <div className="p-3 border-b border-purple-100">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search options..."
                  className="w-full p-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleOptionSelect({ value: "", label: placeholder })
                    }
                    className={`w-full text-left p-3 hover:bg-purple-50 transition-colors duration-150 border-b border-purple-50 last:border-b-0 ${
                      value === ""
                        ? "bg-purple-100 text-purple-800 font-medium"
                        : "text-slate-600"
                    }`}
                  >
                    <span className="text-slate-500 italic">{placeholder}</span>
                  </button>
                  {filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleOptionSelect(option)}
                      className={`w-full text-left p-3 hover:bg-purple-50 transition-colors duration-150 border-b border-purple-50 last:border-b-0 ${
                        value === option.value
                          ? "bg-purple-100 text-purple-800 font-medium"
                          : "text-slate-700 hover:text-purple-700"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        {option.label}
                        {value === option.value && (
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-3 text-slate-500 text-center">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {!hasOptions && (
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          No options available
        </p>
      )}
    </div>
  );
};

export const TextInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
}) => {
  return (
    <div className={className}>
      <label className="block font-medium mb-2 text-slate-700 text-sm">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full p-3.5 border border-slate-300 rounded-lg text-base bg-white text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-slate-400 shadow-sm"
      />
    </div>
  );
};

export const TextareaInput = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 4,
}) => {
  return (
    <div>
      <label className="block font-medium mb-2 text-slate-700 text-sm">
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="w-full p-3.5 border border-slate-300 rounded-lg text-base bg-white text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-slate-400 shadow-sm resize-y"
      />
    </div>
  );
};

export const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}) => {
  const baseClasses =
    "font-medium cursor-pointer transition-all duration-200 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-purple-600 text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
    secondary:
      "bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
    outline:
      "border border-purple-600 text-purple-600 bg-white hover:bg-purple-50 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
  };
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-5 py-3 text-lg",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Alert = ({ type, message, className = "" }) => {
  const types = {
    success: "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500",
    error: "bg-red-50 text-red-800 border-l-4 border-red-500",
    info: "bg-blue-50 text-blue-800 border-l-4 border-blue-500",
  };
  return (
    <div
      className={`px-4 py-3 rounded-lg font-medium ${types[type]} ${className}`}
    >
      {message}
    </div>
  );
};

export const Card = ({ title, children, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 relative z-10 ${className}`}
    >
      {title && (
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export const FileUploader = ({
  title,
  endpoint,
  templateName,
  onUploadComplete,
  acceptFormat = ".csv",
  extraData = {},
}) => {
  const [file, setFile] = React.useState(null);
  const [message, setMessage] = React.useState({ type: "", text: "" });
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage({ type: "", text: "" });
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Please select a file first." });
      return;
    }
    setIsUploading(true);
    setMessage({ type: "", text: "" });
    const formData = new FormData();
    formData.append("file", file);
    for (const key in extraData) {
      formData.append(key, extraData[key]);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin${endpoint}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage({ type: "success", text: data.message });
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Upload failed." });
    } finally {
      setIsUploading(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <h4 className="text-slate-800 text-lg font-semibold">{title}</h4>
      </div>
      <p className="text-slate-600 mb-5 text-sm">
        Upload a file following the required format.{" "}
        <a
          href={`/templates/${templateName}`}
          download
          className="text-purple-600 font-medium hover:text-purple-700 hover:underline transition-colors duration-200 inline-flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Template
        </a>
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="file"
            accept={acceptFormat}
            onChange={handleFileChange}
            ref={fileInputRef}
            className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-800 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <Button
          onClick={handleUpload}
          disabled={isUploading || !file}
          variant="secondary"
          className="whitespace-nowrap"
        >
          {isUploading ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Uploading...
            </span>
          ) : (
            "Upload File"
          )}
        </Button>
      </div>
      {message.text && (
        <Alert type={message.type} message={message.text} className="mt-4" />
      )}
    </div>
  );
};
