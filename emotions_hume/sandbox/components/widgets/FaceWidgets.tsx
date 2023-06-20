import { Emotion, EmotionName } from "../../lib/data/emotion";
import { None, Optional } from "../../lib/utilities/typeUtilities";
import React, { useContext, useEffect, useRef, useState } from "react";

import { AuthContext } from "../menu/Auth";
import { Descriptor } from "./Descriptor";
import { FacePrediction } from "../../lib/data/facePrediction";
import { FaceTrackedVideo } from "./FaceTrackedVideo";
import { LoaderSet } from "./LoaderSet";
import { TopEmotions } from "./TopEmotions";
import { TrackedFace } from "../../lib/data/trackedFace";
import { VideoRecorder } from "../../lib/media/videoRecorder";
import { blobToBase64 } from "../../lib/utilities/blobUtilities";
import { getApiUrlWs } from "../../lib/utilities/environmentUtilities";
import axios from "axios";

type FaceWidgetsProps = {
  onCalibrate: Optional<(emotions: Emotion[]) => void>;
};

import { ReactSimplifiedPlayer } from "react-simplified-player"
import SpotifyPlayer from "react-spotify-web-playback";

export function FaceWidgets({ onCalibrate }: FaceWidgetsProps) {
  const authContext = useContext(AuthContext);
  const socketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<VideoRecorder | null>(null);
  const photoRef = useRef<HTMLCanvasElement | null>(null);
  const mountRef = useRef(true);
  const recorderCreated = useRef(false);
  const numReconnects = useRef(0);
  const [trackedFaces, setTrackedFaces] = useState<TrackedFace[]>([]);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [status, setStatus] = useState("");
  const numLoaderLevels = 5;
  const maxReconnects = 3;
  const loaderNames: EmotionName[] = [
    "Admiration",
    "Adoration",
    "Aesthetic Appreciation",
    "Amusement",
    "Anger",
    "Anxiety",
    "Awe",
    "Awkwardness",
    "Boredom",
    "Calmness",
    "Concentration",
    "Confusion",
    "Contemplation",
    "Contempt",
    "Contentment",
    "Craving",
    "Desire",
    "Determination",
    "Disappointment",
    "Disgust",
    "Distress",
    "Doubt",
    "Ecstasy",
    "Embarrassment",
    "Empathic Pain",
    "Entrancement",
    "Envy",
    "Excitement",
    "Fear",
    "Guilt",
    "Horror",
    "Interest",
    "Joy",
    "Love",
    "Nostalgia",
    "Pain",
    "Pride",
    "Realization",
    "Relief",
    "Romance",
    "Sadness",
    "Satisfaction",
    "Shame",
    "Surprise (negative)",
    "Surprise (positive)",
    "Sympathy",
    "Tiredness",
    "Triumph"
  ];

  useEffect(() => {
    console.log("Mounting component");
    mountRef.current = true;
    console.log("Connecting to server");
    connect();

    return () => {
      console.log("Tearing down component");
      stopEverything();
    };
  }, []);

  const [albumCovers, setAlbumCovers] = useState([]);
  const [trackInfo, setTrackInfo] = useState([]);
  const [currentSong, setCurrentSong] = useState(0);
  let currentTrackID = currentSong;


  const [userName, setUserName] = useState(null);
  const [userID, setUserID] = useState(null);

  interface Emotion {
    name: string;
    score: number;
  }

  interface EmotionData {
    name: string;
    sum: number;
    count: number;
  }

  const [currentSongEmotions, setCurrentSongEmotions] = useState<Map<string, EmotionData>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      axios.get('http://127.0.0.1:5001/spotify', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          })
          .then(response => {
            console.log(response.data["track_info"])
            setAlbumCovers(response.data["track_info"].map((ti: any) => ti["album_cover"]));
            setUserName(response.data["username"]);
            setUserID(response.data["userID"]);
            setTrackInfo(response.data["track_info"]);
          })
          .catch(error => console.error(error));
    }, 5000); // Fetches every 5 seconds

    // This is run when the component unmounts
    return () => clearInterval(interval);
  }, []); // Empty dependency array means this effect runs once when the component mounts and never again

  function connect() {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("Socket already exists, will not create");
    } else {
      const baseUrl = getApiUrlWs(authContext.environment);
      const endpointUrl = `${baseUrl}/v0/stream/models`;
      const socketUrl = `${endpointUrl}?apikey=${authContext.key}`;
      console.log(`Connecting to websocket... (using ${endpointUrl})`);
      setStatus(`Connecting to server...`);

      const socket = new WebSocket(socketUrl);

      socket.onopen = socketOnOpen;
      socket.onmessage = socketOnMessage;
      socket.onclose = socketOnClose;
      socket.onerror = socketOnError;

      socketRef.current = socket;
    }
  }

  async function socketOnOpen() {
    console.log("Connected to websocket");
    setStatus("Connecting to webcam...");
    if (recorderRef.current) {
      console.log("Video recorder found, will use open socket");
      await capturePhoto();
    } else {
      console.warn("No video recorder exists yet to use with the open socket");
    }
  }

  function updateEmotionData(newEmotions: Emotion[]) {
    // Create a copy of the current state to avoid mutating it directly
    const updatedEmotions = new Map(currentSongEmotions);

    // Update the state with the new data
    newEmotions.forEach(({ name, score }) => {
      const currentEmotionData = updatedEmotions.get(name) || { name, sum: 0, count: 0 };
      updatedEmotions.set(name, {
        ...currentEmotionData,
        sum: currentEmotionData.sum + score,
        count: currentEmotionData.count + 1,
      });
    });

    // console.log(`UPDATED EMOTIONS: ${updatedEmotions}`);

    // Set the updated state
    setCurrentSongEmotions(updatedEmotions);
  }


  async function socketOnMessage(event: MessageEvent) {
    setStatus("");
    const response = JSON.parse(event.data);
    console.log("Got response", response);
    const predictions: FacePrediction[] = response.face?.predictions || [];
    const warning = response.face?.warning || "";
    const error = response.error;
    if (error) {
      setStatus(error);
      console.error(error);
      stopEverything();
      return;
    }

    if (predictions.length === 0) {
      setStatus(warning.replace(".", ""));
      setEmotions([]);
    }

    const newTrackedFaces: TrackedFace[] = [];
    predictions.forEach((pred: FacePrediction, dataIndex: number) => {
      newTrackedFaces.push({ boundingBox: pred.bbox });
      if (dataIndex === 0) {
        const newEmotions = pred.emotions;

        // TODO collect the vector here and average it
        console.log(emotions)
        console.log(newEmotions)
        updateEmotionData(newEmotions);

        setEmotions(newEmotions);
        if (onCalibrate) {
          onCalibrate(newEmotions);
        }
      }
    });
    setTrackedFaces(newTrackedFaces);

    await capturePhoto();
  }

  async function socketOnClose(event: CloseEvent) {
    console.log("Socket closed");

    if (mountRef.current === true) {
      setStatus("Reconnecting");
      console.log("Component still mounted, will reconnect...");
      connect();
    } else {
      console.log("Component unmounted, will not reconnect...");
    }
  }

  async function socketOnError(event: Event) {
    console.error("Socket failed to connect: ", event);
    if (numReconnects.current >= maxReconnects) {
      setStatus(`Failed to connect to the Hume API (${authContext.environment}).
      Please log out and verify that your API key is correct.`);
      stopEverything();
    } else {
      numReconnects.current++;
      console.warn(`Connection attempt ${numReconnects.current}`);
    }
  }

  function stopEverything() {
    console.log("Stopping everything...");
    mountRef.current = false;
    const socket = socketRef.current;
    if (socket) {
      console.log("Closing socket");
      socket.close();
      socketRef.current = null;
    } else {
      console.warn("Could not close socket, not initialized yet");
    }
    const recorder = recorderRef.current;
    if (recorder) {
      console.log("Stopping recorder");
      recorder.stopRecording();
      recorderRef.current = null;
    } else {
      console.warn("Could not stop recorder, not initialized yet");
    }
  }

  async function onVideoReady(videoElement: HTMLVideoElement) {
    console.log("Video element is ready");

    if (!photoRef.current) {
      console.error("No photo element found");
      return;
    }

    if (!recorderRef.current && recorderCreated.current === false) {
      console.log("No recorder yet, creating one now");
      recorderCreated.current = true;
      const recorder = await VideoRecorder.create(videoElement, photoRef.current);

      recorderRef.current = recorder;
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("Socket open, will use the new recorder");
        await capturePhoto();
      } else {
        console.warn("No socket available for sending photos");
      }
    }
  }

  async function capturePhoto() {
    const recorder = recorderRef.current;

    if (!recorder) {
      console.error("No recorder found");
      return;
    }

    const photoBlob = await recorder.takePhoto();
    sendRequest(photoBlob);
  }

  async function sendRequest(photoBlob: Blob) {
    const socket = socketRef.current;

    if (!socket) {
      console.error("No socket found");
      return;
    }

    const encodedBlob = await blobToBase64(photoBlob);
    const requestData = JSON.stringify({
      data: encodedBlob,
      models: {
        face: {},
      },
    });

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(requestData);
    } else {
      console.error("Socket connection not open. Will not capture a photo");
      socket.close();
    }
  }
  function AlbumComponent() {
    const handlePlaySong = (index: number) => {
      finalizeEmotionMeasurements();
      setCurrentSong(index);
      setCurrentSongEmotions(new Map());
    };

    return (
        <div>
          {albumCovers.map((url, index) => (
              <div className="tooltip" key={index}>
                <img src={url} style={{ width: 200, height: 200, margin: 0 }} onClick={() => handlePlaySong(index)} />
                <span className="tooltiptext">{`${trackInfo[index]["artist"]} - ${trackInfo[index]["name"]}`}</span>
              </div>
          ))}
        </div>
    );
  }

  const finalizeEmotionMeasurements = () => {
    console.log(`Emotion averages: ${JSON.stringify(currentSongEmotions, null, 2)}`);
    // Compute averages
    let emotionAverages: Record<string, number>  = {};
    for (let [emotion, data] of currentSongEmotions) {
      emotionAverages[emotion] = data.sum / data.count;
    }

    console.log(`Emotion averages: ${JSON.stringify(emotionAverages, null, 2)}`);

    // Sort emotions by average score and select top 3
    let top3Emotions = Object.entries(emotionAverages)
        .sort((a, b) => b[1] - a[1])   // sort in descending order of score
        .slice(0, 3)                    // take top 3
        .map(([name, score]) => ({name, score})); // map to desired format

    // Create payload
    let payload = {
      userID: userID,
      userName: userName,
      artistName: trackInfo[currentSong] ? trackInfo[currentSong]["artist"] : 'Unknown',
      songName: trackInfo[currentSong] ? trackInfo[currentSong]["name"] : 'Unknown',
      top3Emotions: top3Emotions,
    };

    // Send payload to backend
    axios.post('http://127.0.0.1:5001/emotions', payload)
        .then(response => {
          console.log(response.data);
        })
        .catch(error => {
          console.error(error);
        });

    // Reset currentSongEmotions for the next song
    setCurrentSongEmotions(new Map());
  }



  useEffect(() => {
    currentTrackID = currentSong;
    console.log(currentSong);
    // Update the 'uris' prop with the new track URI or any other relevant logic
    // Example: setUris([trackURI]);
  }, [currentSong]);

  // useEffect(() => {
  //   receivedUserName = userName;
  //   receivedUserID = userID;
  // }, [userName, userID]);


  return (
    <div>
      <h1>{`${userName == null ? 'Current user' : userName}'s recent tracks`}</h1>
      <SpotifyPlayer
          token="BQD3DzTKuMtgsNCq7FUHa2l6PHs6nLMUgV_enjEYAIURKs2O4FdG4pVBoZBC_kpWs1CHMoBGxoFmj2-w-TQ_mHjvUy_fbMxFXjUqZUB6cJ9cIywO4yo7maqE6hFo1Rt1AkMNd1nw_DL3ddMa3_Zgba0eWrKqk0s76-pzde_HJoMTctOgIkK54v36ZjmksNk0lsRDSYyTdsxGSQ79_i8mNcDL1-ZwMV9m"
          uris={[`${trackInfo[currentTrackID] ? trackInfo[currentTrackID].uri : 'spotify:track:6rqhFgbbKwnb9MLmUQDhG6'}`]}
      />;

      <div className="md:flex">
        <FaceTrackedVideo
          className="mb-6"
          onVideoReady={onVideoReady}
          trackedFaces={trackedFaces}
          width={500}
          height={375}
        />
        {!onCalibrate && (
          <div className="ml-10">
            <TopEmotions emotions={emotions} />
            <LoaderSet
              className="mt-8 ml-5"
              emotionNames={loaderNames}
              emotions={emotions}
              numLevels={numLoaderLevels}
            />
            <Descriptor className="mt-8" emotions={emotions} />
          </div>
        )}
        <div style={{maxWidth: '40vw', maxHeight: '100vw'}}>
          <AlbumComponent />
        </div>
      </div>


      <div className="pt-6">{status}</div>
      <canvas className="hidden" ref={photoRef}></canvas>
    </div>
  );
}

FaceWidgets.defaultProps = {
  onCalibrate: None,
};
