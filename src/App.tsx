import React, { useState, useRef, useEffect, useCallback } from "react";
import type { Chat } from "./types";
import ChatForm from "./Components/ChatForm";
import { companyInfo } from "./companyinfo";
import Avatar from "./assets/Avatar.png";

const App: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<Chat[]>([
    { hideInChat: true, role: "model", text: companyInfo },
  ]);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botError, setBotError] = useState<string | null>(null);

  const GOOGLE_TTS_KEY = import.meta.env.VITE_GOOGLE_TTS_KEY as string;

  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // -------------------------
  // GOOGLE TTS FUNCTION
  // -------------------------
  const speakText = useCallback(
    async (text: string, isUrdu: boolean) => {
      try {
        setIsBotSpeaking(true);

        const languageCode = isUrdu ? "ur-IN" : "en-US";
        const voiceName = isUrdu ? "ur-IN-Wavenet-A" : "en-US-Wavenet-F";

        const response = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              input: { text },
              voice: { languageCode, name: voiceName },
              audioConfig: { audioEncoding: "mp3" },
            }),
          }
        );

        const data = await response.json();

        if (!data.audioContent) {
          console.error("TTS Error:", data);
          setBotError("Google TTS failed");
          setIsBotSpeaking(false);
          return;
        }

        const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
        audioRef.current = audio;

        audio.onended = () => setIsBotSpeaking(false);
        audio.play();
      } catch (err) {
        console.error("Google TTS Error:", err);
        setBotError("Failed generating speech");
        setIsBotSpeaking(false);
      }
    },
    [GOOGLE_TTS_KEY]
  );

  // -------------------------
  // GEMINI BOT RESPONSE
  // -------------------------
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
        abortControllerRef.current = new AbortController();
        const response = await fetch(
          import.meta.env.VITE_GEMINI_API_URL as string,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: finalHistory }),
            signal: abortControllerRef.current.signal,
          }
        );

        const data = await response.json();

        let rawResponseText: string =
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
          "No response";

        rawResponseText = rawResponseText
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .trim();

        // Urdu detection
        const isUrdu = /[اآبپتٹثجچحخدڈذرڑزسشصضطظعغفقکگلمنوہے]/.test(
          rawResponseText
        );

        setChatHistory((prev) => [
          ...prev.filter((msg) => msg.text !== "Typing..."),
          { role: "model", text: rawResponseText },
        ]);

        setIsBotThinking(false);

        // Speak using Google TTS
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

  // Stop all operations
  const handleStop = useCallback(() => {
    // Stop speech recognition in ChatForm (handled through state reset)
    setIsBotThinking(false);
    setIsBotSpeaking(false);

    // Abort fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Remove typing indicator
    setChatHistory((prev) => prev.filter((msg) => msg.text !== "Typing..."));
  }, []);

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
              onStop={handleStop}
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
