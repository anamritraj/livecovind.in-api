const moment = require("moment");

const { getAllDataFromFirebase } = require('./firebase-service');
let indianStateTimeseriesData = {};
let raceChartData = {};

const updateIndianStatesTimeSeriesData = () => {
  // eslint-disable-next-line no-undef
  getAllDataFromFirebase('stateWiseTimeSeries').then((data) => {
    indianStateTimeseriesData = data;
    // Time to prepare data for raceCharts
    const barDataNew = [];
    Object.keys(data).forEach((key) => {
      // This is the data for one of the dates.
      // Need to convert it into {stateid, value}
      let dayData = Object.keys(data[key]).map(stateKey => {
        return {
          id: data[key][stateKey].name,
          value: data[key][stateKey].confirmed
        }
      })
      barDataNew.push({
        date: moment(key, "DD-MM-YYYY"),
        data: dayData
      })
    })
    let barDataSorted = barDataNew.sort((a, b) => a.date.isAfter(b.date) ? 1 : -1);
    barDataSorted = barDataSorted.map(daysData => {
      daysData.data.sort((a, b) => {
        if (a.id === 'Total') return -1;
        if (b.id === 'Total') return 1;
        return a.value - b.value;
      })

      return {
        date: daysData.date.format(),
        data: daysData.data.slice(daysData.data.length - 6, daysData.data.length)
      }
    })
    raceChartData = barDataSorted;
  })
}

updateIndianStatesTimeSeriesData();
setInterval(updateIndianStatesTimeSeriesData, 1000 * 60 * 4);

const getStatesTimeSeriesData = () => {
  return indianStateTimeseriesData;
}

const getRaceChartData = () => {
  return {
    raceChart: raceChartData
  };
}

module.exports = {
  getStatesTimeSeriesData,
  getRaceChartData
}