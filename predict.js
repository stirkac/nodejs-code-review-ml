const tf = require('@tensorflow/tfjs');
const tf_cpu = require('@tensorflow/tfjs-node'); // run on CPU
const nodegit = require('nodegit');
const localPath = require("path").join(__dirname, "tmp");
const data = require('./data');
const fileMetrics = require('./file_metrics');


if (process.argv.length < 3) {
  console.log("supply a file");
  process.exit(1);
} else {
  run(process.argv[2]);
}

async function run(filename){
  const repo = await nodegit.Repository.open(localPath);
  const firstCommitOnMaster = await repo.getMasterCommit();
  walker = repo.createRevWalk();
  walker.push(firstCommitOnMaster.sha());
  walker.sorting(nodegit.Revwalk.SORT.Time);
  const historyCommits = walker.fileHistoryWalk(filename, 10000);
  metrics = await fileMetrics.save(repo, historyCommits, filename, null);
  metricsValues = Object.values(metrics);

  const input = tf.tensor2d([Object.values(metricsValues)], [1, metricsValues.length]);

  const model = await tf.loadModel('file://saved-model/model.json');
  const predictOut = model.predict(input);
  const logits = Array.from(predictOut.dataSync());
  const winner = data.CLASSES[predictOut.argMax(-1).dataSync()[0]];
}
