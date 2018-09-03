const Waterline = require('waterline'),
  postgres = require('sails-postgresql'),
  waterline = new Waterline();

function getCollection(){
  var metricCollection = Waterline.Collection.extend({
    identity: 'code_metric',
    datastore: 'default',
    primaryKey: 'id',

    attributes: {
      id: {
          type: 'number',
          autoMigrations: {autoIncrement: true}
      },
      physical_sloc: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      logical_sloc: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      cyclomatic: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      cyclomatic_density: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      halstead_length: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      halstead_vocabulary: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      halstead_difficulty: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      halstead_volume: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      halstead_effort: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      halstead_bugs: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      halstead_time: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      function_count: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      dependency_count: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      maintainability: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      valid: {type: 'boolean'},
      total_deletions: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      total_additions: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      additions: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      deletions: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      time_since_bug: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      commit_count: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      author_count: {type: 'number', autoMigrations: { columnType: 'FLOAT'}},
      filename: {type: 'string' },
      is_buggy: {type: 'boolean'},
    }
  });
  var config = {
    adapters: {
      'postgres': postgres
    },

    datastores: {
      default: {
        adapter: 'postgres',
        url: 'postgresql://stirkac@localhost:5432/code_review',
      }
    }
  };

  waterline.registerModel(metricCollection);
  promise = new Promise(function (resolve, reject){
    waterline.initialize(config, function (err, ontology) {
      if (err) {
        reject(err);
      } else {
        resolve(ontology.collections.code_metric);
      }
    });
  });

  return promise;
}

module.exports = { getCollection }
