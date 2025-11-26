// import { useRef, useState } from "react";
// import type { FormEvent } from "react";
// import type { Chat } from "../types";

// interface ChatFormProps {
//   chatHistory: Chat[];
//   setChatHistory: React.Dispatch<React.SetStateAction<Chat[]>>;
//   generateBotResponse: (history: Chat[]) => void;
//   isBotSpeaking: boolean; // Bot speaking state
//   isBotThinking: boolean; // Bot thinking state
//   botError: string | null; // Error message if any
// }

// const ChatForm: React.FC<ChatFormProps> = ({
//   chatHistory,
//   setChatHistory,
//   generateBotResponse,
//   isBotSpeaking,
//   isBotThinking,
//   botError,
// }) => {
//   const inputRef = useRef<HTMLTextAreaElement>(null); // Voice recognition
//   const [isListening, setIsListening] = useState(false);
//   const recognitionRef = useRef<any>(null);

//   const initSpeech = () => {
//     const SpeechRecognition =
//       (window as any).SpeechRecognition ||
//       (window as any).webkitSpeechRecognition;

//     if (!SpeechRecognition) {
//       alert("Your browser does not support voice input!");
//       return null;
//     }

//     const recognition = new SpeechRecognition();
//     recognition.lang = ""; // auto language detection
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;
//     return recognition;
//   };

//   const handleFormSubmit = (e: FormEvent) => {
//     e.preventDefault();
//     const userMessage = inputRef.current?.value.trim();
//     if (!userMessage) return;
//     if (inputRef.current) inputRef.current.value = "";

//     setChatHistory((prev) => [...prev, { role: "user", text: userMessage }]);
//     setChatHistory((prev) => [...prev, { role: "model", text: "Typing..." }]);

//     generateBotResponse([...chatHistory, { role: "user", text: userMessage }]);
//   };

//   const startListening = () => {
//     if (!recognitionRef.current) {
//       recognitionRef.current = initSpeech();
//       if (!recognitionRef.current) return;
//     }

//     const rec = recognitionRef.current;

//     if (isListening) {
//       rec.stop();
//       return;
//     }

//     setIsListening(true);
//     rec.start();

//     rec.onresult = (e: any) => {
//       const transcript = e.results[0][0].transcript;
//       if (inputRef.current) inputRef.current.value = transcript;
//     };

//     rec.onerror = () => setIsListening(false);
//     rec.onend = () => {
//       setIsListening(false);
//       const userMessage = inputRef.current?.value.trim() || "";
//       if (userMessage) {
//         handleFormSubmit({ preventDefault: () => {} } as FormEvent);
//       }
//     };
//   };

//   const getButtonText = () => {
//     if (isListening) return "Listening...";
//     if (botError) return "Error!";
//     if (isBotSpeaking) return "Speaking...";
//     if (isBotThinking) return "Thinking...";
//     return "Pouchoo";
//   };

//   return (
//     <form onSubmit={handleFormSubmit}>
//       <div className="w-full">
//         <button
//           type="button"
//           onClick={startListening}
//           className="bg-[#6C0444] h-[65px] lg:w-[60%] w-full cursor-pointer rounded-full font-medium mt-auto text-white text-[20px]"
//           title={getButtonText()}
//         >
//           {getButtonText()}
//         </button>

//         <textarea
//           ref={inputRef}
//           placeholder="Ask me anything."
//           required
//           rows={1}
//           data-gramm="false"
//           data-gramm_editor="false"
//           data-enable-grammarly="false"
//           autoComplete="off"
//           spellCheck={true}
//           className="flex-1 hidden bg-transparent text-gray-500 text-base outline-none resize-none leading-5 placeholder-gray-400"
//           onKeyDown={(e) => {
//             if (e.key === "Enter" && !e.shiftKey) {
//               e.preventDefault();
//               handleFormSubmit(e as any);
//             }
//           }}
//         />
//       </div>
//     </form>
//   );
// };

// export default ChatForm;
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
}

const ChatForm: React.FC<ChatFormProps> = ({
  chatHistory,
  setChatHistory,
  generateBotResponse,
  isBotSpeaking,
  isBotThinking,
  botError,
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
        handleFormSubmit({ preventDefault: () => {} } as FormEvent, userMessage);
      }
    };
  };

  // Button text based on state
  const getButtonText = () => {
    if (isListening) return "Listening...";
    if (isBotThinking) return "Thinking...";
    if (isBotSpeaking) return "Speaking...";
    if (botError) return "Error! Click to retry";
    return "Pouchoo";
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="w-full flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={startListening}
          className="bg-[#6C0444] h-[65px] lg:w-[60%] w-full cursor-pointer rounded-full font-medium text-white text-[24px]"
        >
          {getButtonText()}
        </button>
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
