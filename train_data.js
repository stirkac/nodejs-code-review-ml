const fileMetrics = require('./file_metrics');

if (process.argv.length < 3) {
  console.log("supply a file");
  process.exit(1);
} else {
  fileMetrics.saveMetrics(process.argv[2]);
}
