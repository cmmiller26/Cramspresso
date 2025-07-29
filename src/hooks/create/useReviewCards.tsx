import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  isEditing?: boolean;
  isNew?: boolean;
}

interface EditState {
  question: string;
  answer: string;
}

export function useReviewCards() {
  const router = useRouter();

  // Core state
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editStates, setEditStates] = useState<Record<string, EditState>>({});

  // Selection and bulk operations
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  // Load cards function (called on mount)
  const loadCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockCards: Flashcard[] = [
        {
          id: "1",
          question: "What is the main topic covered in this document?",
          answer:
            "The document covers the key concepts and principles discussed in the uploaded material, focusing on practical applications and real-world examples.",
        },
        {
          id: "2",
          question: "What are the important points to remember?",
          answer:
            "The critical information includes the main definitions, examples, and practical applications mentioned in the source material.",
        },
        {
          id: "3",
          question: "How can these concepts be applied in practice?",
          answer:
            "These concepts can be implemented through systematic approaches, careful planning, and consistent application of the principles outlined.",
        },
        {
          id: "4",
          question: "What are the key benefits of this approach?",
          answer:
            "The main benefits include improved efficiency, better outcomes, and more reliable results when properly implemented.",
        },
      ];

      setCards(mockCards);
    } catch {
      setError("Failed to load flashcards. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Card editing functions
  const startEditing = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      setEditStates((prev) => ({
        ...prev,
        [cardId]: {
          question: card.question,
          answer: card.answer,
        },
      }));

      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, isEditing: true } : c))
      );
    },
    [cards]
  );

  const cancelEditing = useCallback((cardId: string) => {
    setEditStates((prev) => {
      const newState = { ...prev };
      delete newState[cardId];
      return newState;
    });

    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isEditing: false } : c))
    );
  }, []);

  const saveCard = useCallback(
    async (cardId: string) => {
      const editState = editStates[cardId];
      if (!editState) return;

      // Validate content
      if (!editState.question.trim() || !editState.answer.trim()) {
        setError("Both question and answer are required.");
        return;
      }

      try {
        // Simulate save operation
        await new Promise((resolve) => setTimeout(resolve, 500));

        setCards((prev) =>
          prev.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  question: editState.question.trim(),
                  answer: editState.answer.trim(),
                  isEditing: false,
                  isNew: false,
                }
              : c
          )
        );

        setEditStates((prev) => {
          const newState = { ...prev };
          delete newState[cardId];
          return newState;
        });

        setError(null);
      } catch {
        setError("Failed to save card. Please try again.");
      }
    },
    [editStates]
  );

  const deleteCard = useCallback(async (cardId: string) => {
    try {
      // Simulate delete operation
      await new Promise((resolve) => setTimeout(resolve, 300));

      setCards((prev) => prev.filter((c) => c.id !== cardId));

      // Clean up edit state and selection
      setEditStates((prev) => {
        const newState = { ...prev };
        delete newState[cardId];
        return newState;
      });

      setSelectedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    } catch {
      setError("Failed to delete card. Please try again.");
    }
  }, []);

  const addNewCard = useCallback(() => {
    const newId = `new-${Date.now()}`;
    const newCard: Flashcard = {
      id: newId,
      question: "",
      answer: "",
      isEditing: true,
      isNew: true,
    };

    setCards((prev) => [...prev, newCard]);
    setEditStates((prev) => ({
      ...prev,
      [newId]: { question: "", answer: "" },
    }));
  }, []);

  // Selection functions
  const toggleCardSelection = useCallback((cardId: string) => {
    setSelectedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  const selectAllCards = useCallback(() => {
    const allCardIds = cards.map((c) => c.id);
    setSelectedCards(new Set(allCardIds));
  }, [cards]);

  const clearSelection = useCallback(() => {
    setSelectedCards(new Set());
  }, []);

  // Bulk operations
  const bulkDeleteCards = useCallback(async () => {
    if (selectedCards.size === 0) return;

    setBulkOperationLoading(true);
    try {
      // Simulate bulk delete
      await new Promise((resolve) => setTimeout(resolve, 800));

      setCards((prev) => prev.filter((c) => !selectedCards.has(c.id)));
      setSelectedCards(new Set());
    } catch {
      setError("Failed to delete selected cards. Please try again.");
    } finally {
      setBulkOperationLoading(false);
    }
  }, [selectedCards]);

  // Save set with progress
  const handleSaveSet = useCallback(async () => {
    setIsSaving(true);
    setSaveProgress(0);

    try {
      // Simulate save progress
      const steps = [
        { progress: 25 },
        { progress: 50 },
        { progress: 75 },
        { progress: 100 },
      ];

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setSaveProgress(step.progress);
      }

      // In real implementation, call your API here
      const setId = `set-${Date.now()}`;

      router.push(`/sets/${setId}`);
    } catch {
      setError("Failed to save flashcard set. Please try again.");
      setIsSaving(false);
    }
  }, [router]);

  // Update edit state
  const updateEditState = useCallback(
    (cardId: string, field: "question" | "answer", value: string) => {
      setEditStates((prev) => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          [field]: value,
        },
      }));
    },
    []
  );

  // Error handling
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load cards on hook initialization
  useState(() => {
    loadCards();
  });

  return {
    // State
    cards,
    loading,
    error,
    selectedCards,
    editStates,
    bulkOperationLoading,
    isSaving,
    saveProgress,

    // Card operations
    startEditing,
    cancelEditing,
    saveCard,
    deleteCard,
    addNewCard,
    updateEditState,

    // Selection operations
    toggleCardSelection,
    selectAllCards,
    clearSelection,
    bulkDeleteCards,

    // Save operations
    handleSaveSet,

    // Error handling
    clearError,

    // Manual reload
    loadCards,
  };
}
