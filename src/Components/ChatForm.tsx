import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Chat } from "../types";

interface ChatFormProps {
  chatHistory: Chat[];
  setChatHistory: React.Dispatch<React.SetStateAction<Chat[]>>;
  generateBotResponse: (history: Chat[]) => void;
  isBotSpeaking: boolean;
  isBotThinking: boolean;
  botError: string | null;
  onStop: () => void;
}

const ChatForm: React.FC<ChatFormProps> = ({
  chatHistory,
  setChatHistory,
  generateBotResponse,
  isBotSpeaking,
  isBotThinking,
  botError,
  onStop,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const initSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support voice input!");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = ""; // Auto detect language
    recognition.interimResults = true; // Show live transcript
    recognition.maxAlternatives = 1;
    return recognition;
  };

  const handleFormSubmit = (e: FormEvent, userMessageOverride?: string) => {
    e.preventDefault();
    const userMessage = userMessageOverride ?? inputRef.current?.value.trim();
    if (!userMessage) return;

    if (inputRef.current) inputRef.current.value = "";

    // Add user message to chat immediately
    setChatHistory((prev) => [...prev, { role: "user", text: userMessage }]);
    // Add typing indicator
    setChatHistory((prev) => [...prev, { role: "model", text: "Typing..." }]);

    generateBotResponse([...chatHistory, { role: "user", text: userMessage }]);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initSpeech();
      if (!recognitionRef.current) return;
    }

    const rec = recognitionRef.current;

    if (isListening) {
      rec.stop();
      return;
    }

    setIsListening(true);
    rec.start();

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;

      if (inputRef.current) inputRef.current.value = transcript;

      // Show live transcript in chat while user is speaking
      const lastUserIndex = chatHistory.findIndex(
        (msg) => msg.role === "user" && msg.text === transcript
      );
      if (lastUserIndex === -1) {
        setChatHistory((prev) => [...prev, { role: "user", text: transcript }]);
      } else {
        setChatHistory((prev) => {
          const newChat = [...prev];
          newChat[lastUserIndex].text = transcript;
          return newChat;
        });
      }
    };

    rec.onerror = () => setIsListening(false);

    rec.onend = () => {
      setIsListening(false);
      const userMessage = inputRef.current?.value.trim() || "";
      if (userMessage) {
        handleFormSubmit(
          { preventDefault: () => {} } as FormEvent,
          userMessage
        );
      }
    };
  };

  const getButtonText = () => {
    if (isListening) return "Listening...";
    if (isBotThinking) return "Thinking...";
    if (isBotSpeaking) return "Speaking...";
    if (botError) return "Error! Click to retry";
    return "Pouchoo";
  };

  const handleStop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    // Call the parent's stop handler to stop bot thinking/speaking and abort requests
    onStop();
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="w-full flex flex-col items-center gap-3">
        <div className="flex gap-2 w-full lg:w-[75%]">
          <button
            type="button"
            onClick={startListening}
            disabled={isListening || isBotSpeaking || isBotThinking}
            title={getButtonText()}
            className="flex-1 bg-[#6C0444] min-h-[65px] h-auto py-3 px-6 cursor-pointer rounded-full font-medium text-white text-[24px] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {getButtonText()}
          </button>
          <button
            type="button"
            onClick={handleStop}
            disabled={!isListening && !isBotThinking && !isBotSpeaking}
            className="w-[65px] min-h-[65px] h-auto bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer rounded-full font-medium text-white text-[24px] flex items-center justify-center shrink-0"
            title="Stop"
          >
            ⏹
          </button>
        </div>
        <textarea
          ref={inputRef}
          placeholder="Ask me anything."
          rows={1}
          className="flex-1 hidden"
        />
        {botError && <p className="text-red-600">{botError}</p>}
      </div>
    </form>
  );
};

export default ChatForm;
