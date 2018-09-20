const nodegit = require('nodegit'),
    escomplex = require('typhonjs-escomplex'),
    path = require("path"),
    orm = require("./orm"),
    localPath = require("path").join(__dirname, "tmp");

var Model;

function isBuggy(message) {
  return /fix|bug|error/gi.test(message);
}

function getCodeMetrics(source) {
  try {
    const m = escomplex.analyzeModule(source);
    return {
      "physical_sloc": m.methodAggregate.sloc.physical,
      "logical_sloc": m.methodAggregate.sloc.logical,
      "cyclomatic": m.methodAggregate.cyclomatic,
      "cyclomatic_density": m.methodAggregate.cyclomaticDensity,
      "halstead_length": m.methodAggregate.halstead.length,
      "halstead_vocabulary": m.methodAggregate.halstead.vocabulary,
      "halstead_difficulty": m.methodAggregate.halstead.difficulty,
      "halstead_volume": m.methodAggregate.halstead.volume,
      "halstead_effort": m.methodAggregate.halstead.effort,
      "halstead_bugs": m.methodAggregate.halstead.bugs,
      "halstead_time": m.methodAggregate.halstead.time,
      "function_count": m.methods.length,
      "dependency_count": m.dependencies.length,
      "maintainability": m.maintainability,
      "valid": true
    }

  } catch(err){
    console.log("Escomplex error: "+err+"\nSource: "+source);
    return {
      "physical_sloc": 0,
      "logical_sloc": 0,
      "cyclomatic": 0,
      "cyclomatic_density": 0,
      "halstead_length": 0,
      "halstead_vocabulary": 0,
      "halstead_difficulty": 0,
      "halstead_volume": 0,
      "halstead_effort": 0,
      "halstead_bugs": 0,
      "halstead_time": 0,
      "function_count": 0,
      "dependency_count": 0,
      "maintainability": 0,
      "valid": false
    };
  }
}

async function save(repo, history, fileName, buggy){
  const commit = await repo.getCommit(history[0]['commit'].id());
  const entry = await commit.getEntry(fileName);
  const source = await entry.getBlob();
  console.log(/test/gi.test(fileName));
  console.log(fileName);
  console.log("---");
  const codeMetrics = getCodeMetrics(source.toString());

  var authors = [];
  var processMetrics = {
    "total_deletions": 0,
    "total_additions": 0,
    "additions": null,
    "deletions": null,
    "time_since_bug": -1,
    "commit_count": history.length,
    "author_count": null,
    "is_buggy": buggy
  };

  for(const historyEntry of history){
    historyCommit = historyEntry['commit'];

    authors.push(historyCommit.author().email+historyCommit.author().name);

    if (historyCommit.sha() != commit.sha()) {
      const delta = commit.timeMs() - historyCommit.timeMs();
      if (isBuggy(historyCommit.message()) && (delta < processMetrics["time_since_bug"] || processMetrics["time_since_bug"] < 0 )){
        processMetrics["time_since_bug"] = delta;
      }
    }

    const diffList = await commit.getDiff();
    for(const diff of diffList){
      const patches = await diff.patches();
      for(const patch of patches){
        // even though history is for single file, commit still gives us all files so we must check first
        if (patch.newFile().path() == fileName || patch.oldFile().path == fileName) {
          for (var key of ["total_deletions", "total_additions"]) {
            processMetrics[key] += patch.lineStats()[key];
          }
          lineStats = patch.lineStats()
          processMetrics["total_additions"] += lineStats["total_additions"];
          processMetrics["total_deletions"] += lineStats["total_deletions"];
          if (processMetrics["additions"] == null) { // set only once
            processMetrics["additions"] = lineStats["total_additions"];
          }
          if (processMetrics["deletions"] == null) { // set only once
            processMetrics["deletions"] = lineStats["total_deletions"];
          }
        }
      }
    }
  }
  processMetrics["author_count"] = [...new Set(authors)].length;

  const metrics = {
    ...codeMetrics,
    ...processMetrics,
    ...{ "filename": fileName+"@"+history[0]['commit'].id() }
  }
  return Model.create(metrics);
}

async function saveMetrics(cloneURL) {
  Model = await orm.getCollection();

  console.log("Cloning repo: "+cloneURL);
  const repo = await nodegit.Clone(cloneURL, localPath, {}).catch(function (){
    console.log("Error, now trying local!");
    return nodegit.Repository.open(localPath);
  });

  firstCommit = await repo.getMasterCommit();
  const history = firstCommit.history(nodegit.Revwalk.SORT.TIME);

  history.on("end", async function (commits) {
    for(const commit of commits){
      if (isBuggy(commit.message())){
        //see which files were affected by this commit
        const diffList = await commit.getDiff();
        for(const diff of diffList){
          const patches = await diff.patches();
          for(const patch of patches){
            const fileName = patch.newFile().path();
            // let's ignore all non-js files, new additions and deletions
            if (/.*\.js$/gi.test(fileName) && !(/spec\/|test\//gi.test(fileName)) && !patch.isDeleted() && !patch.isAdded()) {

              var walker = repo.createRevWalk();
              walker.push(commit.sha());
              walker.sorting(nodegit.Revwalk.SORT.Time);
              const historyCommits = await walker.fileHistoryWalk(fileName, 10000);

              save(repo, historyCommits, fileName, false); //save good mertics
              save(repo, historyCommits.slice(1), fileName, true); // save buggy metrics
            }
          }
        }
      }
    }
  });

  history.start();
}

module.exports = { saveMetrics, save };
