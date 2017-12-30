// getFileUploadUrl

import { FunctionEvent } from 'graphcool-lib'
import * as AWS from 'aws-sdk'
import * as uuidv4 from 'uuid/v4'

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

interface EventData {
  parentId: string
  fileName: string
  tags?: any
}

const encodeS3URI = (filename: string): string => {
  return encodeURI(filename) // Do the standard url encoding
              .replace(/\+/img, "")
              .replace(/\!/img, "")
              .replace(/\"/img, "")
              .replace(/\#/img, "")
              .replace(/\$/img, "")
              .replace(/\&/img, "")
              .replace(/\'/img, "")
              .replace(/\(/img, "")
              .replace(/\)/img, "")
              .replace(/\*/img, "")
              .replace(/\+/img, "")
              .replace(/\,/img, "")
              .replace(/\:/img, "")
              .replace(/\;/img, "")
              .replace(/\=/img, "")
              .replace(/\?/img, "")
              .replace(/\@/img, "");
}

const getTagging = (tags: any): string => {
  let tagging: string = "";
  if (tags && typeof tags === "object") {
    Object.keys(tags).map( x => {
      const newTag = `${x}=${tags[x]}`
      tagging =  tagging==="" ? newTag : `${tagging}&${newTag}`
    })
  }
  return tagging
}

export default async (event: FunctionEvent<EventData>) => {
  
  if (!event.context.auth || !event.context.auth.nodeId) {
    return { error: 'No user logged in.' }
  }

  try {
    const { parentId, fileName, tags } = event.data;
    const fileKey: string = parentId + "/" + uuidv4() + "/" + encodeS3URI(fileName)
    const tagging = getTagging(tags)
    
    const params = { 
      Bucket: AWS_BUCKET_GP_FILES,
      Key: fileKey,
      Expires: SIGNED_URL_EXPIRES_SECONDS,
      Tagging: tagging==="" ? null : tagging
    }

    const uploadUrl: string = await s3.getSignedUrl('putObject', params)
    
    if (!uploadUrl) {
      return { error: 'Unable to get presigned upload URL from S3' }
    }
    
    return { data: { uploadUrl, fileKey } }
  } catch (e) {
    console.log(e)
    return { error: 'An unexpected error occured while getting the presigned upload URL' }
  }
}