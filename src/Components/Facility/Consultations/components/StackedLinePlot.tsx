import ReactECharts from "echarts-for-react";

const COLORS = ["#B13F3C", "#2F8B35", "#44327A", "#B19D3C"];

export const StackedLinePlot = (props: any) => {
  const { title, xData, yData } = props;

  const series = yData.map((x: any) => ({
    name: x.name,
    type: "line",
    stack: x.name,
    data: x.data.map((d: any) => Math.round(d * 100) / 100),
    connectNulls: true,
  }));

  const generalOptions = {
    color: COLORS,
    title: {
      text:
        title +
        " [ " +
        yData
          .map(
            (x: any, i: number) =>
              `{${i}|${x.data[x.data.length - 1]?.toFixed(2) ?? "NA"}}`
          )
          .join(" | ") +
        " ] ",
      textStyle: {
        fontSize: 14,
        rich: Object.assign(
          {},
          COLORS.map((x: any) => ({
            fontSize: 14,
            fontWeight: "bold",
            padding: [0, 5],
            color: x,
          }))
        ),
      },
    },

    legend: {
      data: yData.map((x: any) => x.name),
      type: "scroll",
      bottom: "3%",
    },
    tooltip: {
      trigger: "axis",
    },
    toolbox: {
      show: true,
      orient: "vertical",
      top: "9%",
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
    series: series,
  };
  return <ReactECharts option={generalOptions} />;
};
