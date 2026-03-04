export async function decodeAudioToBuffer(fileOrBlob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await fileOrBlob.arrayBuffer();

  const AudioContextCtor =
    window.AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new AudioContextCtor();

  // decodeAudioData signature differs across browsers; wrap for safety.
  const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
    const p = ctx.decodeAudioData(
      arrayBuffer.slice(0),
      (buf) => resolve(buf),
      (err) => reject(err)
    );
    // Some browsers return a Promise:
    if (p && typeof (p as any).then === "function") {
      (p as Promise<AudioBuffer>).then(resolve).catch(reject);
    }
  });

  return audioBuffer;
}
