const fileMetrics = require('./file_metrics');
const repositories = ["https://github.com/keystonejs/keystone"];

for(const repo of repositories){
  fileMetrics.saveMetrics(repo);
}

return;