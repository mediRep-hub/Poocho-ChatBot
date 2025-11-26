import React, { useState, useRef, useEffect, useCallback } from "react";
import type { Chat } from "./types";
import ChatForm from "./Components/ChatForm";
import { companyInfo } from "./companyinfo";
import Avatar from "./assets/Avatar.png";

// ElevenLabs Voice IDs
const URDU_VOICE_ID = "Ui0HFqLn4HkcAenlJJVJ"; // Urdu voice
const EN_VOICE_ID = "Ui0HFqLn4HkcAenlJJVJ"; // English voice
const ELEVENLABS_API_KEY =
  "52c3c7fb4eb318cacbb669810bc2cf3068eafa79d32d2422816b1eb12dfdd4fd";

const App: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<Chat[]>([
    { hideInChat: true, role: "model", text: companyInfo },
  ]);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botError, setBotError] = useState<string | null>(null);

  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  const speakText = useCallback(async (text: string, isUrdu: boolean) => {
    try {
      setIsBotSpeaking(true);

      const voiceId = isUrdu ? URDU_VOICE_ID : EN_VOICE_ID;
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: text,
            voice_settings: { stability: 0.7, similarity_boost: 0.75 },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`TTS failed: ${errText}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      audio.onended = () => setIsBotSpeaking(false); // stop speaking
      audio.onerror = () => setIsBotSpeaking(false);

      audio.play();
    } catch (err: any) {
      console.error("TTS Error:", err);
      setBotError(err.message);
      setIsBotSpeaking(false);
    }
  }, []);

  const generateBotResponse = useCallback(
    async (history: Chat[]) => {
      setIsBotThinking(true);
      setBotError(null);

      const userLastMessage = history[history.length - 1]?.text || "";

      const formattedHistory = history.map(({ role, text }) => ({
        role,
        parts: [{ text }],
      }));

      const systemInstruction = {
        role: "user",
        parts: [
          {
            text: `User message: "${userLastMessage}".
Detect language automatically. Reply in **Urdu** if Urdu letters found, otherwise in English.
Keep tone polite, friendly, and relevant to Poocho services.`,
          },
        ],
      };

      const finalHistory = [...formattedHistory, systemInstruction];

      try {
        const response = await fetch(import.meta.env.VITE_API_URL as string, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: finalHistory }),
        });

        const data = await response.json();

        let rawResponseText: string =
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
          "No response";

        rawResponseText = rawResponseText
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .trim();

        const isUrdu = /[اآبپتٹثجچحخدڈذرڑزسشصضطظعغفقکگلمنوہے]/.test(
          rawResponseText
        );

        setChatHistory((prev) => [
          ...prev.filter((msg) => msg.text !== "Typing..."),
          { role: "model", text: rawResponseText },
        ]);

        setIsBotThinking(false);
        speakText(rawResponseText, isUrdu);
      } catch (err: any) {
        setBotError(err.message);
        setIsBotThinking(false);
        setChatHistory((prev) => [
          ...prev.filter((msg) => msg.text !== "Typing..."),
          { role: "model", text: err.message, isError: true },
        ]);
      }
    },
    [speakText]
  );

  // Auto-scroll
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory]);

  return (
    <div className="flex justify-center p-4 w-full h-screen items-center">
      <div className="bg-[#FFE7EF] flex flex-wrap gap-[50px] rounded-4xl lg:h-[60%] lg:w-[60%] p-6">
        <div className="lg:w-[calc(50%-25px)] w-full flex flex-col justify-between h-full">
          <div>
            <p className="lg:text-[48px] text-[32px] font-medium text-[#0B090A]">
              Ask Saira
            </p>
            <p className="text-[24px] font-medium mt-3 text-[#7D7D7D]">
              Our AI Bot
            </p>
          </div>

          <div className="w-full mt-5 lg:mt-0">
            <ChatForm
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              generateBotResponse={generateBotResponse}
              isBotSpeaking={isBotSpeaking}
              isBotThinking={isBotThinking}
              botError={botError}
            />
          </div>
        </div>

        <div className="lg:w-[calc(50%-25px)] w-full flex justify-center items-center">
          <img src={Avatar} alt="Chatbot Avatar" className="h-auto" />
        </div>
      </div>
    </div>
  );
};

export default App;

// import React, { useState, useRef, useEffect, useCallback } from "react";
// import type { Chat } from "./types";
// import ChatForm from "./Components/ChatForm";
// import { companyInfo } from "./companyinfo";
// import Avatar from "./assets/Avatar.png";

// // ElevenLabs Voice IDs
// const URDU_VOICE_ID = "Ui0HFqLn4HkcAenlJJVJ"; // Urdu voice
// const EN_VOICE_ID = "Ui0HFqLn4HkcAenlJJVJ"; // English voice
// const ELEVENLABS_API_KEY =
//   "sk_d08edf2e9daab7b69d64259a20003f73d8885292779696f8";

// const App: React.FC = () => {
//   const [chatHistory, setChatHistory] = useState<Chat[]>([
//     { hideInChat: true, role: "model", text: companyInfo },
//   ]);
//   const [isBotSpeaking, setIsBotSpeaking] = useState(false);
//   const [isBotThinking, setIsBotThinking] = useState(false);
//   const [botError, setBotError] = useState<string | null>(null);

//   const chatBodyRef = useRef<HTMLDivElement | null>(null);

//   const speakText = useCallback(async (text: string, isUrdu: boolean) => {
//     try {
//       setIsBotSpeaking(true);

//       const voiceId = isUrdu ? URDU_VOICE_ID : EN_VOICE_ID;
//       const response = await fetch(
//         `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "xi-api-key": ELEVENLABS_API_KEY,
//           },
//           body: JSON.stringify({
//             text: text,
//             voice_settings: { stability: 0.7, similarity_boost: 0.75 },
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errText = await response.text();
//         throw new Error(`TTS failed: ${errText}`);
//       }

//       const blob = await response.blob();
//       const audioUrl = URL.createObjectURL(blob);
//       const audio = new Audio(audioUrl);

//       audio.onended = () => setIsBotSpeaking(false); // stop speaking
//       audio.onerror = () => setIsBotSpeaking(false);

//       audio.play();
//     } catch (err: any) {
//       console.error("TTS Error:", err);
//       setBotError(err.message);
//       setIsBotSpeaking(false);
//     }
//   }, []);

//   const generateBotResponse = useCallback(
//     async (history: Chat[]) => {
//       setIsBotThinking(true);
//       setBotError(null);

//       const formattedHistory = history.map(({ role, text }) => ({
//         role,
//         parts: [{ text }],
//       }));

//       const systemInstruction = {
//         role: "user",
//         parts: [
//           {
//             text: `You are a multilingual AI assistant.
// Detect the last user message language automatically.
// Reply in EXACTLY the same language, script and tone.
// If user writes in Urdu script, respond in Urdu Nastaliq script.
// If user writes Roman Urdu, reply in Roman Urdu.
// If user writes in English, reply in English.
// Never switch language unless the user commands.
// Tone must be friendly and concise.`,
//           },
//         ],
//       };

//       const finalHistory = [...formattedHistory, systemInstruction];

//       try {
//         const response = await fetch(import.meta.env.VITE_API_URL as string, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ contents: finalHistory }),
//         });

//         const data = await response.json();

//         let rawResponseText: string =
//           data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
//           "No response";

//         rawResponseText = rawResponseText
//           .replace(/\*\*(.*?)\*\*/g, "$1")
//           .trim();

//         const isUrdu = /[اآبپتٹثجچحخدڈذرڑزسشصضطظعغفقکگلمنوہے]/.test(
//           rawResponseText
//         );

//         setChatHistory((prev) => [
//           ...prev.filter((msg) => msg.text !== "Typing..."),
//           { role: "model", text: rawResponseText },
//         ]);

//         setIsBotThinking(false);
//         speakText(rawResponseText, isUrdu);
//       } catch (err: any) {
//         setBotError(err.message);
//         setIsBotThinking(false);
//         setChatHistory((prev) => [
//           ...prev.filter((msg) => msg.text !== "Typing..."),
//           { role: "model", text: err.message, isError: true },
//         ]);
//       }
//     },
//     [speakText]
//   );

//   // Auto-scroll
//   useEffect(() => {
//     if (chatBodyRef.current) {
//       chatBodyRef.current.scrollTo({
//         top: chatBodyRef.current.scrollHeight,
//         behavior: "smooth",
//       });
//     }
//   }, [chatHistory]);

//   return (
//     <div className="flex justify-center p-4 w-full h-screen items-center">
//       <div className="bg-[#FFE7EF] flex flex-wrap gap-[50px] rounded-4xl lg:h-[60%] lg:w-[60%] p-6">
//         {/* LEFT SIDE CONTENT */}
//         <div className="lg:w-[calc(50%-25px)] w-full flex flex-col justify-between h-full">
//           <div>
//             <p className="lg:text-[48px] text-[32px] font-medium text-[#0B090A]">
//               Ask Saira
//             </p>
//             <p className="text-[24px] font-medium mt-3 text-[#7D7D7D]">
//               Our AI Bot
//             </p>
//           </div>

//           <div className="w-full mt-5 lg:mt-0">
//             <ChatForm
//               chatHistory={chatHistory}
//               setChatHistory={setChatHistory}
//               generateBotResponse={generateBotResponse}
//               isBotSpeaking={isBotSpeaking}
//               isBotThinking={isBotThinking}
//               botError={botError}
//             />
//           </div>
//         </div>

//         {/* RIGHT SIDE: Avatar → Chat Box Switch */}
//         <div className="lg:w-[calc(50%-25px)] w-full flex justify-center items-center transition-all duration-700">
//           {chatHistory.length <= 1 ? (
//             <img
//               src={Avatar}
//               alt="Chatbot Avatar"
//               className="h-auto transition-all duration-700"
//             />
//           ) : (
//             <div
//               ref={chatBodyRef}
//               className="w-full h-full bg-white rounded-3xl p-4 overflow-y-auto shadow-md transition-all duration-700"
//             >
//               {chatHistory
//                 .filter(
//                   (msg) =>
//                     msg.role !== "user" ||
//                     msg === chatHistory[chatHistory.length - 1]
//                 )
//                 .filter((msg) => !msg.hideInChat)
//                 .map((msg, idx) => (
//                   <div
//                     key={idx}
//                     className={`p-3 my-2 rounded-xl
//     ${
//       /[اآبپتٹثجچحخدڈذرڑزسشصضطظعغفقکگلمنوہے]/.test(msg.text)
//         ? "urdu-text"
//         : "text-left"
//     }
//     ${
//       msg.role === "user"
//         ? "bg-blue-200"
//         : msg.isError
//         ? "bg-red-200"
//         : "bg-green-200"
//     }`}
//                   >
//                     {msg.text}
//                   </div>
//                 ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default App;
