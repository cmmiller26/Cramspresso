"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateFlowContainer } from "@/components/create/flow/CreateFlowContainer";
import { useCreateFlow } from "@/hooks/create/flow/useCreateFlow";

export default function CreatePage() {
  const createFlow = useCreateFlow();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        {createFlow.state.step !== "upload" && (
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={createFlow.handleStartOver}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        )}

        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create New Flashcard Set
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload content and let AI create personalized flashcards instantly
        </p>
      </div>

      {/* Main Flow Container */}
      <CreateFlowContainer
        state={createFlow.state}
        generationState={createFlow.generationState}
        previewState={createFlow.previewState}
        onFileUploaded={createFlow.handleFileUploaded}
        onTextInput={createFlow.handleTextInput}
        onUploadCancelled={createFlow.handleUploadCancelled}
        onStartOver={createFlow.handleStartOver}
        onRetryGeneration={createFlow.handleRetryGeneration}
        onCancelGeneration={createFlow.handleCancelGeneration}
        onSaveSet={createFlow.handleSaveSet}
        onToggleAnalysis={createFlow.handleToggleAnalysis}
        onNavigateToEdit={createFlow.handleNavigateToEdit}
        onNavigateToStudy={createFlow.handleNavigateToStudy}
      />
    </div>
  );
}
