const tf = require('@tensorflow/tfjs');
const tf_cpu = require('@tensorflow/tfjs-node'); // run on CPU
const data = require('./data');

const NUM_EPOCHS = 10000;
const BATCH_SIZE = 1000;
const TEST_SIZE = 200;

async function run() {

  const [xTrain, yTrain, xTest, yTest] = await data.getData(0.15);
  const model = await data.getModel();

  const history = model.fit(xTrain, yTrain, {
    epochs: NUM_EPOCHS,
    validationData: [xTest, yTest],
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        // Plot the loss and accuracy values at the end of every training epoch.
        // epoch, logs.loss, logs.val_loss);
        // epoch, logs.acc, logs.val_acc);
        console.log("epoch: ",logs.val_loss, logs.val_acc);
      },
    }
  });
}

run();