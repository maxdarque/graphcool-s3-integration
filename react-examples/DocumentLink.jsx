import React from 'react'
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const getFileDownloadUrl = gql`
  mutation getFileDownloadUrl($fileId: ID!) {
    getFileDownloadUrl(fileId: $fileId) {
      fileDownloadUrl
    }
  }
`

const handleFileDownload = (fileId, getFileDownloadUrl) => {
  const variables = { fileId }
  getFileDownloadUrl({ variables })
  .then( response => {
    const fileDownloadUrl = response.data.getFileDownloadUrl.fileDownloadUrl
    console.log('download url', fileDownloadUrl)
    window.open(fileDownloadUrl, '_blank')
  })
  .catch( e => console.log('ERROR getting download URL:', e) )
}

const DocumentLink = ({ document, getFileDownloadUrl }) => 
  <button
    type='button'
    className="btn btn-link p-0 small"
    onClick={() => handleFileDownload(document.id, getFileDownloadUrl)}>
    {document.name}
  </button>

export default graphql(getFileDownloadUrl, { name: 'getFileDownloadUrl'})(DocumentLink);