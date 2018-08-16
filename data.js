const tf = require('@tensorflow/tfjs');
const orm = require('./orm');

const CLASSES = ['buggy', 'clean'];
const LEARNING_RATE = 0.01;

var rawMetrics = null;

async function load(){
  console.log("DB load...");
  const Metric = await orm.getCollection();
  rawMetrics = await Metric.find().limit(10000); // TODO: improve and randomize sampling, maybe load by batches
  return rawMetrics
}

async function getModel() {
  if (rawMetrics == null) {
    load();
  }

  const model = tf.sequential();

  model.add(tf.layers.dense(
    {
      units: 150,
      inputShape: [Object.keys(rawMetrics[0]).length - 1], // how many cols we get minus label
      activation: 'sigmoid'
    }
  ));

  model.add(tf.layers.dense(
    {
      units: 2,
      activation: 'softmax'
    }
  ));

  const optimizer = tf.train.adam(LEARNING_RATE);
  model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  return model;
}

async function getData(testSplit) {
  if (rawMetrics == null) {
    await load();
  }

  return tf.tidy(() => {

    const xTrains = [];
    const yTrains = [];
    const xTests = [];
    const yTests = [];
    const dataByClass = [];
    const targetsByClass = [];
    for (let i = 0; i < CLASSES.length; ++i) {
      dataByClass.push([]);
      targetsByClass.push([]);
    }
    for (const row of rawMetrics) {
      example = Object.values(row);
      const target = example[example.length - 1] ? 1 : 0;
      const data = example.slice(0, example.length - 1);
      console.log("data: "+data);
      console.log("target: "+target);
      dataByClass[target].push(data);
      targetsByClass[target].push(target);
    }
    for (let i = 0; i < CLASSES.length; ++i) {
      const [xTrain, yTrain, xTest, yTest] =
          convertToTensors(dataByClass[i], targetsByClass[i], testSplit);
      xTrains.push(xTrain);
      yTrains.push(yTrain);
      xTests.push(xTest);
      yTests.push(yTest);
    }
    const concatAxis = 0;
    return [
      tf.concat(xTrains, concatAxis), tf.concat(yTrains, concatAxis),
      tf.concat(xTests, concatAxis), tf.concat(yTests, concatAxis)
    ];
  });
}


function convertToTensors(data, targets, testSplit) {
  const numExamples = data.length;
  if (numExamples !== targets.length) {
    throw new Error('data and split have different numbers of examples');
  }

  const numTestExamples = Math.round(numExamples * testSplit);
  const numTrainExamples = numExamples - numTestExamples;

  const xDims = data[0].length;

  // Create a 2D `tf.Tensor` to hold the feature data.
  const xs = tf.tensor2d(data, [numExamples, xDims]);

  // Create a 1D `tf.Tensor` to hold the labels using one-hot encoding
  const ys = tf.oneHot(tf.tensor1d(targets).toInt(), CLASSES.length);

  // Split the data into training and test sets, using `slice`.
  const xTrain = xs.slice([0, 0], [numTrainExamples, xDims]);
  const xTest = xs.slice([numTrainExamples, 0], [numTestExamples, xDims]);
  const yTrain = ys.slice([0, 0], [numTrainExamples, CLASSES.length]);
  const yTest = ys.slice([0, 0], [numTestExamples, CLASSES.length]);
  return [xTrain, yTrain, xTest, yTest];
}

module.exports = { getData, getModel };