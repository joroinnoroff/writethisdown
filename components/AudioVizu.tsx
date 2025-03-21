"use client"

import { getAudioContext } from "@/lib/audioContext"
import { userHasBrowser } from "@/lib/userHasbrowser"
import { useEffect, useRef, useState } from "react"

interface AudioVizProps {
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isLive: boolean;

}


const AudioViz = ({
  audioUrl,
  mediaStream,
  isLive
}: AudioVizProps) => {
  const hasBrowser = userHasBrowser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>(0);
  const analyseRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);




  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasBrowser) return;

    const initializeAudioContext = async () => {
      const audioContext = await getAudioContext();
      const canvas = canvasRef.current
        ;

      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      if (!ctx) return;


      const cleanup = () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;

        }

        if (analyseRef.current) {
          analyseRef.current.disconnect();
          analyseRef.current = null;

        }

      };

      //live streaming
      if (isLive && mediaStream) {
        cleanup();

        try {
          const source = audioContext.createMediaStreamSource(mediaStream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          sourceRef.current = source;

          analyseRef.current = analyser;

          draw(analyser, ctx, canvas.width, canvas.height);
        } catch (error) {
          console.log("error")
        }
      }


      else if (audioUrl && !isLive) {
        const audio = audioRef.current;

        if (!audio) return;

        audio.crossOrigin = "anono";

        // only create new audio source if the url has changed
        if (audioUrl !== audioUrlRef.current) {
          cleanup();
          audioUrlRef.current = audioUrl;

          try {
            const source = audioContext.createMediaElementSource(audio);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            analyser.connect(audioContext.destination);
            sourceRef.current = source;
            analyseRef.current = analyser;

          } catch (error) {
            console.log("error initi aduio file", error);
            cleanup();
            return;
          }

        }


        const handlePlay = () => {
          if (analyseRef.current && ctx) {
            draw(analyseRef.current, ctx, canvas.width, canvas.height);
          }
        };



        const handleEnded = () => {
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
        };

        audio.addEventListener("play", handlePlay);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("pause", handleEnded);

        return () => {
          audio.removeEventListener("play", handlePlay);
          audio.removeEventListener("ended", handleEnded);
          audio.removeEventListener("pause", handleEnded);

        };
      }

      return cleanup;
    };

    initializeAudioContext();
  }, [audioUrl, mediaStream, isLive, hasBrowser]);


  const draw = (
    analyser: AnalyserNode,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const bufferLenght = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLenght);

    const drawVisualizer = () => {
      animationRef.current = requestAnimationFrame(drawVisualizer);

      analyser.getByteFrequencyData(dataArray);


      ctx.fillStyle = "rgb(17, 24, 39" // dark bg
      ctx.fillRect(0, 0, width, height);


      const barWidth = (width / bufferLenght) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLenght; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        //gradient effect
        const gradient = ctx.createLinearGradient(
          0,
          height,
          0,
          height - barHeight

        );
        gradient.addColorStop(0, "rgb(129, 140, 248");
        gradient.addColorStop(1, "rgb(199, 210, 254)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

    };


    drawVisualizer();
  };

  //cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (analyseRef.current) {
        analyseRef.current.disconnect();
      }

    };
  }, []);

  return (
    <div className="w-full space-y-4">
      <canvas ref={canvasRef} className="w-full h-40 rounded-lg bg-gray-900"
        width={500}
        height={160}
      />
      {audioUrl && !isLive && (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 "
        />
      )}


    </div>
  )


};

export default AudioViz;