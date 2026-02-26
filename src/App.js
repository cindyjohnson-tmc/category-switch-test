import { useState } from "react";

// Rule definitions
const RULES = {
  living: {
    id: "living",
    question: "Is it LIVING?",
    check: (word) => ["CAT", "DOG", "TREE", "BIRD", "FISH", "LION", "BEAR", "ROSE", "FERN", "WOLF"].includes(word),
  },
  length: {
    id: "length",
    question: "More than 5 letters?",
    check: (word) => word.length > 5,
  },
};

// Word stimuli
const WORDS = [
  "CAT", "CHAIR", "DOG", "TABLE", "TREE", "PHONE", "BIRD", "LAMP",
  "FISH", "DOOR", "LION", "WINDOW", "BEAR", "CLOCK", "ROSE", "KEYBOARD",
  "FERN", "SCREEN", "WOLF", "MOUSE", "DESK", "RABBIT", "PLANT", "BOOK"
];

const S = {
  page: "min-h-screen bg-black text-white flex items-center justify-center p-5",
  card: "bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md",
  cardWide: "bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg",
  h1: "text-2xl font-bold text-white mb-2",
  sub: "text-zinc-400 text-sm leading-relaxed",
  green: "text-[#39ff6a]",
  label: "text-xs uppercase tracking-widest text-zinc-500 font-semibold",
  btnPrimary: "w-full border-2 border-[#39ff6a] text-[#39ff6a] font-bold py-3.5 rounded-xl text-base hover:bg-[#39ff6a] hover:text-black transition",
  btn: "flex-1 border-2 border-zinc-700 text-white font-bold py-6 rounded-xl text-xl hover:border-[#39ff6a] hover:text-[#39ff6a] transition",
};

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  const [phase, setPhase] = useState("welcome");
  const [isPractice, setIsPractice] = useState(false);
  const [ruleSequence, setRuleSequence] = useState([]);
  const [wordSequence, setWordSequence] = useState([]);
  const [trialIdx, setTrialIdx] = useState(0);
  const [trialStart, setTrialStart] = useState(null);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Start practice (3 trials, 1 switch)
  function startPractice() {
    setIsPractice(true);
    const practiceWords = ["CAT", "TREE", "LAMP"];
    const practiceRules = ["living", "living", "length"]; // Switch at trial 3
    setRuleSequence(practiceRules);
    setWordSequence(practiceWords);
    setTrialIdx(0);
    setResults([]);
    setTrialStart(Date.now());
    setPhase("testing");
  }

  // Start real test (30 trials)
  function startTest() {
    setIsPractice(false);
    const shuffledWords = shuffleArray(WORDS).slice(0, 30);

    // Generate rule sequence with switches
    const ruleTypes = ["living", "length"];
    let currentRule = ruleTypes[Math.floor(Math.random() * 2)];
    const rules = [currentRule];

    for (let i = 1; i < 30; i++) {
      const shouldSwitch = Math.random() < 0.35;
      if (shouldSwitch) {
        currentRule = currentRule === "living" ? "length" : "living";
      }
      rules.push(currentRule);
    }

    setRuleSequence(rules);
    setWordSequence(shuffledWords);
    setTrialIdx(0);
    setResults([]);
    setTrialStart(Date.now());
    setPhase("testing");
  }

  function handleResponse(answer) {
    const rt = Date.now() - trialStart;
    const currentRule = RULES[ruleSequence[trialIdx]];
    const currentWord = wordSequence[trialIdx];
    const correctAnswer = currentRule.check(currentWord) ? "Yes" : "No";
    const isCorrect = answer === correctAnswer;

    // Determine if this is a switch trial
    const isSwitch = trialIdx > 0 && ruleSequence[trialIdx] !== ruleSequence[trialIdx - 1];

    setResults(prev => [...prev, {
      trial: trialIdx + 1,
      word: currentWord,
      rule: ruleSequence[trialIdx],
      correctAnswer,
      userAnswer: answer,
      correct: isCorrect,
      rt,
      isSwitch
    }]);

    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => {
      if (trialIdx < ruleSequence.length - 1) {
        setTrialIdx(trialIdx + 1);
        setTrialStart(Date.now());
        setFeedback(null);
      } else {
        // Practice or test complete
        if (isPractice) {
          setPhase("practice-complete");
        } else {
          setPhase("results");
        }
      }
    }, 500);
  }

  // Calculate results
  function calculateResults() {
    const switchTrials = results.filter(r => r.isSwitch);
    const stayTrials = results.filter(r => !r.isSwitch && r.trial > 1);

    const switchCorrect = switchTrials.filter(r => r.correct);
    const stayCorrect = stayTrials.filter(r => r.correct);

    const switchAccuracy = switchTrials.length > 0 ? (switchCorrect.length / switchTrials.length) * 100 : 0;
    const stayAccuracy = stayTrials.length > 0 ? (stayCorrect.length / stayTrials.length) * 100 : 0;

    const switchRT = switchCorrect.length > 0 ? switchCorrect.reduce((acc, r) => acc + r.rt, 0) / switchCorrect.length : 0;
    const stayRT = stayCorrect.length > 0 ? stayCorrect.reduce((acc, r) => acc + r.rt, 0) / stayCorrect.length : 0;

    const switchCostRT = switchRT - stayRT;
    const switchCostAcc = stayAccuracy - switchAccuracy;

    return {
      totalTrials: results.length,
      switchTrials: switchTrials.length,
      stayTrials: stayTrials.length,
      switchAccuracy: Math.round(switchAccuracy),
      stayAccuracy: Math.round(stayAccuracy),
      switchRT: Math.round(switchRT),
      stayRT: Math.round(stayRT),
      switchCostRT: Math.round(switchCostRT),
      switchCostAcc: Math.round(switchCostAcc),
      overallAccuracy: Math.round((results.filter(r => r.correct).length / results.length) * 100)
    };
  }

  // WELCOME SCREEN
  if (phase === "welcome") return (
    <div className={S.page}>
      <div className={S.card}>
        <div className="flex justify-center mb-6">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path d="M20 40 L35 25 L35 55 Z" fill="#39ff6a" opacity="0.8"/>
            <path d="M60 40 L45 25 L45 55 Z" fill="#39ff6a" opacity="0.8"/>
            <circle cx="40" cy="40" r="15" stroke="#39ff6a" strokeWidth="2" fill="none"/>
          </svg>
        </div>
        <h1 className="text-4xl font-black text-white mb-4 leading-tight tracking-tight text-center">Category Switch</h1>
        <p className="text-zinc-300 text-lg mb-2 leading-relaxed text-center">
          Test your cognitive flexibility
        </p>
        <p className={S.sub + " mb-8 text-center"}>
          ~3 minutes
        </p>
        <button onClick={() => setPhase("what")} className={S.btnPrimary}>Next</button>
      </div>
    </div>
  );

  // WHAT IT MEASURES
  if (phase === "what") return (
    <div className={S.page}>
      <div className={S.card}>
        <p className={S.label + " mb-3"}>What this measures</p>
        <h2 className="text-2xl font-bold text-white mb-4 leading-tight">Cognitive flexibility, executive function, and processing speed</h2>
        <p className={S.sub + " mb-6"}>
          This test measures how well you adapt when priorities shift unexpectedly. This skill impacts your daily life in important ways.
        </p>

        <div className="space-y-3 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-[#39ff6a] font-semibold text-sm mb-1">Managing Interruptions</p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Switching between tasks at work, juggling multiple conversations, or adjusting plans when something unexpected happens.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-[#39ff6a] font-semibold text-sm mb-1">Learning & Problem-Solving</p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Trying new approaches when the first one doesn't work, adapting strategies in real-time, and learning from mistakes quickly.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-[#39ff6a] font-semibold text-sm mb-1">Mental Health</p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Better cognitive flexibility is linked to lower anxiety and depression, and greater resilience when facing life changes.
            </p>
          </div>
        </div>

        <button onClick={() => setPhase("how")} className={S.btnPrimary}>Next</button>
      </div>
    </div>
  );

  // HOW IT WORKS
  if (phase === "how") return (
    <div className={S.page}>
      <div className={S.card}>
        <p className={S.label + " mb-3"}>How it works</p>
        <h2 className="text-2xl font-bold text-white mb-6 leading-tight">Answer based on the rule</h2>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5">
          <p className="text-zinc-300 text-sm mb-4">
            This test measures cognitive flexibility, executive function, and processing speed.
          </p>
          <p className="text-zinc-300 text-sm mb-4">
            You will see a <span className="text-white font-semibold">word</span> and a <span className="text-[#39ff6a] font-semibold">rule</span>. Your task is to click YES or NO based on whether the word matches the rule.
          </p>
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-[#39ff6a] text-sm font-semibold mb-1">Is it living?</p>
              <p className="text-white text-3xl font-bold mb-1">CAT</p>
              <p className="text-zinc-500 text-xs">Answer: YES</p>
            </div>
            <div className="border-t border-zinc-700 pt-3 text-center">
              <p className="text-[#39ff6a] text-sm font-semibold mb-1">More than 5 letters?</p>
              <p className="text-white text-3xl font-bold mb-1">DESK</p>
              <p className="text-zinc-500 text-xs">Answer: NO</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-yellow-400 font-semibold text-sm mb-2 text-center">⚡ The rule changes during the test</p>
          <p className="text-zinc-400 text-sm text-center">
            Answer as quickly and accurately as possible. The rule will switch multiple times throughout the test, so you need to adapt when it changes.
          </p>
        </div>

        <button onClick={() => setPhase("practice-intro")} className={S.btnPrimary}>Next</button>
      </div>
    </div>
  );

  // PRACTICE INTRO
  if (phase === "practice-intro") return (
    <div className={S.page}>
      <div className={S.card}>
        <p className={S.label + " mb-3"}>Before we begin</p>
        <h2 className="text-2xl font-bold text-white mb-4 leading-tight">Try 3 practice rounds</h2>
        <p className={S.sub + " mb-8"}>
          Get familiar with the format. The rule will change once during practice.
        </p>
        <button onClick={startPractice} className={S.btnPrimary}>Start Practice</button>
      </div>
    </div>
  );

  // PRACTICE COMPLETE
  if (phase === "practice-complete") return (
    <div className={S.page}>
      <div className={S.card}>
        <p className={S.label + " mb-3"}>Practice complete</p>
        <h2 className="text-2xl font-bold text-white mb-4 leading-tight">Ready for the real test?</h2>
        <p className={S.sub + " mb-8"}>
          The test has 30 trials. Remember: speed and accuracy both matter.
        </p>
        <button onClick={startTest} className={S.btnPrimary}>Start Test</button>
      </div>
    </div>
  );

  // TESTING SCREEN
  if (phase === "testing") {
    const currentRule = RULES[ruleSequence[trialIdx]];
    const currentWord = wordSequence[trialIdx];
    const progress = ((trialIdx + 1) / ruleSequence.length) * 100;
    const isSwitch = trialIdx > 0 && ruleSequence[trialIdx] !== ruleSequence[trialIdx - 1];

    return (
      <div className={S.page}>
        <div className={S.card}>
          {/* Progress */}
          <div className="mb-6">
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-1 rounded-full bg-[#39ff6a] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Rule with switch indicator */}
          <div className="text-center mb-6">
            {isSwitch && <p className="text-yellow-400 text-sm font-semibold mb-2">RULE CHANGE!</p>}
            <p className={S.label + " mb-2"}>Current Rule</p>
            <p className={`text-2xl font-bold ${S.green}`}>{currentRule.question}</p>
          </div>

          {/* Word */}
          <div className="text-center mb-8">
            <div className="text-6xl font-black text-white tracking-wide mb-2">{currentWord}</div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="text-center mb-4">
              {feedback === "correct" ? (
                <p className={`font-bold text-lg ${S.green}`}>✓ Correct!</p>
              ) : (
                <p className="font-bold text-lg text-red-400">✗ Incorrect</p>
              )}
            </div>
          )}

          {/* Response buttons */}
          {!feedback && (
            <div className="flex gap-3">
              <button onClick={() => handleResponse("Yes")} className={S.btn}>
                YES
              </button>
              <button onClick={() => handleResponse("No")} className={S.btn}>
                NO
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  if (phase === "results") {
    const stats = calculateResults();

    return (
      <div className={S.page + " items-start overflow-y-auto"}>
        <div className={S.cardWide + " my-6"}>
          <p className={S.label + " mb-1"}>Your Results</p>
          <h2 className="text-2xl font-bold text-white mb-6">Category Switch Performance</h2>

          {/* Overall accuracy */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center mb-6">
            <div className={`text-7xl font-black ${S.green}`}>{stats.overallAccuracy}%</div>
            <p className="text-zinc-500 text-sm mt-2">Overall Accuracy</p>
          </div>

          {/* Switch cost */}
          <div className="mb-6">
            <p className={S.label + " mb-3"}>Switch Cost Analysis</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-500 text-xs mb-1">Switch trials</p>
                <p className={`text-3xl font-black ${S.green}`}>{stats.switchRT}ms</p>
                <p className="text-zinc-600 text-xs mt-1">{stats.switchAccuracy}% accurate</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-500 text-xs mb-1">Stay trials</p>
                <p className={`text-3xl font-black ${S.green}`}>{stats.stayRT}ms</p>
                <p className="text-zinc-600 text-xs mt-1">{stats.stayAccuracy}% accurate</p>
              </div>
            </div>
            <div className="mt-3 bg-zinc-900 border border-yellow-900 rounded-xl p-4">
              <p className="text-yellow-400 font-bold text-sm mb-1">
                Switch Cost: +{stats.switchCostRT}ms
              </p>
              <p className="text-zinc-400 text-xs">
                You were {stats.switchCostRT}ms slower when the rule changed. This measures cognitive flexibility.
              </p>
            </div>
          </div>

          {/* What it means */}
          <div className="mb-6">
            <p className={S.label + " mb-2"}>What this measures</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-300 text-sm leading-relaxed">
                <span className="font-semibold text-white">Cognitive flexibility</span> — the ability to quickly adapt when rules change. Lower switch costs indicate stronger executive function and working memory capacity.
              </p>
            </div>
          </div>

          {/* Trial breakdown */}
          <div className="mb-6">
            <p className={S.label + " mb-2"}>Trial Breakdown</p>
            <div className="text-zinc-400 text-xs space-y-1">
              <p>Total trials: {stats.totalTrials}</p>
              <p>Switch trials: {stats.switchTrials}</p>
              <p>Stay trials: {stats.stayTrials}</p>
            </div>
          </div>

          <button onClick={() => { setPhase("welcome"); setResults([]); }} className={S.btnPrimary}>
            Start New Test
          </button>
        </div>
      </div>
    );
  }

  return null;
}
