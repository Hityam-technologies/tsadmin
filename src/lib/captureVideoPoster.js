/**
 * Grab a still frame from a local video File for use as the hero poster.
 * Runs entirely in the browser (canvas) — no ImageKit video-thumbnail API needed.
 */
export async function captureVideoPoster(file, atSeconds = 0.35) {
  if (!file || !String(file.type || '').startsWith('video/')) {
    throw new Error('Choose a video file first.');
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const frame = await new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = objectUrl;

      const fail = () => reject(new Error('Could not read that video for a poster frame.'));

      video.addEventListener('error', fail, { once: true });
      video.addEventListener(
        'loadeddata',
        () => {
          const duration = Number.isFinite(video.duration) ? video.duration : 1;
          video.currentTime = Math.min(Math.max(atSeconds, 0.05), Math.max(duration * 0.08, 0.05));
        },
        { once: true },
      );
      video.addEventListener(
        'seeked',
        () => {
          try {
            const width = video.videoWidth || 1280;
            const height = video.videoHeight || 720;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              fail();
              return;
            }
            ctx.drawImage(video, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  fail();
                  return;
                }
                resolve(
                  new File([blob], `hero-poster-${Date.now()}.jpg`, {
                    type: 'image/jpeg',
                  }),
                );
              },
              'image/jpeg',
              0.88,
            );
          } catch {
            fail();
          }
        },
        { once: true },
      );
    });

    return frame;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
