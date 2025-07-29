import { FileText, Brain, GraduationCap } from "lucide-react";

export function Features() {
  const features = [
    {
      icon: <FileText className="h-12 w-12 text-primary" />,
      title: "Upload Documents",
      description:
        "Simply drag and drop your PDFs, text files, or notes. We support multiple formats to fit your study materials.",
    },
    {
      icon: <Brain className="h-12 w-12 text-primary" />,
      title: "AI Generation",
      description:
        "Our AI analyzes your content and creates targeted Q&A flashcards, highlighting key concepts and important details.",
    },
    {
      icon: <GraduationCap className="h-12 w-12 text-primary" />,
      title: "Study Smart",
      description:
        "Review your personalized flashcards with spaced repetition, track your progress, and focus on areas that need work.",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 bg-muted/50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Transform your study materials into effective flashcards in three
            simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
