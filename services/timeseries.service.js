const moment = require("moment");
const population = require('./population.json');


const { getAllDataFromFirebase } = require('./firebase-service');
let indianStateTimeseriesData = {};
let raceChartData = {};

const calculateCasesPerMillion = (cases, stateKey) => {
  const statePopulation = population[stateKey];
  if (typeof cases === 'object') {
    return {
      ...cases,
      activePerMillion: Math.round((Number(cases['active']) / statePopulation) * 1000000),
      confirmedPerMillion: Math.round((Number(cases['confirmed']) / statePopulation) * 1000000),
      deathsPerMillion: Math.round((Number(cases['deaths']) / statePopulation) * 1000000),
      recoveredPerMillion: Math.round((Number(cases['recovered']) / statePopulation) * 1000000),
    }
  }
  return Math.round((Number(cases) / statePopulation) * 1000000);
}

const getMaxObjectForDay = (data) => {
  const maxValues = {
    deaths: 0,
    active: 0,
    confirmed: 0,
    recovered: 0,
    deathsPerMillion: 0,
    activePerMillion: 0,
    confirmedPerMillion: 0,
    recoveredPerMillion: 0
  }
  Object.keys(data).map(stateKey => {
    if (stateKey !== "undefined" && stateKey !== 'total') {
      maxValues.deaths = Math.max(data[stateKey].value.deaths, maxValues.deaths);
      maxValues.confirmed = Math.max(data[stateKey].value.confirmed, maxValues.confirmed);
      maxValues.active = Math.max(data[stateKey].value.active, maxValues.active);
      maxValues.recovered = Math.max(data[stateKey].value.recovered, maxValues.recovered);
      maxValues.deathsPerMillion = Math.max(calculateCasesPerMillion(data[stateKey].value.deaths, stateKey), maxValues.deathsPerMillion);
      maxValues.confirmedPerMillion = Math.max(calculateCasesPerMillion(data[stateKey].value.confirmed, stateKey), maxValues.confirmedPerMillion);
      maxValues.activePerMillion = Math.max(calculateCasesPerMillion(data[stateKey].value.active, stateKey), maxValues.activePerMillion);
      maxValues.recoveredPerMillion = Math.max(calculateCasesPerMillion(data[stateKey].value.recovered, stateKey), maxValues.recoveredPerMillion);
    }
  })
  return maxValues;
}
const updateIndianStatesTimeSeriesData = () => {
  // eslint-disable-next-line no-undef
  getAllDataFromFirebase('stateWiseTimeSeries').then((data) => {
    // Time to prepare data for raceCharts
    const barDataNew = [];
    const timeSeriesDatanew = [];
    Object.keys(data).forEach((key) => {
      // This is the data for one of the dates.
      // Need to convert it into {stateid, value}
      let raceDayData = Object.keys(data[key]).map(stateKey => {
        return {
          id: data[key][stateKey].name,
          value: data[key][stateKey].confirmed
        }
      })

      let timeSeriesDayData = {};
      Object.keys(data[key]).forEach(stateKey => {
        timeSeriesDayData[stateKey] = {
          name: data[key][stateKey].name,
          value: calculateCasesPerMillion(data[key][stateKey], stateKey)
        }
      })

      barDataNew.push({
        date: moment(key, "DD-MM-YYYY"),
        data: raceDayData
      })

      timeSeriesDatanew.push({
        date: moment(key, "DD-MM-YYYY"),
        data: timeSeriesDayData
      })
    })

    let barDataSorted = barDataNew.sort((a, b) => a.date.isAfter(b.date) ? 1 : -1);

    let timeSeriesDataSorted = timeSeriesDatanew.sort((a, b) => a.date.isAfter(b.date) ? 1 : -1);

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
    timeSeriesDataSorted = timeSeriesDataSorted.map(daysData => {
      return {
        date: daysData.date.format(),
        data: daysData.data,
        max: getMaxObjectForDay(daysData.data)
      }
    });
    raceChartData = barDataSorted;
    indianStateTimeseriesData = timeSeriesDataSorted;
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