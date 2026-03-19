"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Lock,
  Crown,
  Star,
  Loader2,
  CalendarClock,
} from "lucide-react";
import Link from "next/link";

interface PersonalPlan {
  id: string;
  code: string;
  text: string;
  gueltigkeit: string | null;
}

function getRemainingDays(gueltigkeit: string | null): number | null {
  if (!gueltigkeit) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(gueltigkeit);
  expiry.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  description: string;
}

interface TrainingPlan {
  id: string;
  title: string;
  duration: string;
  target: string;
  difficulty: "Anfaenger" | "Fortgeschritten" | "Profi";
  exercises: Exercise[];
  premium: boolean;
}

const trainingPlans: TrainingPlan[] = [
  {
    id: "neck-shoulders",
    title: "Nacken & Schultern",
    duration: "10 Min",
    target: "Verspannungen loesen",
    difficulty: "Anfaenger",
    premium: false,
    exercises: [
      {
        name: "Nackenrollen",
        sets: "2",
        reps: "10 pro Seite",
        description: "Langsam den Kopf von einer Seite zur anderen rollen.",
      },
      {
        name: "Schulterkreisen",
        sets: "2",
        reps: "15 pro Richtung",
        description: "Schultern nach vorne und hinten kreisen.",
      },
      {
        name: "Seitliche Nackendehnung",
        sets: "2",
        reps: "30 Sek halten",
        description: "Ohr zur Schulter neigen, mit der Hand sanft nachhelfen.",
      },
      {
        name: "Schulterblatt-Squeeze",
        sets: "3",
        reps: "12",
        description: "Schulterblaetter zusammenziehen und kurz halten.",
      },
    ],
  },
  {
    id: "lower-back",
    title: "Unterer Ruecken",
    duration: "15 Min",
    target: "Rueckenschmerzen lindern",
    difficulty: "Anfaenger",
    premium: false,
    exercises: [
      {
        name: "Katzenbuckel",
        sets: "3",
        reps: "10",
        description:
          "Im Vierfuesslerstand Ruecken abwechselnd rund und hohl machen.",
      },
      {
        name: "Knie zur Brust",
        sets: "2",
        reps: "30 Sek pro Seite",
        description: "Auf dem Ruecken liegend ein Knie zur Brust ziehen.",
      },
      {
        name: "Beckenkreisen",
        sets: "2",
        reps: "10 pro Richtung",
        description: "Im Stehen das Becken kreisen lassen.",
      },
      {
        name: "Bruecke",
        sets: "3",
        reps: "12",
        description: "Auf dem Ruecken liegend das Becken anheben.",
      },
    ],
  },
  {
    id: "desk-break",
    title: "Schreibtisch-Pause",
    duration: "5 Min",
    target: "Schnelle Entlastung",
    difficulty: "Anfaenger",
    premium: false,
    exercises: [
      {
        name: "Handgelenk-Kreisen",
        sets: "1",
        reps: "10 pro Richtung",
        description: "Handgelenke in beide Richtungen kreisen.",
      },
      {
        name: "Sitzende Rotation",
        sets: "1",
        reps: "8 pro Seite",
        description: "Im Sitzen den Oberkoerper zur Seite drehen.",
      },
      {
        name: "Nacken-Stretch",
        sets: "1",
        reps: "20 Sek pro Seite",
        description:
          "Kopf zur Seite neigen, gegenlaeutigen Arm nach unten strecken.",
      },
      {
        name: "Schulter-Shrugs",
        sets: "2",
        reps: "10",
        description: "Schultern zu den Ohren hochziehen und fallen lassen.",
      },
    ],
  },
  {
    id: "hip-mobility",
    title: "Huefte & Mobilitaet",
    duration: "12 Min",
    target: "Beweglichkeit verbessern",
    difficulty: "Fortgeschritten",
    premium: true,
    exercises: [
      {
        name: "Hueftkreisen",
        sets: "2",
        reps: "10 pro Seite",
        description: "Im Stehen das angehobene Bein kreisen.",
      },
      {
        name: "90/90 Stretch",
        sets: "2",
        reps: "45 Sek pro Seite",
        description:
          "Beide Beine im 90-Grad-Winkel am Boden, Oberkoerper nach vorne lehnen.",
      },
      {
        name: "Ausfallschritt mit Rotation",
        sets: "2",
        reps: "8 pro Seite",
        description: "Im Ausfallschritt den Oberkoerper zur Seite drehen.",
      },
      {
        name: "Frosch-Stretch",
        sets: "2",
        reps: "45 Sek halten",
        description:
          "Auf allen Vieren Knie weit auseinander, Hueften nach hinten schieben.",
      },
    ],
  },
  {
    id: "core-stability",
    title: "Core Stabilitaet",
    duration: "15 Min",
    target: "Rumpf staerken",
    difficulty: "Fortgeschritten",
    premium: true,
    exercises: [
      {
        name: "Plank",
        sets: "3",
        reps: "30 Sek halten",
        description: "Unterarmstuetz mit geradem Koerper halten.",
      },
      {
        name: "Dead Bug",
        sets: "3",
        reps: "10 pro Seite",
        description: "Auf dem Ruecken gegengleich Arm und Bein strecken.",
      },
      {
        name: "Bird Dog",
        sets: "3",
        reps: "10 pro Seite",
        description: "Im Vierfuesslerstand gegengleich Arm und Bein strecken.",
      },
      {
        name: "Seitlicher Plank",
        sets: "2",
        reps: "20 Sek pro Seite",
        description: "Seitlicher Unterarmstuetz mit geradem Koerper.",
      },
    ],
  },
  {
    id: "knee-rehab",
    title: "Knie Rehabilitation",
    duration: "12 Min",
    target: "Knie staerken",
    difficulty: "Anfaenger",
    premium: true,
    exercises: [
      {
        name: "Quad-Sets",
        sets: "3",
        reps: "10",
        description:
          "Im Sitzen Oberschenkelmuskel anspannen, Knie durchdruecken.",
      },
      {
        name: "Fersen-Slides",
        sets: "2",
        reps: "15 pro Seite",
        description: "Auf dem Ruecken liegend die Ferse zum Gesaess ziehen.",
      },
      {
        name: "Mini-Kniebeugen",
        sets: "3",
        reps: "12",
        description: "Leichte Kniebeugen mit kleinem Bewegungsradius.",
      },
      {
        name: "Beinheben seitlich",
        sets: "2",
        reps: "15 pro Seite",
        description: "Auf der Seite liegend das obere Bein anheben.",
      },
    ],
  },
];

function TrainingPlanCard({
  plan,
  isSubscribed,
}: {
  plan: TrainingPlan;
  isSubscribed: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLocked = plan.premium && !isSubscribed;

  const difficultyColors = {
    Anfaenger: "bg-green-500/20 text-green-400",
    Fortgeschritten: "bg-yellow-500/20 text-yellow-400",
    Profi: "bg-red-500/20 text-red-400",
  };

  const handleClick = () => {
    if (!isLocked) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={`bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden ${isLocked ? "opacity-80" : ""}`}
    >
      <button
        onClick={handleClick}
        className={`w-full p-5 text-left transition-colors ${isLocked ? "cursor-not-allowed" : "hover:bg-white/5"}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-white">{plan.title}</h3>
              {plan.premium && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#4826ae]/30 text-[#a78bfa]">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-white/60">
                <Clock className="w-4 h-4" />
                {plan.duration}
              </div>
              <div className="flex items-center gap-1.5 text-white/60">
                <Target className="w-4 h-4" />
                {plan.target}
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[plan.difficulty]}`}
              >
                {plan.difficulty}
              </span>
            </div>
          </div>
          <div className="ml-4 text-white/60">
            {isLocked ? (
              <Lock className="w-5 h-5" />
            ) : isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>

        {isLocked && (
          <div className="mt-3 flex items-center gap-2">
            <Link
              href="/subscription"
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-[#57ff55] hover:underline"
            >
              Abo abschliessen um freizuschalten
            </Link>
          </div>
        )}
      </button>

      {isExpanded && !isLocked && (
        <div className="px-5 pb-5 border-t border-white/10">
          <div className="pt-4 space-y-4">
            {plan.exercises.map((exercise, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-white">{exercise.name}</h4>
                  <span className="text-sm text-[#57ff55] font-medium">
                    {exercise.sets}x {exercise.reps}
                  </span>
                </div>
                <p className="text-sm text-white/60">{exercise.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonalPlanCard({ plan }: { plan: PersonalPlan }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const remainingDays = getRemainingDays(plan.gueltigkeit);

  const validityColor =
    remainingDays === null
      ? null
      : remainingDays <= 3
        ? "text-red-400"
        : remainingDays <= 7
          ? "text-yellow-400"
          : "text-[#57ff55]";

  return (
    <div className="bg-[#1a1a1a] border border-[#57ff55]/30 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-white">
                Persoenlicher Trainingsplan
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#57ff55]/20 text-[#57ff55]">
                <Star className="w-3 h-3" />
                Dein Plan
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-white/60">Code: {plan.code}</p>
              {remainingDays !== null && (
                <div
                  className={`flex items-center gap-1.5 text-sm font-medium ${validityColor}`}
                >
                  <CalendarClock className="w-4 h-4" />
                  {remainingDays === 0
                    ? "Laeuft heute ab"
                    : remainingDays === 1
                      ? "Noch 1 Tag gueltig"
                      : `Noch ${remainingDays} Tage gueltig`}
                </div>
              )}
            </div>
          </div>
          <div className="ml-4 text-white/60">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-white/10">
          <div className="pt-4 space-y-3">
            {plan.gueltigkeit && (
              <div
                className={`flex items-center gap-2 text-sm font-medium ${validityColor}`}
              >
                <CalendarClock className="w-4 h-4" />
                {remainingDays === 0
                  ? "Dieser Plan laeuft heute ab"
                  : remainingDays === 1
                    ? "Dieser Plan laeuft morgen ab"
                    : `Dieser Plan ist noch ${remainingDays} Tage gueltig (bis ${new Date(plan.gueltigkeit).toLocaleDateString("de-DE")})`}
              </div>
            )}
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/80 whitespace-pre-wrap">{plan.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrainingContent() {
  const { isSubscribed, user } = useAuth();
  const [personalPlans, setPersonalPlans] = useState<PersonalPlan[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(true);

  const freePlans = trainingPlans.filter((p) => !p.premium);
  const premiumPlans = trainingPlans.filter((p) => p.premium);

  useEffect(() => {
    if (!user) {
      setLoadingPersonal(false);
      return;
    }

    const fetchPersonalPlans = async () => {
      try {
        const response = await fetch(
          `/api/training/my-plans?userId=${user.uid}`,
        );
        const data = await response.json();
        if (data.plans) {
          setPersonalPlans(data.plans);
        }
      } catch (error) {
        console.error("Error fetching personal plans:", error);
      } finally {
        setLoadingPersonal(false);
      }
    };

    fetchPersonalPlans();
  }, [user]);

  return (
    <main className="flex flex-col min-h-dvh bg-black">
      <Header />

      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurueck zur Uebersicht
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Mini Trainingsplaene
            </h1>
            <p className="text-white/70">
              Kurze, effektive Uebungen fuer verschiedene Koerperbereiche.
              Klicke auf einen Plan um die Uebungen zu sehen.
            </p>
          </div>

          {/* Personal Training Plans */}
          {(loadingPersonal || personalPlans.length > 0) && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-[#57ff55]" />
                Meine Trainingsplaene
              </h2>
              {loadingPersonal ? (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[#57ff55] animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {personalPlans.map((plan) => (
                    <PersonalPlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Free Training Plans */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              Kostenlose Plaene
            </h2>
            <div className="grid gap-4">
              {freePlans.map((plan) => (
                <TrainingPlanCard
                  key={plan.id}
                  plan={plan}
                  isSubscribed={isSubscribed}
                />
              ))}
            </div>
          </div>

          {/* Premium Training Plans */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#a78bfa]" />
              Premium Plaene
              {!isSubscribed && (
                <span className="text-sm font-normal text-white/50 ml-2">
                  (Abo erforderlich)
                </span>
              )}
            </h2>
            <div className="grid gap-4">
              {premiumPlans.map((plan) => (
                <TrainingPlanCard
                  key={plan.id}
                  plan={plan}
                  isSubscribed={isSubscribed}
                />
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-[#1a1a1a] border border-white/10 rounded-xl">
            <p className="text-sm text-white">
              <span className="font-medium">Hinweis:</span> Diese Uebungen
              ersetzen keine professionelle medizinische Beratung. Bei Schmerzen
              oder Unsicherheiten wende dich an einen Physiotherapeuten oder
              nutze unseren{" "}
              <Link href="/chat" className="text-[#57ff55] hover:underline">
                PhysioAssistent
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TrainingPage() {
  return (
    <AuthGuard>
      <TrainingContent />
    </AuthGuard>
  );
}
