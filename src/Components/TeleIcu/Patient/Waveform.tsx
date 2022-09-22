import { useEffect, useState } from "react";
import { LinePlot } from "../../Facility/Consultations/components/LinePlot";

export type WaveformType = {
  data: string;
  "data-baseline": number;
  "data-high-limit": number;
  "data-low-limit": number;
  "date-time": string;
  device_id: string;
  observation_id: "waveform";
  "patient-id": number;
  "patient-name": string;
  resolution: `${number}uV`;
  "sampling rate": `${number}/sec`;
  "wave-name": string;
};

export default function Waveform(props: { wave: WaveformType, color?: string, title: string, metrics?: boolean, classes?: string, defaultSpace?: boolean }) {
  const wave = props.wave;
  const data = wave.data.split(" ").map(Number);
  const [queueData, setQueueData] = useState<number[]>([]);
  const [xData, setXData] = useState<number[]>([]);
  const [lastStream, setLastStream] = useState(0);

  const viewable = 400;
  const tpf = 4000 / data.length;

  useEffect(() => {
    setQueueData(queueData.concat(data));
    setXData(Array.from(Array(viewable).keys()));
    
    let seconds = 1;
    setLastStream(0);
    let timer = setInterval(() => {
      setLastStream(seconds);
      seconds++;
    }, 1000);
    return () => clearInterval(timer);
  }, [props]);

  useEffect(() => {
    let timeout = setTimeout(() => {
      setQueueData(queueData.slice(1));
    }, tpf);
    return () => clearTimeout(timeout);
  }, [queueData]);

  return (
    <div className="w-full relative">
      <div className="text-gray-400 absolute top-0 left-5 text-xs">
        {props.title}
      </div>
      <LinePlot
        title={props.title}
        name={props.title}
        xData={xData}
        yData={queueData.slice(0, viewable)}
        yStart={Math.min(...queueData)}
        yEnd={Math.max(...queueData)}
        classes={props.classes || "h-[90px]"}
        type="WAVEFORM"
        color={props.color || "green"}
        defaultSpace={props.defaultSpace}
      />
      <div className="absolute bottom-0 right-5 w-full md:w-[70%]">
        {props.metrics && (
          <div className="flex flex-row flex-wrap justify-end gap-2 text-[10px] text-gray-400">
            <div>
              Lowest: {Math.min(...queueData.slice(0, viewable))}
            </div>
            <div>
              Highest: {Math.max(...queueData.slice(0, viewable))}
            </div>
            <div>
              Stream Length: {data.length}
            </div>
            <div>
              Buffer Length: {queueData.length}
            </div>
            <div>
              Flow Rate: {Number(tpf).toFixed(2)} ms
            </div>
            <div>
              Sampling Rate: {wave["sampling rate"]}
            </div>
            <div>
              Lag: {Number(tpf * (queueData.length - viewable) / 1000).toFixed(2)} sec
            </div>
            <div>
              Last response: {lastStream} sec ago
            </div>
            {queueData.length > viewable &&
            <button className="text-blue-400" onClick={()=>setQueueData(queueData.slice((-1*viewable)))}>
              Clear Buffer
            </button>
            }
          </div>
        )}
      </div>
    </div>
  );
}
