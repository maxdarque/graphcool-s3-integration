// deleteFileFromS3

import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import * as AWS from 'aws-sdk'

const {
  AWS_BUCKET_GP_FILES,
  S3_AWS_ACCESS_KEY_ID,
  S3_AWS_SECRET_ACCESS_KEY,
  AWS_DEFAULT_REGION
} = process.env

const credentials = new AWS.Credentials({
  accessKeyId: S3_AWS_ACCESS_KEY_ID ? S3_AWS_ACCESS_KEY_ID : "",
  secretAccessKey: S3_AWS_SECRET_ACCESS_KEY ? S3_AWS_SECRET_ACCESS_KEY : ""
})

const awsConfig = new AWS.Config({
  region: AWS_DEFAULT_REGION,
  apiVersion: "2006-03-01",
  maxRetries: 5,
  credentials
});

const s3 = new AWS.S3(awsConfig);

interface EventData { id: string }

interface Document {
  id: string
  fileKey: string
}

export default async (event: FunctionEvent<EventData>) => {

  const api = fromEvent(event).api('simple/v1')
  const { id } = event.data;

  //get the fileKey
  const document: Document = await getDocument(api, id)

  if (!document) {
    return { error: 'Document does not exist or insufficient permissions' }
  }
  console.log('document', document)
  
  const params = { 
    Bucket: AWS_BUCKET_GP_FILES ? AWS_BUCKET_GP_FILES : "",
    Key: document.fileKey
  }

  return new Promise((resolve, reject) => {
    s3.deleteObject(params, (error, data) => {
      if (error) {
        console.log('Unable to delete file from S3', error, error.stack)
        throw new Error(error.message);
      }
      return resolve(event)
    })
  })
}

async function getDocument(api: GraphQLClient, id: string): Promise<Document> {
  const query = `
    query Document($id: ID!) {
      Document(id: $id) {
        id
        fileKey
      }
    }
  `
  const variables = { id }
  return api.request<{ Document }>(query, variables)
  .then(r => r.Document)
}