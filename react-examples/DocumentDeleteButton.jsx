import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const deleteDocument = gql`
  mutation deleteDocument( $documentId: ID! ) {
    deleteDocument(id: $documentId) {
      id
    }
  }
`;

const handleDeleteDocument = (documentId, deleteDocument) => {
  const variables = { documentId };
  deleteDocument({ variables })
  .then( response => console.log('Document successfully deleted', response) )
  .catch( e => console.log('Document not deleted', e) )
}


const DocumentDeleteButton = ({ documentId, deleteDocument }) => 
    <button 
      type="button"
      className="btn btn-outline-danger btn-xs"
      onClick={ () => handleDeleteDocument(documentId, deleteDocument)} >
      Delete
    </button>

export default graphql(deleteDocument, {name: 'deleteDocument'})(DocumentDeleteButton)