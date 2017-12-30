import React from 'react';
import { graphql, compose } from 'react-apollo';
import axios from 'axios';
import Dropzone from 'react-dropzone'
const uuidv4 = require('uuid/v4')

const getFileUploadUrl = gql`
  mutation getFileUploadUrl($parentId: ID!, $fileName: String!, $tags: Json) {
    getFileUploadUrl(
      parentId: $parentId
      fileName: $fileName
      tags: $tags
    ) {
      uploadUrl
      fileKey
    }
  }
`

const createDocument = gql`
  mutation createDocument($name: String! $fileKey: String!) {
    createDocument(name: $name fileKey: $fileKey) {
      id
      name
      fileKey
    }
  }
`;

export class DocumentUploader extends React.Component {

  constructor (props) {
    super(props);
    this.state = { files: [] }
  }

  onDrop (files) {
    if (files.length === 0) {
      console.log('No PDF or Excel files were dropped');
    } else {
      files.forEach(file => file.userInterfaceId = uuidv4() );
      this.setState( {files: [...files, ...this.state.files]} )
    }
  }

  getTags (file) {
    const tags = {
      EXAMPLE_TAG: "example file tag",
      OTHER_EXAMPLE_TAG: "second example tag"
    }
    return tags
  }

  getTagging (tags) {
    let tagging = "";
    if (tags && typeof tags === "object") {
      Object.keys(tags).map( x => {
        const newTag = `${x}=${tags[x]}`
        tagging =  tagging==="" ? newTag : `${tagging}&${newTag}`
      })
    }
    return tagging
  }

  uploadFiles () {
    this.state.files.forEach( file => {
      const tags = this.getTags(file)
      const variables = { 
        parentId: this.props.fundId,
        fileName: file.name,
        tags
      }
      this.props.getFileUploadUrl({ variables })
      .then( response => {
        console.log('File upload URL', response);
        const { uploadUrl, fileKey } = response.data.getFileUploadUrl
        this.uploadFile(file, uploadUrl, fileKey, tags)
      })
      .catch( e => console.log('error', e) )
    })
  }

  uploadFile (file, uploadUrl, fileKey, tags) {
    const config = { 
      headers: {
        'Content-Type': file.type,
        'x-amz-tagging': this.getTagging(tags)
      } 
    }
    axios.put(uploadUrl, file, config)
    .then( response => {
      console.log('file upload response', response)
      this.createDocument(file, fileKey)
    })
    .catch( e => console.log(' e.response', e.response) )
  }
  
  createDocument (file, fileKey) {
    let variables = { name: file.name, fileKey }
    this.props.createDocumentOnFund({ variables })
    .then( response => console.log('Document successfully added', response) )
    .catch( e => console.log('error', e) )
  }

  clearFiles () {
    this.setState({ files: [] })
  }

  // PDF files accept="application/pdf"
  // Excel files: accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
  // Word files: accept="application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  // PDF and Excel files: accept="application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
  render () {
    const { files } = this.state

    return (
      <div className="container">
        <h4 className="text-primary text-left pt-2">Upload documents</h4>
        <div className="card bg-light p-2 my-3">
          <Dropzone
            className="m-1 text-center w-97"
            style={{height: "7rem"}}
            onDrop={ acceptedFiles => this.onDrop(acceptedFiles)}
            multiple={true}
            accept="application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" >
            <div className="user-message h5">Drag and drop PDFs and Excel files or click to upload</div>
          </Dropzone>
        </div>
        {files.length !== 0 &&
        <div className="mt-2">
          <div className="">
            <button type="button" className="btn btn-primary btn-sm mx-1" onClick={() => this.uploadFiles()}>Upload</button>
            <button type="button" className="btn btn-primary btn-sm mx-1" onClick={() => this.clearFiles()}>Clear</button>
          </div>
          {filteredFiles.map( file => <div key={file.userInterfaceId}>{file.name}</div>)}
        </div>}
      </div>
    )
  }
}

export default compose(
  graphql(getFileUploadUrl, {name: 'getFileUploadUrl'}),
  graphql(createDocument, {name: 'createDocument'})
)(DocumentUploader)