"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Mic, Upload, Loader2, StopCircle,
  Volume2,
  FileAudio,
  Loader
} from "lucide-react"

import TranscriptionResult from "./TranscriptsRes";
import AudioViz from "./AudioVizu";
import { userHasBrowser } from "@/lib/userHasbrowser";

const ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4"];

const AudioUploader = () => {
  const hasBrowser = userHasBrowser();

  //state mang
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);



  //refs

  const fileInputRef = useRef<HTMLInputElement>(null);

  const recognitionRef = useRef<any>(null);

  //check for speech rec support 
  useEffect(() => {
    if (hasBrowser) {
      const speechSupported =
        "speechRecognition" in window || "webkitSpeechRecognition" in window;
      setIsSpeechSupported(speechSupported);
    }
  }, [hasBrowser]);


  //init speech reco

  useEffect(() => {
    if (!hasBrowser) return;

    const SpeechRecognition =
      (window as any).speechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      const finalRef = { current: "" }; // bruker lokal ref

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalRef.current += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }
        setTranscription(finalRef.current + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.log("speech rec error", event.error);
        setError(`speech reco error ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        // Sikrer at det som ble tatt opp vises etter stopp
        setTranscription(finalRef.current);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [hasBrowser]);

  //file handling funct

  const handleFileChange = (selectedFile: File) => {
    setError("");

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Please upload a MP#, WAV or M4A file");
      return;
    }

    const maxSize = 25 * 1024 * 1024; //25mb
    if (selectedFile.size > maxSize) {
      setError("file size must be less than 25MB");
      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setFile(selectedFile);
    setAudioUrl(URL.createObjectURL(selectedFile));

    if (isRecording) {
      handleStopRecording();
    }

  };


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleStartRecording = async () => {
    if (recognitionRef.current && !isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,

        });

        setMediaStream(stream);
        recognitionRef.current.start();
        setIsRecording(true);
        setTranscription("");
      } catch (error) {
        console.log("error accessing microphone", error);
        setError("micro access denied or not available");
      }
    }
  };


  const handleStopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);

      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
      }
    }
  };


  const handleSubmit = async () => {
    if (!file) return;

    setIsLoading(true);

    setError("");

    setTranscription("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "failed to transcriibe audio")
      }

      setTranscription(data.text);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "failed to transcribe aduio"
      );
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-grandient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-to-r from-indigo-600 to-purple-600 bg-clip-text  mb-4">
            Audio transcription
          </h1>


          <p className="text-lg text-gray-600 dark:text-gray-300">Transform your audio into text with professional accuracy</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          <div className="space-y-6">
            {/**UPLOAD CARD */}
            <div className="relative group">
              <div className={`p-8 rounded-2xl backdrop-blur-xl transition-all duration-300
        ${isRecording ? "bg-red-50/90 dark:bg-red-900/20 border-2 border-red-500 shadow-lg shadow-red-500/20" : " bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 border-gray-200 dark:border-gray-200"}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}>
                <div className="flex flex-col items-center space-y-6">
                  <div className={`
              p-4 rounded-full transition-transform duration-300 group-hover:scale-110 
              ${isRecording ?
                      "bg-red-100 dark:bg-red-900/50"
                      : "bg-indigo-100 dark:bg-indigo-900/50"
                    }`}>
                    {isRecording ? (
                      <FileAudio className="w-8 h-8 text-red-600 dark:text-red-400 " />
                    ) : (
                      <FileAudio className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>


                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-gray-800 dark:bg-gray-200">
                      {isRecording ?
                        "Recording in progress..."
                        : "Drop your audio file here"}
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isRecording ?
                        "Your audio is being captured..."
                        : "Or click to select a file "}
                    </p>

                    <p className="text-xs text-gray-400 dark:text-gray-500">Supports MP#, WAV, Mp4 (max 25MB)</p>
                  </div>


                  <input ref={fileInputRef}
                    type="file"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFileChange(e.target.files[0])
                    }
                    accept={ALLOWED_TYPES.join(", ")}
                    className="hidden"
                  />

                  {!isRecording && (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 text-sm font-mediu text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600">
                      Choose file
                    </button>
                  )}
                </div>
              </div>
            </div>



            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4 ">
                <Volume2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Audio visualization
                </h3>
              </div>

              <AudioViz audioUrl={audioUrl}
                mediaStream={mediaStream}
                isLive={isRecording} />

            </div>


            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleSubmit}
                disabled={!file || isLoading}
                className={`
              py-4 px-6 rounded-xl font-medium flex itemscenter justify-center gap-2 transition-all ${!file || isLoading
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                  } `}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) :
                  <>
                    <Upload className="h-5 w-5" />
                    Transcribe
                  </>

                }
              </button>

              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={!isSpeechSupported}
                className={`py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${isRecording ?
                  "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600"
                  }`}
              >
                {isRecording ? (
                  <>
                    <StopCircle className="w-5 h-5" />
                    Stop
                  </>
                ) :
                  <>
                    <Mic className="w-5 h-5" />
                    Record
                  </>
                }
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-200 rounded-xl flex items-center gap-2 ">
                <div className="w-2 h-2 rounded-full bg-red-600 dark-red-400 animate-pulse" />
                {error}

              </div>
            )}
          </div>



          <div className="relative">
            {transcription ? (
              <TranscriptionResult text={transcription} />
            ) : (
              <div className="h-full min-h-[400px] bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-200 flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  Your transcription will appear here
                </p>
              </div>
            )}
          </div>

        </div>

      </div>


    </div>
  )

}

export default AudioUploader;