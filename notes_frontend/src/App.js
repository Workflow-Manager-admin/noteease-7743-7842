import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/**
 * NOTES WEB APP - Minimal, Light-Themed, Responsive, with CRUD functionality
 * - Sidebar: List of Notes
 * - Main Area: Create/Edit/View Note
 * - Header Bar: App title
 * - Floating add note button
 */

// PUBLIC_INTERFACE
function App() {
  // Notes stored as { id, title, content, lastEdited }
  const [notes, setNotes] = useState(() => {
    const saved = window.localStorage.getItem("noteease-notes");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedId, setSelectedId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editNote, setEditNote] = useState({ title: "", content: "" });
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const titleInputRef = useRef(null);

  // Save notes to localStorage for persistence
  useEffect(() => {
    window.localStorage.setItem("noteease-notes", JSON.stringify(notes));
  }, [notes]);

  // Handle window resize for responsiveness (hide sidebar on small screens)
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 800);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Select most recent note if selectedId is null and notes exist
  useEffect(() => {
    if (!selectedId && notes.length > 0) {
      setSelectedId(notes[0].id);
    }
    if (notes.length === 0) {
      setSelectedId(null);
      setIsCreating(false);
      setEditNote({ title: "", content: "" });
    }
  }, [notes, selectedId]);

  // Filtered notes for sidebar search
  const filteredNotes = search
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  // Get currently selected note
  const currentNote = notes.find((n) => n.id === selectedId);

  // Event Handlers

  // PUBLIC_INTERFACE
  const handleAddNote = () => {
    setIsCreating(true);
    setEditNote({ title: "", content: "" });
    setSelectedId(null);
    window.setTimeout(() => titleInputRef.current && titleInputRef.current.focus(), 100);
  };

  // PUBLIC_INTERFACE
  const handleSelectNote = (noteId) => {
    setSelectedId(noteId);
    setIsCreating(false);
    setEditNote({ title: "", content: "" });
  };

  // PUBLIC_INTERFACE
  const handleEditNote = () => {
    setIsCreating(false);
    if (currentNote) {
      setEditNote({
        title: currentNote.title,
        content: currentNote.content,
      });
    }
  };

  // PUBLIC_INTERFACE
  const handleDeleteNote = (idToDelete) => {
    let updated = notes.filter((n) => n.id !== idToDelete);
    setNotes(updated);
    if (selectedId === idToDelete) {
      setSelectedId(updated.length ? updated[0].id : null);
    }
    setIsCreating(false);
  };

  // PUBLIC_INTERFACE
  const handleSaveNote = (ev) => {
    ev.preventDefault();
    const trimmedTitle = (editNote.title || "").trim();
    const trimmedContent = (editNote.content || "").trim();
    if (!trimmedTitle && !trimmedContent) return; // Don't save empty

    // Edit existing or add new
    if (selectedId && !isCreating) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedId
            ? {
                ...n,
                title: trimmedTitle || "(Untitled)",
                content: trimmedContent,
                lastEdited: new Date().toISOString(),
              }
            : n
        )
      );
    } else {
      // Create
      const id = Date.now().toString();
      setNotes([
        {
          id,
          title: trimmedTitle || "(Untitled)",
          content: trimmedContent,
          lastEdited: new Date().toISOString(),
        },
        ...notes,
      ]);
      setSelectedId(id);
      setIsCreating(false);
    }
    setEditNote({ title: "", content: "" });
  };

  // PUBLIC_INTERFACE
  const handleFieldChange = (ev) => {
    setEditNote({ ...editNote, [ev.target.name]: ev.target.value });
  };

  // PUBLIC_INTERFACE
  const handleSidebarToggle = () => {
    setSidebarOpen((o) => !o);
  };

  // UI Components

  function HeaderBar() {
    return (
      <header className="nea-header">
        <button
          className="nea-sidebar-toggle"
          onClick={handleSidebarToggle}
          aria-label="Toggle Notes List"
        >
          ≡
        </button>
        <span className="nea-title">NoteEase</span>
      </header>
    );
  }

  function Sidebar() {
    return (
      <aside className={`nea-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="nea-sidebar-inner">
          <input
            className="nea-search"
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(ev) => setSearch(ev.target.value)}
            aria-label="Search notes"
          />
          <ul className="nea-notes-list">
            {filteredNotes.length === 0 && (
              <li className="nea-empty">No notes found.</li>
            )}
            {filteredNotes.map((n) => (
              <li
                key={n.id}
                className={
                  "nea-notes-list-item" +
                  (n.id === selectedId && !isCreating ? " selected" : "")
                }
                onClick={() => handleSelectNote(n.id)}
                tabIndex={0}
                aria-label={n.title}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSelectNote(n.id);
                }}
              >
                <div className="nea-note-title">
                  {n.title || "(Untitled)"}
                  <button
                    className="nea-delete-btn"
                    title="Delete"
                    aria-label={`Delete note: ${n.title}`}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleDeleteNote(n.id);
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="nea-note-mini-content">
                  {n.content && n.content.substring(0, 42)}
                </div>
                <div className="nea-note-date">
                  {new Date(n.lastEdited).toLocaleDateString()}{" "}
                  {new Date(n.lastEdited).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    );
  }

  function MainArea() {
    if (isCreating || (selectedId && editNote.title !== "")) {
      // Show create/edit form
      return (
        <div className="nea-main">
          <form className="nea-edit-form" onSubmit={handleSaveNote}>
            <input
              name="title"
              className="nea-input"
              type="text"
              placeholder="Title"
              ref={titleInputRef}
              value={editNote.title}
              onChange={handleFieldChange}
              aria-label="Note title"
              maxLength={128}
              autoFocus
            />
            <textarea
              name="content"
              className="nea-textarea"
              placeholder="Write your note..."
              value={editNote.content}
              onChange={handleFieldChange}
              rows={12}
              aria-label="Note content"
              maxLength={4096}
            />
            <div className="nea-form-btns">
              <button className="nea-btn nea-btn-main" type="submit">
                Save
              </button>
              <button
                className="nea-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setIsCreating(false);
                  setEditNote({ title: "", content: "" });
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      );
    } else if (currentNote) {
      // Show selected note (view mode)
      return (
        <div className="nea-main">
          <h2 className="nea-note-view-title">{currentNote.title}</h2>
          <div className="nea-note-view-content">
            {currentNote.content ? (
              <pre>{currentNote.content}</pre>
            ) : (
              <em className="nea-empty">(No content)</em>
            )}
          </div>
          <div className="nea-note-meta">
            Last edited:{" "}
            {new Date(currentNote.lastEdited).toLocaleString()}
          </div>
          <div className="nea-btns-row">
            <button className="nea-btn nea-btn-main" onClick={handleEditNote}>
              Edit
            </button>
            <button
              className="nea-btn"
              onClick={() => handleDeleteNote(currentNote.id)}
            >
              Delete
            </button>
          </div>
        </div>
      );
    } else {
      // No notes
      return (
        <div className="nea-main">
          <div className="nea-empty-msg">No notes to display. Get started by creating a new note!</div>
        </div>
      );
    }
  }

  // Floating add note button
  function FloatingAddButton() {
    return (
      <button
        className="nea-fab"
        title="Add Note"
        aria-label="Add a new note"
        onClick={handleAddNote}
      >
        +
      </button>
    );
  }

  return (
    <div className="nea-app-theme">
      <HeaderBar />
      <div className="nea-content-container">
        <Sidebar />
        <MainArea />
        <FloatingAddButton />
      </div>
    </div>
  );
}

export default App;
