"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Heart, BookOpen, PenLine, Sparkles, Trash2 } from "lucide-react";


const STORAGE_KEYS = {
  savedThoughtIds: "daily-thought:savedThoughtIds",
  journalEntries: "daily-thought:journalEntries",
};

function getTodayIndex() {
  const start = new Date("2026-01-01T00:00:00");
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / msPerDay);
  return Math.abs(daysSinceStart);
}

function readJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

export default function DailyThoughtApp() {
  const [savedThoughtIds, setSavedThoughtIds] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalText, setJournalText] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [thoughts, setThoughts] = useState([]);

  const todayThought = useMemo(() => {
    if (thoughts.length === 0) return null;
    return thoughts[getTodayIndex() % thoughts.length];
  }, [thoughts]);

  useEffect(() => {
    fetch("/thoughts.json")
      .then((res) => res.json())
      .then((data) => setThoughts(data))
      .catch((err) => console.error("Failed to load thoughts:", err));
  }, []);

  useEffect(() => {
    setSavedThoughtIds(readJson(STORAGE_KEYS.savedThoughtIds, []));
    setJournalEntries(readJson(STORAGE_KEYS.journalEntries, []));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEYS.savedThoughtIds,
      JSON.stringify(savedThoughtIds)
    );
  }, [savedThoughtIds]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEYS.journalEntries,
      JSON.stringify(journalEntries)
    );
  }, [journalEntries]);

  if (!todayThought) {
    return <div>Loading...</div>;
  }

  const isSaved = savedThoughtIds.includes(todayThought.id);

  function toggleSaved(thoughtId) {
    setSavedThoughtIds((current) =>
      current.includes(thoughtId)
        ? current.filter((id) => id !== thoughtId)
        : [...current, thoughtId]
    );
  }

  function saveJournalEntry() {
    const cleanText = journalText.trim();
    if (!cleanText) return;

    const entry = {
      id: crypto.randomUUID(),
      thoughtId: todayThought.id,
      thoughtText: todayThought.text,
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    setJournalEntries((current) => [entry, ...current]);
    setJournalText("");
    setActiveTab("journal");
  }

  function deleteJournalEntry(entryId) {
    setJournalEntries((current) => current.filter((entry) => entry.id !== entryId));
  }

  const savedThoughts = thoughts.filter((thought) => savedThoughtIds.includes(thought.id));


  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-stone-100 text-stone-900">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-orange-700/70">
              Mark's Daily Thought
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Have a beautiful day</h1>
          </div>
          <div className="rounded-full bg-white/80 p-3 shadow-sm ring-1 ring-orange-100">
            <Sparkles className="h-6 w-6 text-orange-600" />
          </div>
        </header>

        <section className="rounded-[2rem] bg-white/90 p-6 shadow-xl shadow-orange-100/70 ring-1 ring-orange-100">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-orange-700">
            <BookOpen className="h-4 w-4" />
            Today’s thought
          </div>
          <blockquote className="text-3xl font-semibold leading-tight tracking-tight text-stone-900">
            “{todayThought.text}”
          </blockquote>
          <p className="mt-4 text-sm font-medium text-stone-500">{todayThought.author}</p>

          <button
            onClick={() => toggleSaved(todayThought?.id)}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold transition active:scale-[0.99] ${
              isSaved
                ? "bg-orange-600 text-white shadow-lg shadow-orange-200"
                : "bg-orange-100 text-orange-800 hover:bg-orange-200"
            }`}
          >
            <Heart className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
            {isSaved ? "Saved" : "Save this thought"}
          </button>
        </section>

        <section className="mt-5 rounded-[2rem] bg-stone-950 p-5 text-white shadow-xl shadow-stone-300/60">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-200">
            <PenLine className="h-4 w-4" />
            Reflect on it
          </div>
          <textarea
            value={journalText}
            onChange={(event) => setJournalText(event.target.value)}
            placeholder="Write a quick reflection..."
            className="min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/10 p-4 text-base text-white placeholder:text-white/45 outline-none ring-orange-300 transition focus:ring-2"
          />
          <button
            onClick={saveJournalEntry}
            disabled={!journalText.trim()}
            className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-base font-bold text-stone-950 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-stone-500"
          >
            Save journal entry
          </button>
        </section>

        <nav className="mt-6 grid grid-cols-3 rounded-2xl bg-white/70 p-1 text-sm font-semibold shadow-sm ring-1 ring-orange-100">
          {[
            ["today", "Today"],
            ["saved", "Saved"],
            ["journal", "Journal"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-xl px-3 py-2 transition ${
                activeTab === key
                  ? "bg-stone-950 text-white shadow-sm"
                  : "text-stone-600 hover:bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <section className="mt-4 flex-1">
          {activeTab === "today" && (
            <div className="rounded-3xl bg-white/60 p-5 text-sm leading-6 text-stone-600 ring-1 ring-orange-100">
              This first version saves everything locally on this device. It does not require an account, database, or paid app distribution.
            </div>
          )}

          {activeTab === "saved" && (
            <div className="space-y-3">
              {savedThoughts.length === 0 ? (
                <EmptyState text="Saved thoughts will appear here." />
              ) : (
                savedThoughts.map((thought) => (
                  <article
                    key={thought.id}
                    className="rounded-3xl bg-white/75 p-5 shadow-sm ring-1 ring-orange-100"
                  >
                    <p className="text-lg font-semibold leading-snug">“{thought.text}”</p>
                    <button
                      onClick={() => toggleSaved(thought.id)}
                      className="mt-3 text-sm font-semibold text-orange-700"
                    >
                      Remove from saved
                    </button>
                  </article>
                ))
              )}
            </div>
          )}

          {activeTab === "journal" && (
            <div className="space-y-3">
              {journalEntries.length === 0 ? (
                <EmptyState text="Journal entries will appear here." />
              ) : (
                journalEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-orange-100"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700/70">
                          {formatDate(entry.createdAt)}
                        </p>
                        <p className="mt-2 text-sm italic leading-5 text-stone-500">
                          “{entry.thoughtText}”
                        </p>
                      </div>
                      <button
                        onClick={() => deleteJournalEntry(entry.id)}
                        aria-label="Delete journal entry"
                        className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap text-base leading-7 text-stone-800">{entry.text}</p>
                  </article>
                ))
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl border border-dashed border-orange-200 bg-white/50 p-8 text-center text-sm font-medium text-stone-500">
      {text}
    </div>
  );
}
