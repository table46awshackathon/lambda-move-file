"use strict";

const _ = require('lodash');
const aws = require('aws-sdk');
const s3 = new aws.S3({apiVersion: '2006-03-01', region: 'us-west-2'});

exports.handler = function(event, context, callback) {
  if ('Records' in event) {
    _.each(event.Records, (record) => {
      process(record);
    });
  } else {
    console.log('Invalid event');
    console.log(JSON.stringify(event));
  }
}

function process(record) {
  if (record.eventSource !== "aws:s3") {
    console.log(`Invalid event source: ${record.eventSource}`);
    return;
  }

  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

  const targetBucket = 'table46hackathondata';
  const targetKey = 'pii/all.csv';

  copyObject(bucket, key, targetBucket, targetKey)
    .then(() => removeObject(bucket, key))
    .then(() => removeObject(bucket, key + '.metadata'))
    .catch(error => {
      console.log(error);
    });
}

function copyObject(bucket, key, targetBucket, targetKey) {
  console.log(`Copy file from ${bucket}/${key} => ${targetBucket}/${targetKey}`);
  var params = {
   Bucket: targetBucket,
   CopySource: `/${bucket}/${key}`,
   Key: targetKey
  };
  return s3.copyObject(params).promise();
}

function removeObject(bucket, key) {
  console.log(`Delete ${bucket}/${key}`);
  var params = {
   Bucket: bucket,
   Key: key
  };
  return s3.deleteObject(params).promise();
}
