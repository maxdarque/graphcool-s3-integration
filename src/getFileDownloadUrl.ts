// getFileDownloadUrl
import Graphcool from 'graphcool-lib'
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

const SIGNED_URL_EXPIRES_SECONDS = 60*10;

interface EventData { fileId: string }

interface Document {
  id: string
  fileKey: string
}

export default async (event: FunctionEvent<EventData>) => {
  
  if (!event.context.auth || !event.context.auth.nodeId) {
    return { error: 'No user logged in.' }
  }

  try {
    // create graphcool api using the user's token
    const graphcool = new Graphcool(
      event.context.graphcool.serviceId || event.context.graphcool.projectId!,
      {
        token: event.context.auth.token,
        endpoints: event.context.graphcool.endpoints,
      },
    ) 
    const api = graphcool.api('simple/v1')
    const { fileId } = event.data;

    //Is the user allowed to access the file?
    const document: Document = await getDocument(api, fileId)

    if (!document) {
      return { error: 'Document does not exist or insufficient permissions' }
    }
    
    const params = { 
      Bucket: AWS_BUCKET_GP_FILES,
      Key: document.fileKey,
      Expires: SIGNED_URL_EXPIRES_SECONDS,
    }

    const fileDownloadUrl: string = await s3.getSignedUrl('getObject', params)
    
    if (!fileDownloadUrl) {
      return { error: 'Unable to get presigned download URL from S3' }
    }
    
    return { data: { fileDownloadUrl } }
  } catch (e) {
    console.log(e)
    return { error: 'An unexpected error occured while getting the presigned download URL.' }
  }
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