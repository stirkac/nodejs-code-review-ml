const tf = require('@tensorflow/tfjs');
const tf_cpu = require('@tensorflow/tfjs-node'); // run on CPU
const data = require('./data');

const TEST_SPLIT = 0.15;
const NUM_EPOCHS = 200;

async function run() {

  const [xTrain, yTrain, xTest, yTest] = await data.getData(TEST_SPLIT);
  const model = await data.getModel();

  const history = model.fit(xTrain, yTrain, {
    epochs: NUM_EPOCHS,
    validationData: [xTest, yTest],
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        // See the loss and accuracy values at the end of every training epoch.
        console.log((1 + epoch) + ": ", logs.val_loss, logs.val_acc);
      },
    }
  });
}

run();
