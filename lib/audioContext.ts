let audioContext: AudioContext | null = null;


export async function getAudioContext(): Promise<AudioContext> {

  if (typeof window === "undefined") {
    throw new Error("audio context is only available in browser");
  }

  try {
    if (!audioContext) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContext();
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    return audioContext;
  } catch (error) {
    console.log("error initalizing audiocontext");

    throw error;
  }


}



export function closeAudioContext() {
  if (audioContext) {
    audioContext.close().catch(console.log);
    audioContext = null;
  }
}


export function isAudioContextAvailable(): boolean {
  return !!(audioContext && audioContext.state === "running")
}