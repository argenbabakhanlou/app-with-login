"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Note = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

async function fetchNotes(): Promise<Note[]> {
  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}

async function createNote(content: string): Promise<Note> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
}

async function updateNote(id: string, content: string): Promise<Note> {
  const res = await fetch(`/api/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to update note");
  return res.json();
}

async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete note");
}

export function Notes() {
  const queryClient = useQueryClient();
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: fetchNotes,
  });

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: (newNote) => {
      queryClient.setQueryData(["notes"], (old: Note[] = []) => [
        newNote,
        ...old,
      ]);
      setNewContent("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      updateNote(id, content),
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(["notes"], (old: Note[] = []) =>
        old.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
      );
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onMutate: (deletedId) => {
      queryClient.setQueryData(["notes"], (old: Note[] = []) =>
        old.filter((n) => n.id !== deletedId),
      );
    },
  });

  function startEdit(note: Note) {
    setEditingId(note.id);
    setEditContent(note.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 mb-4">Your notes</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newContent.trim()) createMutation.mutate(newContent);
        }}
        className="mb-6 flex flex-col gap-2"
      >
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Write a note..."
          rows={3}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !newContent.trim()}
          className="self-end rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? "Adding..." : "Add note"}
        </button>
      </form>

      {isLoading && <p className="text-sm text-zinc-400">Loading notes...</p>}

      {notes.length === 0 && !isLoading && (
        <p className="text-sm text-zinc-400">No notes yet. Write one above.</p>
      )}

      <ul className="flex flex-col gap-3">
        {notes.map((note) => (
          <li
            key={note.id}
            className="bg-white rounded-xl border border-zinc-200 p-4"
          >
            {editingId === note.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateMutation.mutate({ id: note.id, content: editContent });
                }}
                className="flex flex-col gap-2"
              >
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending || !editContent.trim()}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-40"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm text-zinc-800 whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-zinc-400">
                    {new Date(note.createdAt).toLocaleString()}
                    {note.updatedAt !== note.createdAt && " · edited"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(note)}
                      className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(note.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
