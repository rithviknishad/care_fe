import ReactECharts from "echarts-for-react";

export const LinePlot = (props: any) => {
  const { title, name, xData, yData, low = null, high = null, defaultSpace } = props;
  let generalOptions: any = {
    title: {
      text: `${title} [ {0|${yData[yData.length - 1]?.toFixed(2) || "NA"}} ]`,
      textStyle: {
        fontSize: 20,
        rich: {
          0: {
            fontSize: 14,
            fontWeight: "bold",
            padding: [0, 5],
            color: "#5470C6",
          },
        },
      },
    },
    legend: {
      data: [name],
      type: "scroll",
      bottom: "3%",
    },
    tooltip: {
      trigger: "axis",
    },
    toolbox: {
      show: true,
      feature: {
        dataZoom: {
          yAxisIndex: "none",
        },
        magicType: { type: ["line", "bar"] },
        saveAsImage: {},
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: xData,
      axisLabel: {
        width: 100,
        overflow: "break",
      },
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: name,
        type: "line",
        stack: name,
        data: yData,
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            opacity: 0.5,
            colorStops: [
              {
                offset: 0,
                color: "blue",
              },
              {
                offset: 1,
                color: "white",
              },
            ],
          },
        },
        connectNulls: true,
      },
    ],
  };

  if (props.type && props.type === "WAVEFORM") {
    generalOptions = {
      ...generalOptions,
      title: {
        text: ``,
      },
      grid: {
        left: "15px",
        right: "15px",
      },
      animation: false,
      xAxis: {
        ...generalOptions.xAxis,
        show: false,
      },
      yAxis: {
        ...generalOptions.yAxis,
        show: false,
        min: props.yStart,
        max: props.yEnd,
      },
      toolbox: {
        ...generalOptions.toolbox,
        show: false,
      },
      legend: {
        show: false,
      },
      series: [
        {
          ...generalOptions.series[0],
          showSymbol: false,
          lineStyle: { color: props.color },
          areaStyle: {
            ...generalOptions.series[0].areaStyle,
            color: {
              ...generalOptions.series[0].areaStyle.color,
              colorStops: [
                {
                  offset: 0,
                  color: "transparent",
                },
                {
                  offset: 1,
                  color: "transparent",
                },
              ],
            },
          },
        },
      ],
    };
  }

  if(!defaultSpace){
    generalOptions = {
      ...generalOptions,
      grid: {
        ...generalOptions.grid,
        top: "20px",
        bottom: "20px",
      }
    }
  }

  const visualMap: any = {
    visualMap: {
      type: "piecewise",
      show: false,
      dimension: 1,
      pieces: [
        {
          gt: high,
          color: "red",
        },
        {
          lte: high,
          gte: low,
          color: "blue",
        },
        {
          lt: low,
          color: "red",
        },
      ],
    },
  };

  if (high && low) {
    generalOptions = { ...generalOptions, ...visualMap };
  }

  return (
    <ReactECharts
      option={generalOptions}
      className={props.classes}
      lazyUpdate={props.type === "WAVEFORM"}
    />
  );
};
