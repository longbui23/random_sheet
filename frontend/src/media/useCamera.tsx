import { useEffect } from "react";

export function useCamera(videoRef: React.RefObject<HTMLVideoElement>) {
  useEffect(() => {
    let stream: MediaStream;

    navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
      stream = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    });

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);
}
